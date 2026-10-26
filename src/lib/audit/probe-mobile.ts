import type { Box, ElRef } from './probe';

/**
 * The Mobile family's facts, read on a real phone-sized page.
 *
 * Everything here needs a second visit to measure, because it is not a narrower
 * copy of the desktop page: the context is touch-capable, `pointer: coarse` and
 * `hover: none` match, the user agent says Android, and the page is free to
 * serve a different layout, a different navigation, even different markup. A
 * desktop page squeezed to 390px would answer a different question — "does this
 * layout survive" — which `VH-13` already asks at 320px.
 *
 * The functions below are serialised into that page, so they may only use
 * `window.__zx` (installed first) and the DOM.
 */

/** A control as a thumb meets it: its size, and how close the next one is. */
export type TouchTarget = ElRef & {
  /** Distance in CSS px to the nearest other target, null when it is the only one. */
  gap: number | null;
  /** Inline links inside a sentence are exempt from the size rule. */
  inlineInProse: boolean;
};

export type MobileFacts = {
  viewport: { width: number; height: number };
  /** The viewport meta as authored, and what it does to pinch zoom. */
  meta: { content: string | null; userScalable: boolean; maximumScale: number | null };
  targets: TouchTarget[];
  /** Body text below the legible floor, longest first. */
  smallText: (ElRef & { px: number; chars: number })[];
  /** Fields iOS zooms into on focus, which shifts the whole layout. */
  smallFields: (ElRef & { px: number; type: string })[];
  nav: {
    /** A control that opens a menu: the hamburger, by any name. */
    menuControl: ElRef | null;
    /** Links inside the nav that are visible on the first screen. */
    visibleLinks: number;
    /** The nav lays out wider than the screen. */
    overflows: boolean;
    present: boolean;
  };
  /** Bars pinned over the content, with the share of the screen each takes. */
  pinned: (ElRef & { edge: 'top' | 'bottom' | 'other'; share: number })[];
  /** How much of the first screen the pinned bars cover between them. */
  pinnedShare: number;
};

/* ------------------------------------------------------------------ probe */

