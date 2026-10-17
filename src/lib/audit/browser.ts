import { createRequire } from 'node:module';
import { chromium, type Browser, type BrowserContext, type LaunchOptions, type Page } from 'playwright-core';
import sharp from 'sharp';
import { VIEWPORT } from './contract';
import { assertPublicUrl } from './net';
import {
  collectFacts,
  installHelpers,
  motionAfterReduce,
  readFocus,
  runAxe,
  type AxeRuleResult,
  type Box,
  type FocusStop,
  type PageFacts,
} from './probe';
import {
  TOAST_WATCH,
  collectUxFacts,
  formValidity,
  modalVisible,
  readToasts,
  snapForm,
  type FormSnap,
  type ModalFact,
  type ToastRecord,
  type UxFacts,
} from './probe-ux';
import {
  collectUiFacts,
  darkScan,
  freezeMotion,
  hitAt,
  restoreText,
  stateLook,
  stressText,
  type DarkOffender,
  type ImageTextFact,
  type UiFacts,
} from './probe-ui';
import {
  VITALS_WATCH,
  collectTechFacts,
  readVitals,
  scanOverflow,
  type Overflow,
  type TechFacts,
  type Vitals,
} from './probe-tech';

/**
 * L1, driven from the server: one real browser visit that yields the first-screen
 * screenshot every piece of evidence is drawn on, the page facts, axe-core's
 * results, a keyboard walk, a flash measurement and a reduced-motion re-read.
 *
 * Every stage records its own failure instead of throwing. A rule that depends
 * on a stage that failed reports `not_evaluated` with that stage's reason — it
 * never gets to report a pass for work that did not happen.
 */

export const AXE_RULES = [
  'color-contrast',
  'label',
  'select-name',
  'image-alt',
  'role-img-alt',
  'input-image-alt',
  'button-name',
  'link-name',
  'target-size',
];

export type StepResult<T> = { ok: true; value: T; ms: number } | { ok: false; error: string; ms: number };

export type KeyStop = FocusStop & {
  /** Pixels that changed in the element's box when it took focus. Null when not measurable. */
  pixelChanged: number | null;
  /** Width of the changed region — a lone text caret is 1–2px wide. */
  pixelChangedWidth: number | null;
};

export type TrapResult = {
  selectors: string[];
  names: string[];
  boxes: Box[];
  releasesOnEscape: boolean;
  closeControlInLoop: boolean;
};

export type KeyboardResult = {
  stops: KeyStop[];
  /** Focus left the last element and returned to the document. */
  completed: boolean;
  limit: number;
  trap: TrapResult | null;
  /** Focus went into a frame or closed widget and 40 presses did not bring it back out. */
  stuckInFrame: string | null;
  /** Tab presses spent inside frames or closed widgets, whose controls could not be seen. */
  opaquePresses: number;
};

export type FlashResult = {
  fps: number;
  frames: number;
  durationMs: number;
  /** The highest flash rate measured in any cell, per second. */
  maxRate: number;
  areaPct: number;
  bbox: Box | null;
};

export type Measured = {
  finalUrl: string;
  html: string;
  status: number | null;
  /** First-screen PNG — the `screenshot_ref` every evidence box is drawn on. */
  screenshot: Buffer;
  facts: StepResult<PageFacts>;
  axe: StepResult<Record<string, AxeRuleResult>>;
  keyboard: StepResult<KeyboardResult>;
  /** Null when nothing on the first screen animates, so there is nothing to flash. */
  flash: StepResult<FlashResult> | null;
  reduce: StepResult<Record<string, { moving: boolean; detail: string }>>;
  /** The Usability family's facts, read at rest. */
  ux: StepResult<UxFacts>;
  /** Fields typed into and blurred, and each form asked to validate itself — nothing is submitted. */
  forms: StepResult<FormProbe[]>;
  /** Null when no modal was open on the first screen. */
  modal: StepResult<ModalProbe> | null;
  toasts: StepResult<{ records: ToastRecord[]; persistentText: string }>;
  /** The UI Quality family's facts and token inventory, read at rest. */
  ui: StepResult<UiFacts>;
  /** Contrast sampled from the screenshot under text that sits on an image. */
  imageText: StepResult<ImageSample[]>;
  states: StepResult<{ items: StateProbe[]; stopped: string | null }>;
  dark: StepResult<DarkProbe>;
  stress: StepResult<{ tested: number; broken: StressFinding[] }>;
  /** Core Web Vitals, navigation timing, page weight and image delivery. */
  vitals: StepResult<Vitals>;
  /** Technical and trust facts read from the document: metadata, links, consent, credentials. */
  tech: StepResult<TechFacts>;
  /** Each sampled link followed far enough to see whether it resolves. */
  links: StepResult<LinkCheck[]>;
  /** What the layout does at 320px. */
  reflow: StepResult<ReflowProbe>;
};

export type FieldReaction = {
  id: string;
  selector: string;
  type: string;
  /** What was put in the field to provoke validation, in words. */
  tried: string;
  reacted: boolean;
  how: string | null;
};

export type FormError = { text: string; selector: string; box: Box; errorish: boolean; fieldId: string | null };