export function collectMobileFacts(): MobileFacts {
  const zx = (window as any).__zx;
  // The layout viewport, not `innerWidth`: a phone zooms out to fit content
  // that overflows, and the emulator does the same, so `innerWidth` reports the
  // width of the zoomed-out *visual* viewport — 900px on a page with a 900px
  // table. Everything measured here is in layout pixels, which is what the
  // element boxes are in too.
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;

  /* viewport meta ----------------------------------------------------- */
  const metaEl = document.querySelector('meta[name="viewport" i]');
  const content = metaEl?.getAttribute('content') ?? null;
  const lower = (content ?? '').toLowerCase().replace(/\s+/g, '');
  const maxScaleMatch = lower.match(/maximum-scale=([\d.]+)/);
  const maximumScale = maxScaleMatch ? Number(maxScaleMatch[1]) : null;
  const userScalable = !/user-scalable=(no|0)/.test(lower);

  /* touch targets ------------------------------------------------------ */
  const SELECTOR =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"], [tabindex]:not([tabindex="-1"])';

  const candidates = Array.from(document.querySelectorAll(SELECTOR)).filter(
    (el) => zx.visible(el) && !zx.srOnly(el) && zx.inView(zx.boxOf(el)),
  );

  // A control inside a control is one target, not two: keep the outer one.
  const outermost = candidates.filter((el) => !candidates.some((other) => other !== el && other.contains(el)));

  const boxes = outermost.map((el) => zx.boxOf(el) as Box);

  /** Edge-to-edge distance; 0 when the two rectangles touch or overlap. */
  const apart = (a: Box, b: Box): number => {
    const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
    const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
    return Math.round(Math.hypot(dx, dy));
  };

  const targets: TouchTarget[] = outermost.map((el, i) => {
    let gap: number | null = null;
    for (let j = 0; j < boxes.length; j += 1) {
      if (j === i) continue;
      const d = apart(boxes[i], boxes[j]);
      if (gap == null || d < gap) gap = d;
    }
    // WCAG 2.5.8 exempts a link sitting in a sentence: the sentence itself is
    // the target, and shrinking the line to fit a thumb would be worse.
    const style = getComputedStyle(el);
    const parent = el.parentElement;
    const parentText = parent ? (parent.textContent ?? '').replace(/\s+/g, ' ').trim() : '';
    const ownText = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    const inlineInProse =
      (style.display === 'inline' || style.display === 'inline-block') &&
      el.tagName === 'A' &&
      parentText.length > ownText.length + 12;

    return { ...(zx.ref(el) as ElRef), gap, inlineInProse };
  });

  /* text that shrank below the floor ----------------------------------- */
  const BLOCK = 'p, li, dd, dt, td, th, figcaption, blockquote, span, div, a, label, small';
  const smallText: MobileFacts['smallText'] = [];
  for (const el of Array.from(document.querySelectorAll(BLOCK))) {
    if (!zx.visible(el) || zx.srOnly(el) || !zx.inView(zx.boxOf(el))) continue;
    // Only the element that actually holds the words, not its wrappers.
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => (n.textContent ?? '').replace(/\s+/g, ' ').trim())
      .join(' ')
      .trim();
    if (own.length < 25) continue;
    const px = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10;
    if (px >= 14) continue;
    smallText.push({ ...(zx.ref(el) as ElRef), px, chars: own.length });
  }
  smallText.sort((a, b) => b.chars - a.chars);

  /* fields that trigger the iOS zoom ------------------------------------ */
  const smallFields: MobileFacts['smallFields'] = [];
  for (const el of Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'))) {
    if (!zx.visible(el) || zx.srOnly(el) || !zx.inView(zx.boxOf(el))) continue;
    const type = (el as HTMLInputElement).type ?? el.tagName.toLowerCase();
    // These never take a keyboard, so they never trigger the zoom.
    if (['checkbox', 'radio', 'range', 'color', 'file', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
    const px = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10;
    if (px >= 16) continue;
    smallFields.push({ ...(zx.ref(el) as ElRef), px, type });
  }

  /* navigation ---------------------------------------------------------- */
  const navEl =
    document.querySelector('nav, [role="navigation"]') ??
    document.querySelector('header nav, header [role="navigation"]');

  const menuish = (el: Element): boolean => {
    const name = ((zx.nameOf?.(el) as string) ?? el.getAttribute('aria-label') ?? el.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const cls = (el.getAttribute('class') ?? '').toLowerCase();
    const controls = el.hasAttribute('aria-expanded') || el.hasAttribute('aria-controls');
    return (
      /\b(menu|navigation|nav)\b/.test(name) ||
      /hamburger|burger|menu-?(toggle|button|btn|icon)|nav-?toggle|toggle-?nav/.test(cls) ||
      (controls && (/\bmenu\b/.test(cls) || /\bnav\b/.test(cls) || name === ''))
    );
  };

  const controlCandidates = Array.from(
    document.querySelectorAll('button, [role="button"], a[href^="#"], input[type="checkbox"].menu, label'),
  ).filter((el) => zx.visible(el) && zx.inView(zx.boxOf(el)) && menuish(el));

  const navLinks = navEl
    ? Array.from(navEl.querySelectorAll('a[href]')).filter((a) => zx.visible(a) && !zx.srOnly(a) && zx.inView(zx.boxOf(a)))
    : [];

  const nav = {
    menuControl: controlCandidates.length ? (zx.ref(controlCandidates[0]) as ElRef) : null,
    visibleLinks: navLinks.length,
    overflows: navEl ? navEl.scrollWidth > Math.ceil(vw) + 2 : false,
    present: !!navEl,
  };

  /* bars pinned over the content ---------------------------------------- */
  const pinned: MobileFacts['pinned'] = [];
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const style = getComputedStyle(el);
    if (style.position !== 'fixed' && style.position !== 'sticky') continue;
    if (!zx.visible(el) || zx.srOnly(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 24 || r.width < vw * 0.6) continue;
    // A bar inside a bar is the same bar.
    if (pinned.some((p) => (zx.byId.get(p.id) as Element | undefined)?.contains(el))) continue;
    // A promotion bar stacked under a pinned header is still pinned furniture,
    // so the test is which third of the screen the bar sits in rather than
    // whether it touches the edge. Something pinned across the middle — a
    // floating panel — is neither, and is counted separately.
    const edge: 'top' | 'bottom' | 'other' = r.top < vh / 3 ? 'top' : r.bottom > (vh * 2) / 3 ? 'bottom' : 'other';
    pinned.push({ ...(zx.ref(el) as ElRef), edge, share: Math.round((r.height / vh) * 1000) / 1000 });
  }
  const pinnedShare =
    Math.round(pinned.filter((p) => p.edge !== 'other').reduce((a, p) => a + p.share, 0) * 1000) / 1000;

  return {
    viewport: { width: vw, height: vh },
    meta: { content, userScalable, maximumScale },
    targets,
    smallText: smallText.slice(0, 40),
    smallFields,
    nav,
    pinned,
    pinnedShare,
  };
}