export type FormProbe = {
  formId: string;
  selector: string;
  tried: FieldReaction[];
  /** Whether the form could be asked to validate without submitting, and how many fields it said were invalid. */
  validity: { ran: boolean; invalid: number };
  /** Messages the page painted after the fields were blurred or the form validated. */
  errors: FormError[];
  /** Messages that appeared on blur, before any validation request. */
  blurErrors: FormError[];
  aborted: string | null;
};

export type ModalProbe = {
  id: string;
  /** Escape closed it. */
  escape: boolean;
  /** A click on the backdrop closed it; null when there is no backdrop to click. */
  backdrop: boolean | null;
  note: string;
};

/* ============================================================ launching */

const ARGS = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--hide-scrollbars',
  '--mute-audio',
  '--disable-background-timer-throttling',
  '--force-color-profile=srgb',
];

/** A serverless function, where the only browser is the one shipped in the bundle. */
const serverless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

/**
 * On Lambda there is no Chrome to find and no room for Playwright's own: the
 * full download is larger than a function may be. `@sparticuz/chromium` is the
 * same engine stripped for that limit, unpacked to /tmp on the first launch.
 *
 * It renders with fewer system fonts than a desktop, so a page falling back to
 * a system font measures differently there. Web fonts download as usual, which
 * is most pages — but it is a reason to prefer a container when the numbers
 * have to match a designer's screen.
 */
async function serverlessLaunch(): Promise<LaunchOptions | null> {
  try {
    const mod = (await import('@sparticuz/chromium')).default;
    return {
      args: [...mod.args, ...ARGS],
      executablePath: await mod.executablePath(),
      headless: true,
    };
  } catch {
    return null;
  }
}

function launchOptions(): LaunchOptions[] {
  const args = ARGS;
  const explicit = process.env.PLAYWRIGHT_CHROMIUM_PATH || process.env.CHROME_PATH;
  return [
    ...(explicit ? [{ executablePath: explicit, args }] : []),
    { channel: 'chrome' as const, args },
    { channel: 'msedge' as const, args },
    { args },
  ];
}

let shared: Browser | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

/** Closing the browser after every audit costs a second on the next one. */
function keepWarm(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    shared?.close().catch(() => {});
    shared = null;
  }, 60_000);
  idleTimer.unref?.();
}

export async function browser(): Promise<Browser | null> {
  if (shared?.isConnected()) {
    keepWarm();
    return shared;
  }
  shared = null;
  // On a serverless host the bundled build goes first; the desktop list stays
  // behind it so a container that happens to set VERCEL still finds its Chrome.
  const bundled = serverless ? await serverlessLaunch() : null;
  const ways = bundled ? [bundled, ...launchOptions()] : launchOptions();
  for (const opts of ways) {
    try {
      // The bundled build unpacks itself to /tmp on the first launch of a cold
      // function, which 20s does not always cover.
      shared = await chromium.launch({ ...opts, timeout: opts === bundled ? 60_000 : 20_000 });
      keepWarm();
      return shared;
    } catch {
      /* try the next way of finding a browser */
    }
  }
  return null;
}

export async function newContext(b: Browser): Promise<BrowserContext> {
  return b.newContext({
    viewport: { width: VIEWPORT.width, height: VIEWPORT.height },
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/131.0.0.0 Safari/537.36 Zaudit/1.0 (+https://zaudit.com/bot)',
    locale: 'en-US',
    permissions: [],
    // axe-core is injected as an inline script; a strict CSP would refuse it and
    // leave half the rules unmeasured.
    bypassCSP: true,
    reducedMotion: 'no-preference',
  });
}

/* ================================================================ steps */

async function step<T>(fn: () => Promise<T>): Promise<StepResult<T>> {
  const t0 = Date.now();
  try {
    return { ok: true, value: await fn(), ms: Date.now() - t0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message.split('\n')[0] : String(err);
    return { ok: false, error: msg.slice(0, 200), ms: Date.now() - t0 };
  }
}

let axeModule: { source: string; version: string } | null = null;
function axeCore() {
  if (!axeModule) {
    const require = createRequire(import.meta.url);
    axeModule = require('axe-core') as { source: string; version: string };
  }
  return axeModule;
}
const axe = () => axeCore().source;
export const axeVersion = () => axeCore().version;

type Raw = { data: Buffer; width: number; height: number; channels: number };

async function raw(png: Buffer): Promise<Raw> {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/** Changed pixels between the baseline and a fresh crop of the same region. */
function diff(base: Raw, crop: Raw, x0: number, y0: number): { changed: number; width: number } {
  let changed = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      const bi = ((y0 + y) * base.width + (x0 + x)) * base.channels;
      const ci = (y * crop.width + x) * crop.channels;
      const d = Math.max(
        Math.abs(base.data[bi] - crop.data[ci]),
        Math.abs(base.data[bi + 1] - crop.data[ci + 1]),
        Math.abs(base.data[bi + 2] - crop.data[ci + 2]),
      );
      if (d > 40) {
        changed += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  return { changed, width: changed ? maxX - minX + 1 : 0 };
}

/* ------------------------------------------------------------ keyboard */

/**
 * Presses Tab through the page the way a keyboard user would.
 *
 * For each stop on the first screen the element's box is screenshotted with focus
 * on it and compared to the at-rest capture. A visible focus indicator shows up
 * as changed pixels however it was built — outline, shadow, pseudo-element, a
 * parent's `:focus-within` — which is exactly the question the focus rules ask.
 */
async function walkKeyboard(page: Page, baseline: Raw, focusableCount: number): Promise<KeyboardResult> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.scrollTo(0, 0);
  });
  await page.mouse.move(0, 0);

  const limit = Math.min(focusableCount + 5, 160);
  const stops: KeyStop[] = [];
  const firstIndex = new Map<string, number>();
  let completed = false;
  let loopFrom = -1;
  let framePresses = 0;
  let stuckInFrame: string | null = null;

  let framePressesTotal = 0;
  // Presses spent inside a frame do not use up the budget for the page itself.
  for (let i = 0; i < limit + framePressesTotal; i += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(readFocus);

    let pixelChanged: number | null = null;
    let pixelChangedWidth: number | null = null;
    if (!stop.body && stop.box && stop.inView && stop.scrollY === 0) {
      const pad = 6;
      const x = Math.max(0, Math.floor(stop.box.x - pad));
      const y = Math.max(0, Math.floor(stop.box.y - pad));
      const w = Math.min(VIEWPORT.width - x, Math.ceil(stop.box.w + pad * 2));
      const h = Math.min(VIEWPORT.height - y, Math.ceil(stop.box.h + pad * 2));
      if (w >= 4 && h >= 4) {
        const shot = await page.screenshot({ clip: { x, y, width: w, height: h }, type: 'png', animations: 'allow', caret: 'initial' });
        const d = diff(baseline, await raw(shot), x, y);
        pixelChanged = d.changed;
        pixelChangedWidth = d.width;
      }
    }
    stops.push({ ...stop, pixelChanged, pixelChangedWidth });

    if (stop.body) {
      if (stops.length > 1) {
        completed = true;
        break;
      }
      continue;
    }
    // Focus inside something opaque — an <iframe>, or a widget with closed shadow
    // DOM: the page keeps reporting the same element while Tab moves through
    // controls it cannot see into. Staying on one element across presses is focus
    // travelling inside it, not a one-element loop — up to a point.
    if (stops.length > 1 && stops[stops.length - 2].id === stop.id) {
      framePresses += 1;
      framePressesTotal += 1;
      if (framePresses >= 40) {
        stuckInFrame = stop.selector;
        break;
      }
      stops.pop();
      continue;
    }
    framePresses = 0;
    const seen = firstIndex.get(stop.id!);
    if (seen != null) {
      loopFrom = seen;
      break;
    }
    firstIndex.set(stop.id!, stops.length - 1);
  }

  let trap: TrapResult | null = null;
  if (loopFrom >= 0) {
    const loop = stops.slice(loopFrom, stops.length - 1).filter((s) => !s.body);
    // Cycling through every focusable element is how a page without a trap
    // behaves in a browser with no chrome to escape to. A trap is a smaller loop.
    if (loop.length < Math.max(2, focusableCount - 1)) {
      const ids = new Set(loop.map((s) => s.id));
      await page.keyboard.press('Escape');
      let released = false;
      for (let k = 0; k < 3; k += 1) {
        await page.keyboard.press('Tab');
        const s = await page.evaluate(readFocus);
        if (s.body || !ids.has(s.id)) {
          released = true;
          break;
        }
      }
      trap = {
        selectors: loop.map((s) => s.selector!),
        names: loop.map((s) => s.name),
        boxes: loop.map((s) => s.box!).filter(Boolean),
        releasesOnEscape: released,
        closeControlInLoop: loop.some((s) => /close|dismiss|cancel|no thanks|^x$|×|✕/i.test(s.name)),
      };
    } else {
      completed = true;
    }
  }

  await page.keyboard.press('Escape').catch(() => {});
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.()).catch(() => {});
  return { stops, completed, limit, trap, stuckInFrame, opaquePresses: framePressesTotal };
}

/* --------------------------------------------------------------- flashes */

/**
 * Frame-differenced luminance over the first screen.
 *
 * Frames are grabbed at a tenth of the resolution through the DevTools protocol,
 * which is fast enough to see a 3 Hz flash. The screen is cut into 60px cells;
 * a flash in a cell is a pair of opposing luminance changes of at least 10%
 * where the darker state is below 0.8 — WCAG's general flash definition.
 */
async function measureFlash(page: Page): Promise<FlashResult> {
  const cdp = await page.context().newCDPSession(page);
  const scale = 0.1;
  const frames: { t: number; buf: Buffer }[] = [];
  const start = Date.now();
  while (Date.now() - start < 1600 && frames.length < 40) {
    const res = (await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 60,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height, scale },
    })) as { data: string };
    frames.push({ t: Date.now(), buf: Buffer.from(res.data, 'base64') });
  }
  await cdp.detach().catch(() => {});

  const durationMs = frames.length > 1 ? frames[frames.length - 1].t - frames[0].t : 0;
  const fps = durationMs ? ((frames.length - 1) * 1000) / durationMs : 0;
  if (fps < 10) {
    throw new Error(`frames captured at ${fps.toFixed(1)} fps, too slow to measure a 3 Hz flash`);
  }

  const decoded = await Promise.all(frames.map((f) => raw(f.buf)));
  const W = decoded[0].width;
  const H = decoded[0].height;
  const cell = 6;
  const cols = Math.floor(W / cell);
  const rows = Math.floor(H / cell);
  const ch = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  const series: number[][] = Array.from({ length: cols * rows }, () => []);
  for (const f of decoded) {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        let sum = 0;
        for (let y = r * cell; y < (r + 1) * cell; y += 1) {
          for (let x = c * cell; x < (c + 1) * cell; x += 1) {
            const i = (y * W + x) * f.channels;
            sum += 0.2126 * ch(f.data[i]) + 0.7152 * ch(f.data[i + 1]) + 0.0722 * ch(f.data[i + 2]);
          }
        }
        series[r * cols + c].push(sum / (cell * cell));
      }
    }
  }

  let maxRate = 0;
  const flashing: number[] = [];
  series.forEach((s, idx) => {
    let transitions = 0;
    let lastDir = 0;
    let ref = s[0];
    for (let i = 1; i < s.length; i += 1) {
      const delta = s[i] - ref;
      if (Math.abs(delta) >= 0.1 && Math.min(s[i], ref) < 0.8) {
        const dir = Math.sign(delta);
        if (dir !== lastDir) {
          transitions += 1;
          lastDir = dir;
        }
        ref = s[i];
      }
    }
    const rate = transitions / 2 / (durationMs / 1000);
    if (rate > maxRate) maxRate = rate;
    if (rate > 3) flashing.push(idx);
  });

  let bbox: Box | null = null;
  if (flashing.length) {
    const cx = flashing.map((i) => i % cols);
    const cy = flashing.map((i) => Math.floor(i / cols));
    const px = cell / scale;
    bbox = {
      x: Math.min(...cx) * px,
      y: Math.min(...cy) * px,
      w: (Math.max(...cx) - Math.min(...cx) + 1) * px,
      h: (Math.max(...cy) - Math.min(...cy) + 1) * px,
    };
  }

  return {
    fps: Math.round(fps * 10) / 10,
    frames: frames.length,
    durationMs,
    maxRate: Math.round(maxRate * 10) / 10,
    areaPct: Math.round((flashing.length / (cols * rows)) * 1000) / 10,
    bbox,
  };
}

/* ---------------------------------------------------------------- modal */

/**
 * Whether an open modal can be dismissed. Escape is pressed (the keyboard walk
 * has already pressed it once), then the backdrop is clicked — only at a point
 * where the backdrop itself is on top, so the click cannot land on a link.
 */
async function probeModal(page: Page, m: ModalFact): Promise<ModalProbe> {
  if (!(await page.evaluate(modalVisible, m.id))) {
    return { id: m.id, escape: true, backdrop: null, note: 'It closed when Escape was pressed during the keyboard walk.' };
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
  if (!(await page.evaluate(modalVisible, m.id))) {
    return { id: m.id, escape: true, backdrop: null, note: 'Escape closed it.' };
  }
  if (!m.backdrop) {
    return { id: m.id, escape: false, backdrop: null, note: 'Escape did not close it, and nothing outside it is a backdrop that could be clicked.' };
  }
  const before = page.url();
  await page.mouse.click(m.backdrop.x, m.backdrop.y);
  await page.waitForTimeout(400);
  const closed = !(await page.evaluate(modalVisible, m.id).catch(() => false));
  return {
    id: m.id,
    escape: false,
    backdrop: closed,
    note: closed
      ? 'Escape did not close it; a click on the backdrop did.'
      : `Escape did not close it, and a click on the backdrop at (${m.backdrop.x}, ${m.backdrop.y}) did not either${page.url() !== before ? ' (the click navigated)' : ''}.`,
  };
}

/* ---------------------------------------------------------------- forms */

const SAMPLES: Record<string, { valid: string; invalid: string; words: string }> = {
  email: { valid: 'alex@example.com', invalid: 'not-an-email', words: 'an address without an @' },
  url: { valid: 'https://example.com', invalid: 'not a url', words: 'text that is not an address' },
  tel: { valid: '5551234567', invalid: 'abc', words: 'letters in a phone field' },
  minlength: { valid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', invalid: 'a', words: 'one character, below the minimum length' },
  pattern: { valid: '', invalid: '!!', words: 'characters outside the expected format' },
  required: { valid: 'Alex', invalid: '', words: 'the field left empty' },
};

function newTexts(before: FormSnap, after: FormSnap): FormSnap['texts'] {
  const seen = new Set(before.texts.map((t) => t.text));
  return after.texts.filter((t) => !seen.has(t.text));
}

function nearestField(t: { box: Box }, fields: UxFacts['fields']): string | null {
  let best: string | null = null;
  let dist = 140;
  for (const f of fields) {
    const d = Math.hypot(t.box.x - f.box.x, t.box.y - (f.box.y + f.box.h));
    if (d < dist) {
      dist = d;
      best = f.id;
    }
  }
  return best;
}

/**
 * Types an invalid value into each constrained field and blurs it, after a
 * valid value for comparison, to see whether the page validates as the user
 * goes. Then asks the form to validate itself. Nothing is submitted, and a probe
 * that makes the page navigate stops there.
 */
async function probeForms(page: Page, ux: UxFacts): Promise<FormProbe[]> {
  const out: FormProbe[] = [];
  const candidates = ux.forms
    .filter((f) => f.inView && !f.search && f.fields.some((x) => x.inView))
    .sort((a, b) => b.fields.length - a.fields.length)
    .slice(0, 2);
  const start = page.url();
  for (const form of candidates) {
    const probe: FormProbe = {
      formId: form.id,
      selector: form.selector,
      tried: [],
      validity: { ran: false, invalid: 0 },
      errors: [],
      blurErrors: [],
      aborted: null,
    };
    out.push(probe);
    const initial = await page.evaluate(snapForm, form.id);
    if (!initial) {
      probe.aborted = 'the form was no longer on the page';
      continue;
    }
    const pick = form.fields
      .filter((x) => x.inView && x.constraint && x.constraint !== 'number' && x.constraint !== 'date' && x.type !== 'select')
      .slice(0, 4);
    for (const fld of pick) {
      const sample = SAMPLES[fld.constraint!] ?? SAMPLES.required;
      const loc = page.locator(fld.selector).first();
      try {
        let control: FormSnap | null = null;
        if (sample.valid) {
          await loc.fill(sample.valid, { timeout: 1500 });
          await loc.blur({ timeout: 1500 });
          await page.waitForTimeout(200);
          control = await page.evaluate(snapForm, form.id);
        }
        if (sample.invalid) {
          await loc.fill(sample.invalid, { timeout: 1500 });
        } else {
          await loc.fill('', { timeout: 1500 });
          await loc.focus({ timeout: 1500 });
        }
        await loc.blur({ timeout: 1500 });
        await page.waitForTimeout(300);
        const after = await page.evaluate(snapForm, form.id);
        const base = control ?? initial;
        if (!after) break;
        const was = base.fields[fld.id];
        const now = after.fields[fld.id];
        const appeared = newTexts(base, after);
        const how =
          now && was && now.invalid && !was.invalid
            ? 'aria-invalid set'
            : appeared.length
              ? `message "${appeared[0].text}"`
              : now && was && now.look !== was.look
                ? 'the field changed appearance'
                : null;
        probe.tried.push({ id: fld.id, selector: fld.selector, type: fld.type, tried: sample.words, reacted: !!how, how });
        for (const t of appeared) probe.blurErrors.push({ ...t, fieldId: fld.id });
      } catch (err) {
        const why = err instanceof Error ? err.message.split('\n')[0].slice(0, 80) : 'error';
        probe.tried.push({ id: fld.id, selector: fld.selector, type: fld.type, tried: sample.words, reacted: false, how: `could not be typed into (${why})` });
      }
      if (page.url() !== start) {
        probe.aborted = 'typing into the form made the page navigate';
        return out;
      }
    }
    probe.validity = await page.evaluate(formValidity, form.id);
    await page.waitForTimeout(400);
    const validated = await page.evaluate(snapForm, form.id);
    if (validated) {
      const seen = new Set<string>();
      const later = newTexts(initial, validated).map((x) => ({ ...x, fieldId: nearestField(x, form.fields) }));
      for (const t of [...probe.blurErrors, ...later]) {
        if (seen.has(t.text)) continue;
        seen.add(t.text);
        probe.errors.push(t);
      }
    }
    if (page.url() !== start) {
      probe.aborted = 'validating the form made the page navigate';
      return out;
    }
  }
  return out;
}

/* ------------------------------------------------------- text over images */

export type ImageSample = { id: string; min: number; p10: number; samples: number };

const lumOf = (r: number, g: number, b: number) => {
  const ch = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};

/**
 * The contrast text actually gets against the image under it, read from the
 * first-screen pixels. Pixels close to the text colour are glyphs; they and a
 * 2px fringe around them (anti-aliasing blends) are left out, and what remains
 * is the image the text sits on. The 10th percentile is reported so a handful of
 * stray pixels cannot decide it.
 */
function sampleImageText(base: Raw, items: ImageTextFact[]): ImageSample[] {
  const out: ImageSample[] = [];
  for (const it of items) {
    const x0 = Math.max(0, Math.floor(it.box.x));
    const y0 = Math.max(0, Math.floor(it.box.y));
    const x1 = Math.min(base.width, Math.ceil(it.box.x + it.box.w));
    const y1 = Math.min(base.height, Math.ceil(it.box.y + it.box.h));
    const w = x1 - x0;
    const h = y1 - y0;
    if (w < 4 || h < 4) continue;
    const fg = [1, 3, 5].map((i) => parseInt(it.color.slice(i, i + 2), 16));
    const Lf = lumOf(fg[0], fg[1], fg[2]);
    const glyph = new Uint8Array(w * h);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = ((y0 + y) * base.width + (x0 + x)) * base.channels;
        const d = Math.abs(base.data[i] - fg[0]) + Math.abs(base.data[i + 1] - fg[1]) + Math.abs(base.data[i + 2] - fg[2]);
        if (d < 90) glyph[y * w + x] = 1;
      }
    }
    const ratios: number[] = [];
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let near = false;
        for (let dy = -2; dy <= 2 && !near; dy += 1) {
          for (let dx = -2; dx <= 2 && !near; dx += 1) {
            const yy = y + dy;
            const xx = x + dx;
            if (yy >= 0 && yy < h && xx >= 0 && xx < w && glyph[yy * w + xx]) near = true;
          }
        }
        if (near) continue;
        const i = ((y0 + y) * base.width + (x0 + x)) * base.channels;
        const Lb = lumOf(base.data[i], base.data[i + 1], base.data[i + 2]);
        ratios.push((Math.max(Lf, Lb) + 0.05) / (Math.min(Lf, Lb) + 0.05));
      }
    }
    if (ratios.length < Math.max(30, 0.1 * w * h)) continue;
    ratios.sort((a, b) => a - b);
    out.push({
      id: it.id,
      min: Math.round(ratios[0] * 100) / 100,
      p10: Math.round(ratios[Math.floor(ratios.length * 0.1)] * 100) / 100,
      samples: ratios.length,
    });
  }
  return out;
}

/* ---------------------------------------------------------------- states */

export type StateProbe = { id: string; selector: string; signature: string; name: string; count: number; hover: boolean | null; active: boolean | null; note: string | null };

/**
 * Hovers each interactive element on the first screen with the real pointer —
 * so hover effects driven by script count too — and compares how it looks with
 * how it looked at rest. The pressed state is read by forcing `:active` through
 * the DevTools protocol rather than pressing the mouse: a real press can
 * navigate on sites that act on mousedown, and nothing here may activate a
 * control. Transitions are frozen so each change is read at its end state.
 */
async function probeStates(page: Page, ui: UiFacts): Promise<{ items: StateProbe[]; stopped: string | null }> {
  const items: StateProbe[] = [];
  const start = page.url();
  const rest = ui.safePoint;
  const cdp = await page.context().newCDPSession(page);
  await page.evaluate(freezeMotion, true);
  try {
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = (await cdp.send('DOM.getDocument', { depth: 0 })) as { root: { nodeId: number } };
    for (const el of ui.interactive) {
      const x = el.box.x + el.box.w / 2;
      const y = el.box.y + el.box.h / 2;
      if (!rest) {
        items.push({ ...el, hover: null, active: null, note: 'no empty spot to rest the pointer on' });
        continue;
      }
      await page.mouse.move(rest.x, rest.y);
      const before = await page.evaluate(stateLook, el.id);
      if (!before || !(await page.evaluate(hitAt, { id: el.id, x, y }))) {
        items.push({ ...el, hover: null, active: null, note: 'covered by another element' });
        continue;
      }
      await page.mouse.move(x, y);
      await page.waitForTimeout(60);
      const hovered = await page.evaluate(stateLook, el.id);
      let active: boolean | null = null;
      const { nodeId } = (await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: el.selector }).catch(() => ({ nodeId: 0 }))) as { nodeId: number };
      if (nodeId) {
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover', 'active'] });
        const pressed = await page.evaluate(stateLook, el.id);
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
        active = pressed != null && hovered != null ? pressed !== hovered : null;
      }
      items.push({ ...el, hover: hovered != null && hovered !== before, active, note: nodeId ? null : 'its selector could not be resolved to force :active' });
      if (page.url() !== start) return { items, stopped: 'hovering an element made the page navigate' };
    }
  } finally {
    await page.evaluate(freezeMotion, false).catch(() => {});
    if (rest) await page.mouse.move(rest.x, rest.y).catch(() => {});
    await cdp.detach().catch(() => {});
  }
  return { items, stopped: null };
}

/* ------------------------------------------------------------- dark mode */

export type DarkProbe = {
  declared: string[];
  applied: string | null;
  pageBg: string | null;
  offenders: (DarkOffender & { capture: string | null })[];
};

async function crop(png: Buffer, box: Box): Promise<string | null> {
  const x = Math.max(0, Math.floor(box.x));
  const y = Math.max(0, Math.floor(box.y));
  const w = Math.min(VIEWPORT.width - x, Math.ceil(box.w));
  const h = Math.min(VIEWPORT.height - y, Math.ceil(box.h));
  if (w < 4 || h < 4) return null;
  const buf = await sharp(png).extract({ left: x, top: y, width: w, height: h }).resize({ width: Math.min(w, 480), withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

/**
 * Turns the page's own dark theme on — through `prefers-color-scheme`, and the
 * attribute or class its stylesheet keys the theme on — and looks for surfaces
 * that stayed light and text that stayed dark. Then turns it off again.
 */
async function probeDark(page: Page, ui: UiFacts): Promise<DarkProbe> {
  const d = ui.dark;
  const declared = [
    d.meta && /dark/i.test(d.meta) ? `<meta name="color-scheme" content="${d.meta}">` : null,
    /dark/i.test(d.rootScheme) ? `color-scheme: ${d.rootScheme}` : null,
    d.mediaRules ? `${d.mediaRules} prefers-color-scheme: dark rule(s)` : null,
    ...d.toggles.map((t) => (t.kind === 'attribute' ? `[${t.name}="dark"] rules` : `.${t.name} rules`)),
  ].filter((x): x is string => !!x);
  if (!declared.length) return { declared, applied: null, pageBg: null, offenders: [] };
  const toggle = d.toggles[0];
  await page.emulateMedia({ colorScheme: 'dark' });
  if (toggle) {
    await page.evaluate((t) => {
      if (t.kind === 'attribute') document.documentElement.setAttribute(t.name, 'dark');
      else document.documentElement.classList.add(t.name);
    }, toggle);
  }
  await page.waitForTimeout(400);
  try {
    const scan = await page.evaluate(darkScan);
    const applied = !scan.dark
      ? null
      : [d.mediaRules || /dark/i.test(d.rootScheme) || (d.meta && /dark/i.test(d.meta)) ? 'prefers-color-scheme: dark' : null, toggle ? (toggle.kind === 'attribute' ? `${toggle.name}="dark" on <html>` : `class "${toggle.name}" on <html>`) : null]
          .filter(Boolean)
          .join(' + ');
    let shot: Buffer | null = null;
    if (scan.offenders.length) shot = await page.screenshot({ type: 'png', animations: 'allow' });
    const offenders = [];
    for (const [i, o] of scan.offenders.entries()) offenders.push({ ...o, capture: shot && i < 4 ? await crop(shot, o.box).catch(() => null) : null });
    return { declared, applied, pageBg: scan.pageBg, offenders };
  } finally {
    await page.emulateMedia({ colorScheme: 'light' });
    if (toggle) {
      await page.evaluate((t) => {
        if (t.kind === 'attribute') document.documentElement.removeAttribute(t.name);
        else document.documentElement.classList.remove(t.name);
      }, toggle).catch(() => {});
    }
    await page.waitForTimeout(200);
  }
}

/* ------------------------------------------------------------ text stress */

export type StressFinding = { id: string; selector: string; signature: string; text: string; factor: number; overflow: 'clipped' | 'overflow' | 'overlap'; detail: string; box: Box; capture: string | null };

/**
 * Doubles each candidate's text, then cuts it to 30%, and records what breaks.
 * Every change is undone before the next.
 */
async function probeStress(page: Page, ui: UiFacts): Promise<{ tested: number; broken: StressFinding[] }> {
  const broken: StressFinding[] = [];
  let tested = 0;
  for (const c of ui.stress) {
    for (const factor of [2, 0.3]) {
      const r = await page.evaluate(stressText, { id: c.id, factor });
      let capture: string | null = null;
      if (r && broken.length < 4) {
        const pad = 24;
        const box = { x: Math.min(r.box.x, c.box.x) - pad, y: Math.min(r.box.y, c.box.y) - pad, w: Math.max(r.box.w, c.box.w) + pad * 2, h: Math.max(r.box.h, c.box.h) + pad * 2 };
        const shot = await page.screenshot({ type: 'png', animations: 'allow' });
        capture = await crop(shot, box).catch(() => null);
      }
      await page.evaluate(restoreText, c.id);
      if (r) broken.push({ ...c, factor, overflow: r.overflow, detail: r.detail, box: c.box, capture });
    }
    tested += 1;
  }
  return { tested, broken };
}

/* ------------------------------------------------------------- links */

export type LinkCheck = { href: string; text: string; selector: string; box: Box; inView: boolean; status: number | null; error: string | null };

/**
 * Follows a sample of the page's links far enough to see whether they resolve.
 * Every address is checked against the SSRF guard first, because the links come
 * from someone else's page; HEAD is tried before GET, since some servers refuse
 * HEAD outright.
 */
async function checkLinks(page: Page, links: TechFacts['links']): Promise<LinkCheck[]> {
  const sample = [...links.filter((l) => l.inView), ...links.filter((l) => !l.inView)].slice(0, 25);
  const out: LinkCheck[] = [];
  await Promise.all(
    sample.map(async (l) => {
      try {
        await assertPublicUrl(l.href);
      } catch (err) {
        out.push({ ...l, status: null, error: err instanceof Error ? err.message.slice(0, 80) : 'refused' });
        return;
      }
      try {
        let res = await page.request.head(l.href, { timeout: 8_000, maxRedirects: 5, failOnStatusCode: false });
        if (res.status() === 405 || res.status() === 501) {
          res = await page.request.get(l.href, { timeout: 8_000, maxRedirects: 5, failOnStatusCode: false });
        }
        out.push({ ...l, status: res.status(), error: null });
      } catch (err) {
        out.push({ ...l, status: null, error: err instanceof Error ? err.message.split('\n')[0].slice(0, 80) : 'request failed' });
      }
    }),
  );
  return out;
}

/* ---------------------------------------------------------- reflow */

export type ReflowProbe = { width: number; overflow: Overflow; capture: string | null };

/**
 * Narrows the window to 320px — the width the framework asks a layout to hold —
 * and records what sticks out, with a capture of the result. The viewport is put
 * back afterwards so nothing measured later sees a phone.
 */
async function probeReflow(page: Page): Promise<ReflowProbe> {
  const width = 320;
  try {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    const overflow = await page.evaluate(scanOverflow);
    let capture: string | null = null;
    if (overflow.offenders.length) {
      const shot = await page.screenshot({ type: 'png', animations: 'allow' });
      capture = `data:image/webp;base64,${(await sharp(shot).resize({ width: 320, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer()).toString('base64')}`;
    }
    return { width, overflow, capture };
  } finally {
    await page.setViewportSize({ width: VIEWPORT.width, height: VIEWPORT.height }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

/* ================================================================ visit */

/**
 * The page as a keyboard-and-screen user meets it, measured.
 *
 * `load` receives the live page and puts content in it — `goto` for a real
 * audit, `setContent` for a fixture — so the same measurement runs on both.
 */
export async function measurePage(
  load: (page: Page) => Promise<number | null>,
  { signal }: { signal?: AbortSignal } = {},
): Promise<Measured | null> {
  const b = await browser();
  if (!b) return null;
  const context = await newContext(b);

  try {
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    // tsx/esbuild wraps named functions in `__name(...)`; give serialised
    // functions the helper so the same probes run under tests and under Next.
    await page.addInitScript({ content: 'window.__name = (f) => f;' });
    await page.addInitScript({ content: TOAST_WATCH });
    await page.addInitScript({ content: VITALS_WATCH });

    const status = await load(page);
    // setContent does not run init scripts; start the watch now if it is missing.
    await page.evaluate(TOAST_WATCH).catch(() => {});
    await page.evaluate(VITALS_WATCH).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => {});
    await page.waitForTimeout(400);

    // Roll through the page so lazy content is present, then back to the top:
    // the first screen is what gets audited, as it looks once it has settled.
    await page.evaluate(async () => {
      const step = window.innerHeight * 2;
      for (let y = 0; y < document.body.scrollHeight && y < 9_000; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 70));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(350);
    if (signal?.aborted) throw new Error('cancelled');

    // setContent does not run init scripts, so define the helper directly too.
    await page.evaluate('globalThis.__name = globalThis.__name || ((f) => f)');
    await page.evaluate(installHelpers, { vw: VIEWPORT.width, vh: VIEWPORT.height });
    const screenshot = await page.screenshot({ type: 'png', animations: 'allow', caret: 'initial' });
    const baseline = await raw(screenshot);

    const facts = await step(() => page.evaluate(collectFacts));
    const ux = await step(() => page.evaluate(collectUxFacts));
    const ui = await step(() => page.evaluate(collectUiFacts));
    const imageText: StepResult<ImageSample[]> = ui.ok
      ? await step(async () => sampleImageText(baseline, ui.value.imageText))
      : { ok: false, error: 'the UI facts could not be read', ms: 0 };

    const axeResult = await step(async () => {
      await page.addScriptTag({ content: axe() });
      return page.evaluate(runAxe, AXE_RULES);
    });

    const f = facts.ok ? facts.value : null;
    const animated = f
      ? f.animatedSources.animations + f.animatedSources.video + f.animatedSources.canvas + f.animatedSources.gif
      : 0;
    const flash = f && animated > 0 ? await step(() => measureFlash(page)) : null;

    if (signal?.aborted) throw new Error('cancelled');
    const keyboard = await step(() => walkKeyboard(page, baseline, f?.focusableCount ?? 60));

    const reduce = await step(async () => {
      const ids = (f?.motion ?? []).filter((m) => m.inView).map((m) => m.id);
      if (!ids.length) return {};
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(500);
      return page.evaluate(motionAfterReduce, ids);
    });

    if (signal?.aborted) throw new Error('cancelled');
    // Interaction comes last: everything above measured the page untouched.
    const uxv = ux.ok ? ux.value : null;
    const modal = uxv?.modal ? await step(() => probeModal(page, uxv.modal!)) : null;
    const forms: StepResult<FormProbe[]> = uxv
      ? await step(() => probeForms(page, uxv))
      : { ok: false, error: 'the usability facts could not be read', ms: 0 };
    const toasts = await step(() => page.evaluate(readToasts));
    const vitals = await step(() => page.evaluate(readVitals));
    const tech = await step(() => page.evaluate(collectTechFacts));
    const links: StepResult<LinkCheck[]> = tech.ok
      ? await step(() => checkLinks(page, tech.value.links))
      : { ok: false, error: 'the page facts could not be read', ms: 0 };
    const uiv = ui.ok ? ui.value : null;
    // The keyboard walk and the form probe scroll the page; the UI probes work
    // in first-screen coordinates, so put it back where it was measured.
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur?.();
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(150);
    const noUi = { ok: false as const, error: 'the UI facts could not be read', ms: 0 };
    const states = uiv ? await step(() => probeStates(page, uiv)) : noUi;
    const dark = uiv ? await step(() => probeDark(page, uiv)) : noUi;
    const stress = uiv ? await step(() => probeStress(page, uiv)) : noUi;
    // Last, because it changes the window: everything above measured 1440×900.
    const reflow = await step(() => probeReflow(page));

    return {
      finalUrl: page.url(),
      html: await page.content(),
      status,
      screenshot,
      facts,
      axe: axeResult,
      keyboard,
      flash,
      reduce,
      ux,
      forms,
      modal,
      toasts,
      ui,
      imageText,
      states,
      dark,
      stress,
      vitals,
      tech,
      links,
      reflow,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

/** A real audit: navigate to the address and report the HTTP status. */
export function gotoLoader(url: string) {
  return async (page: Page) => {
    // The address was checked before the visit, but a redirect or an iframe can
    // still point the browser somewhere private. Every document it is about to
    // load is checked again, so the browser cannot be used to reach the server's
    // own network.
    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.isNavigationRequest()) {
        try {
          await assertPublicUrl(req.url());
        } catch {
          return route.abort('blockedbyclient');
        }
      }
      return route.continue();
    });
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    return res?.status() ?? null;
  };
}
