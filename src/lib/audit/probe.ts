/**
 * L1 measurement, inside the page.
 *
 * Every function here is serialised into the browser by Playwright, so none of
 * them may close over anything in this module. Shared helpers are installed once
 * on `window.__zx` by `installHelpers`, and the other functions reach them there.
 *
 * Nothing in this file decides whether a rule fires. It measures — geometry,
 * computed styles, rendered colours, the accessibility tree via axe-core, what is
 * animating — and hands plain data back to the rules in `rules/`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Box = { x: number; y: number; w: number; h: number };
export type RGBA = [number, number, number, number];

export type ElRef = {
  id: string;
  selector: string;
  tag: string;
  box: Box;
  inView: boolean;
  snippet: string;
  text: string;
};

export type StyleSnap = {
  outlineStyle: string;
  outlineWidth: number;
  outlineColor: RGBA;
  outlineOffset: number;
  boxShadow: string;
  border: string;
  borderColor: RGBA;
  borderWidth: number;
  bg: RGBA;
  color: RGBA;
  textDecoration: string;
};

/* ================================================================ helpers */

/**
 * Installs the shared toolkit on `window.__zx`. Idempotent.
 *
 * Colours are read by painting them onto a 1×1 canvas and reading the pixel
 * back, because Chromium now serialises computed colours in whatever space they
 * were authored in — `oklab(...)`, `color(display-p3 ...)` — and only the pixel
 * is guaranteed to be sRGB.
 */
export function installHelpers(opts: { vw: number; vh: number }) {
  const w = window as any;
  if (w.__zx) return true;

  let seq = 1;
  const ids = new WeakMap<Element, string>();
  const byId = new Map<string, Element>();

  const idOf = (el: Element) => {
    let id = ids.get(el);
    if (!id) {
      id = 'z' + seq++;
      ids.set(el, id);
      byId.set(id, el);
    }
    return id;
  };

  const esc = (s: string) => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/[^\w-]/g, '\\$&'));

  /** A selector that finds exactly this element again. */
  const selectorOf = (el: Element): string => {
    if (el === document.documentElement) return 'html';
    if (el.id && document.querySelectorAll('#' + esc(el.id)).length === 1) return '#' + esc(el.id);
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      let part = node.tagName.toLowerCase();
      if (node !== el && node.id && document.querySelectorAll('#' + esc(node.id)).length === 1) {
        parts.unshift('#' + esc(node.id));
        break;
      }
      const parent: Element | null = node.parentElement;
      if (parent) {
        const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  };

  const boxOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };

  /** In the first screen: its centre is on it, or a large share of it is. */
  const inView = (b: { x: number; y: number; w: number; h: number }) => {
    if (b.w <= 0 || b.h <= 0) return false;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    if (cx >= 0 && cx <= opts.vw && cy >= 0 && cy <= opts.vh) return true;
    const ix = Math.max(0, Math.min(b.x + b.w, opts.vw) - Math.max(b.x, 0));
    const iy = Math.max(0, Math.min(b.y + b.h, opts.vh) - Math.max(b.y, 0));
    return ix * iy >= 0.4 * Math.min(b.w * b.h, opts.vw * opts.vh);
  };

  const text = (el: Element) => ((el as HTMLElement).innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();

  const ref = (el: Element) => {
    const b = boxOf(el);
    return {
      id: idOf(el),
      selector: selectorOf(el),
      tag: el.tagName.toLowerCase(),
      box: b,
      inView: inView(b),
      snippet: (el.outerHTML || '').replace(/\s+/g, ' ').slice(0, 200),
      text: text(el).slice(0, 140),
    };
  };

  /** Rendered and perceivable: laid out, not hidden, not faded to nothing. */
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') return false;
    let node: Element | null = el;
    for (let d = 0; node && d < 12; d += 1, node = node.parentElement) {
      if (Number(getComputedStyle(node).opacity) < 0.05) return false;
    }
    return true;
  };

  /** The screen-reader-only pattern: present to assistive tech, not to eyes. */
  const srOnly = (el: Element) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return (
      (r.width <= 2 && r.height <= 2) ||
      s.clip === 'rect(0px, 0px, 0px, 0px)' ||
      /inset\(50%\)/.test(s.clipPath) ||
      r.right < -500 ||
      r.bottom < -500
    );
  };

  /* ------------------------------------------------------------ colours */

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const cache = new Map<string, number[]>();

  const rgba = (css: string): number[] => {
    if (!css || css === 'transparent') return [0, 0, 0, 0];
    const hit = cache.get(css);
    if (hit) return hit;
    const alphaMatch = css.match(/\/\s*([\d.]+%?)\s*\)$|rgba\([^)]*,\s*([\d.]+)\s*\)$/);
    let alpha = 1;
    if (alphaMatch) {
      const a = alphaMatch[1] ?? alphaMatch[2];
      alpha = a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    // getImageData un-premultiplies, so the RGB is the colour itself.
    const out = [d[0], d[1], d[2], Math.round(Math.min(alpha, d[3] / 255) * 1000) / 1000];
    cache.set(css, out);
    return out;
  };

  const over = (top: number[], under: number[]) => {
    const a = top[3];
    return [
      top[0] * a + under[0] * (1 - a),
      top[1] * a + under[1] * (1 - a),
      top[2] * a + under[2] * (1 - a),
      1,
    ];
  };

  /**
   * The colour an element's content actually sits on, composited up through its
   * ancestors. Returns null when an image or gradient is in the way — that is
   * not a colour anyone can compute a ratio against.
   */
  const effectiveBg = (el: Element | null): number[] | null => {
    const layers: number[][] = [];
    for (let node = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = rgba(s.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let base = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i -= 1) base = over(layers[i], base);
    return base.map((v, i) => (i < 3 ? Math.round(v) : 1));
  };

  const lum = (c: number[]) => {
    const ch = (v: number) => {
      const x = v / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  };
  const contrast = (a: number[], b: number[]) => {
    const x = lum(a);
    const y = lum(b);
    return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100;
  };
  const hex = (c: number[]) =>
    '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

  /* -------------------------------------------------------------- styles */

  const snap = (el: Element) => {
    const s = getComputedStyle(el);
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => parseFloat((s as any)['border' + k + 'Width']) || 0);
    return {
      outlineStyle: s.outlineStyle,
      outlineWidth: parseFloat(s.outlineWidth) || 0,
      outlineColor: rgba(s.outlineColor),
      outlineOffset: parseFloat(s.outlineOffset) || 0,
      boxShadow: s.boxShadow,
      border: ['Top', 'Right', 'Bottom', 'Left']
        .map((k) => (s as any)['border' + k + 'Style'] + ' ' + (s as any)['border' + k + 'Width'] + ' ' + (s as any)['border' + k + 'Color'])
        .join('|'),
      borderColor: rgba(s.borderTopColor),
      borderWidth: Math.max(...bw),
      bg: rgba(s.backgroundColor),
      color: rgba(s.color),
      textDecoration: s.textDecorationLine,
    };
  };

  /** Accessible name, simplified: labelledby, label, then visible text and alts. */
  const nameOf = (el: Element): string => {
    const by = el.getAttribute('aria-labelledby');
    if (by) {
      const t = by
        .split(/\s+/)
        .map((i) => document.getElementById(i))
        .filter(Boolean)
        .map((n) => text(n!))
        .join(' ')
        .trim();
      if (t) return t;
    }
    const label = el.getAttribute('aria-label');
    if (label && label.trim()) return label.trim();
    const parts: string[] = [];
    const walk = (n: Node) => {
      if (n.nodeType === 3) parts.push(n.textContent || '');
      if (n.nodeType !== 1) return;
      const e = n as Element;
      if (e.getAttribute('aria-hidden') === 'true') return;
      if (e.tagName === 'IMG') parts.push(e.getAttribute('alt') || '');
      if (e.tagName.toLowerCase() === 'svg') {
        const t = e.querySelector('title');
        if (t) parts.push(t.textContent || '');
        return;
      }
      e.childNodes.forEach(walk);
    };
    walk(el);
    const t = parts.join(' ').replace(/\s+/g, ' ').trim();
    return t || (el.getAttribute('title') || '').trim();
  };

  const fixedOrSticky = (el: Element) => {
    for (let n: Element | null = el; n; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  };

  w.__zx = {
    idOf,
    byId,
    selectorOf,
    boxOf,
    inView,
    text,
    ref,
    visible,
    srOnly,
    rgba,
    effectiveBg,
    contrast,
    hex,
    snap,
    nameOf,
    fixedOrSticky,
    focusBaseline: new Map<string, any>(),
  };
  return true;
}

/* ============================================================== axe-core */

export type AxeNode = ElRef & {
  impact: string | null;
  data: Record<string, any> | null;
  messages: string[];
  logo: boolean;
  ariaHiddenAncestor: boolean;
  hasSvgOrIcon: boolean;
  hasImg: boolean;
};

export type AxeRuleResult = {
  violations: AxeNode[];
  incomplete: AxeNode[];
  passes: number;
  /** The rule could not run at all on this page. */
  inapplicable: boolean;
};

/** Runs the listed axe-core rules and resolves each flagged node to a box. */
export async function runAxe(rules: string[]): Promise<Record<string, AxeRuleResult>> {
  const w = window as any;
  const Z = w.__zx;
  const result = await w.axe.run(document, {
    runOnly: { type: 'rule', values: rules },
    resultTypes: ['violations', 'incomplete'],
    elementRef: false,
  });

  const toNode = (n: any): AxeNode | null => {
    const target = n.target?.[0];
    if (typeof target !== 'string') return null;
    let el: Element | null = null;
    try {
      el = document.querySelector(target);
    } catch {
      return null;
    }
    if (!el) return null;
    const checks = [...(n.any || []), ...(n.all || []), ...(n.none || [])];
    const data = checks.find((c: any) => c.data && typeof c.data === 'object')?.data ?? null;
    let logo = false;
    let ariaHidden = false;
    for (let a: Element | null = el, d = 0; a && d < 6; a = a.parentElement, d += 1) {
      const sig = [a.id, a.getAttribute('class'), a.getAttribute('aria-label'), a.getAttribute('alt')]
        .filter(Boolean)
        .join(' ');
      if (/logo|brand|wordmark/i.test(sig)) logo = true;
      if (a.getAttribute('aria-hidden') === 'true') ariaHidden = true;
    }
    return {
      ...Z.ref(el),
      impact: n.impact ?? null,
      data,
      messages: checks.map((c: any) => c.message).filter(Boolean).slice(0, 3),
      logo,
      ariaHiddenAncestor: ariaHidden,
      hasSvgOrIcon: !!el.querySelector('svg, i, [class*="icon" i], [class*="fa-" i], [class*="material" i]'),
      hasImg: !!el.querySelector('img, [role="img"]'),
    };
  };

  const out: Record<string, AxeRuleResult> = {};
  for (const id of rules) {
    out[id] = { violations: [], incomplete: [], passes: 0, inapplicable: false };
  }
  for (const v of result.violations) {
    if (out[v.id]) out[v.id].violations = v.nodes.map(toNode).filter(Boolean);
  }
  for (const v of result.incomplete) {
    if (out[v.id]) out[v.id].incomplete = v.nodes.map(toNode).filter(Boolean);
  }
  for (const v of result.passes) {
    if (out[v.id]) out[v.id].passes = v.nodes.length;
  }
  for (const v of result.inapplicable) {
    if (out[v.id]) out[v.id].inapplicable = true;
  }
  return out;
}

/* ================================================================= facts */

export type ImageFact = ElRef & {
  alt: string | null;
  src: string;
  role: string | null;
  ariaHidden: boolean;
  presentational: boolean;
  inControl: boolean;
  controlHasOtherText: boolean;
  inFigure: boolean;
  figcaption: string | null;
  surrounding: string;
  adjacentText: string;
};

export type ControlFact = ElRef & {
  role: string;
  disabled: boolean;
  borderColor: RGBA;
  borderWidth: number;
  borderStyle: string;
  bg: RGBA;
  /** What the control sits on. Null when that is an image or gradient. */
  outerBg: number[] | null;
  /** What the control's own face resolves to. */
  innerBg: number[] | null;
  iconColor: RGBA | null;
};

export type LinkFact = ElRef & { name: string; href: string; ariaLabel: boolean };

/** A form field and how — if at all — it is labelled, by the catalog's definition. */
export type FieldFact = ElRef & {
  type: string;
  placeholder: string;
  idAttr: string | null;
  nameAttr: string | null;
  /** label[for] or wrapping label, aria-label, aria-labelledby, or title. Placeholder does not count. */
  labelledBy: string | null;
  honeypot: boolean;
};

export type InteractiveFact = ElRef & { name: string; href: string | null; inline: boolean };

export type HeadingFact = ElRef & {
  level: number;
  landmark: 'aside' | 'footer' | 'nav' | null;
  firstInLandmark: boolean;
  srOnly: boolean;
};

export type ColorGroup = {
  container: ElRef;
  items: (ElRef & { color: string; label: string; hasIcon: boolean; keywords: boolean })[];
  keywords: boolean;
};

export type MediaFact = ElRef & {
  kind: 'video' | 'audio';
  src: string;
  autoplay: boolean;
  playing: boolean;
  muted: boolean;
  loop: boolean;
  duration: number | null;
  controls: boolean;
  nearbyControl: boolean;
  decorative: boolean;
};

export type MotionFact = {
  id: string;
  selector: string;
  box: Box;
  inView: boolean;
  kind: 'animation' | 'transition';
  name: string;
  durationMs: number;
  props: string[];
  transformBased: boolean;
  sheet: string;
};

export type PageFacts = {
  url: string;
  dir: 'ltr' | 'rtl';
  lang: string | null;
  htmlAttributes: Record<string, string>;
  title: string | null;
  viewportMeta: string | null;
  landmarks: { main: number; nav: number; header: number; footer: number; aside: number };
  navLinkMax: number;
  headings: HeadingFact[];
  h1: { scope: 'main' | 'document'; items: (ElRef & { sectionRoot: boolean })[] };
  largestText: ElRef | null;
  images: ImageFact[];
  fields: FieldFact[];
  controls: ControlFact[];
  links: LinkFact[];
  interactive: InteractiveFact[];
  colorGroups: ColorGroup[];
  media: MediaFact[];
  motion: MotionFact[];
  reducedMotionRule: boolean;
  animatedSources: { animations: number; video: number; canvas: number; gif: number };
  palette: string[];
  focusableCount: number;
  modalOpen: boolean;
  bodyText: string;
  docHeight: number;
};

/**
 * Everything the rules read from the page at rest, measured with the page
 * scrolled to the top so every box is in first-screen coordinates.
 */
export function collectFacts(): PageFacts {
  const Z = (window as any).__zx;
  window.scrollTo(0, 0);
  const all = <T extends Element = Element>(sel: string) => Array.from(document.querySelectorAll<T>(sel));

  /* ---- document ---------------------------------------------------- */
  const html = document.documentElement;
  const htmlAttributes: Record<string, string> = {};
  for (const a of Array.from(html.attributes)) htmlAttributes[a.name] = a.value;

  const landmarks = {
    main: all('main, [role="main"]').length,
    nav: all('nav, [role="navigation"]').length,
    header: all('header, [role="banner"]').length,
    footer: all('footer, [role="contentinfo"]').length,
    aside: all('aside, [role="complementary"]').length,
  };
  const navLinkMax = Math.max(
    0,
    ...all('nav, [role="navigation"], header').map((n) => n.querySelectorAll('a[href]').length),
  );

  /* ---- headings ---------------------------------------------------- */
  const headingEls = all('h1,h2,h3,h4,h5,h6,[role="heading"][aria-level]').filter((h) => {
    const s = getComputedStyle(h);
    return s.display !== 'none' && s.visibility !== 'hidden' && !h.closest('[aria-hidden="true"]');
  });
  const seenLandmark = new Set<Element>();
  const headings: HeadingFact[] = headingEls
    .filter((h) => Z.text(h))
    .map((h) => {
      const level = /^H\d$/.test(h.tagName) ? Number(h.tagName[1]) : Number(h.getAttribute('aria-level')) || 2;
      const lm = h.closest('aside, footer, nav, [role="complementary"], [role="contentinfo"], [role="navigation"]');
      const landmark = lm
        ? lm.matches('aside, [role="complementary"]')
          ? 'aside'
          : lm.matches('footer, [role="contentinfo"]')
            ? 'footer'
            : 'nav'
        : null;
      const firstInLandmark = !!lm && !seenLandmark.has(lm);
      if (lm) seenLandmark.add(lm);
      return { ...Z.ref(h), level, landmark, firstInLandmark, srOnly: Z.srOnly(h) } as HeadingFact;
    });

  const mainEl = document.querySelector('main, [role="main"]');
  const h1Scope = mainEl ? 'main' : 'document';
  const h1Items = headings
    .filter((h) => h.level === 1)
    .filter((h) => !mainEl || mainEl.contains(Z.byId.get(h.id)))
    .map((h) => {
      const el = Z.byId.get(h.id) as Element;
      return { ...h, sectionRoot: !!el.closest('section, article') };
    });

  /* The most prominent text on the first screen — what to promote to h1. */
  let largestText: ElRef | null = null;
  let largest = 0;
  for (const el of all('h1,h2,h3,h4,h5,h6,p,span,div,a,strong')) {
    if (el.children.length > 2) continue;
    const t = Z.text(el);
    if (!t || t.length < 3 || t.length > 160) continue;
    const b = Z.boxOf(el);
    if (!Z.inView(b) || !Z.visible(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize) || 0;
    if (size > largest) {
      largest = size;
      largestText = Z.ref(el);
    }
  }

  /* ---- images ------------------------------------------------------ */
  const images: ImageFact[] = all('img, [role="img"]')
    .filter((el) => Z.visible(el))
    .map((el) => {
      const control = el.closest('a[href], button, [role="button"]');
      let controlHasOtherText = false;
      if (control) {
        const clone = control.cloneNode(true) as Element;
        clone.querySelectorAll('img, [role="img"], svg').forEach((n) => n.remove());
        controlHasOtherText = !!(clone.textContent || '').trim() || !!control.getAttribute('aria-label');
      }
      const fig = el.closest('figure');
      const cap = fig?.querySelector('figcaption');
      const parent = el.parentElement;
      const adjacent = [el.previousElementSibling, el.nextElementSibling, parent?.nextElementSibling]
        .filter(Boolean)
        .map((n) => Z.text(n))
        .find((t: string) => t.length > 0) || '';
      return {
        ...Z.ref(el),
        alt: el.getAttribute('alt'),
        src: (el.getAttribute('src') || el.getAttribute('data-src') || '').slice(0, 300),
        role: el.getAttribute('role'),
        ariaHidden: !!el.closest('[aria-hidden="true"]'),
        presentational: ['presentation', 'none'].includes(el.getAttribute('role') || ''),
        inControl: !!control,
        controlHasOtherText,
        inFigure: !!fig,
        figcaption: cap ? Z.text(cap).slice(0, 200) : null,
        surrounding: parent ? Z.text(parent).slice(0, 200) : '',
        adjacentText: adjacent.slice(0, 200),
      };
    });

  /* ---- form fields and their labels ------------------------------------ */
  const fields: FieldFact[] = all(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea',
  ).map((el) => {
    const input = el as HTMLInputElement;
    const labels = Array.from(input.labels ?? []).map((l) => Z.text(l)).filter(Boolean);
    const by = (el.getAttribute('aria-labelledby') || '')
      .split(/\s+/)
      .map((i) => document.getElementById(i))
      .filter(Boolean)
      .map((n) => Z.text(n!))
      .join(' ')
      .trim();
    const labelledBy = labels.length
      ? 'label'
      : by
        ? 'aria-labelledby'
        : (el.getAttribute('aria-label') || '').trim()
          ? 'aria-label'
          : (el.getAttribute('title') || '').trim()
            ? 'title'
            : null;
    const s = getComputedStyle(el);
    const honeypot =
      !!el.closest('[aria-hidden="true"]') ||
      el.getAttribute('tabindex') === '-1' ||
      Z.srOnly(el) ||
      Number(s.opacity) < 0.05 ||
      !Z.visible(el);
    return {
      ...Z.ref(el),
      type: el.tagName === 'INPUT' ? (input.type || 'text') : el.tagName.toLowerCase(),
      placeholder: el.getAttribute('placeholder') || '',
      idAttr: el.getAttribute('id'),
      nameAttr: el.getAttribute('name'),
      labelledBy,
      honeypot,
    };
  });

  /* ---- form controls and icon controls, for boundary contrast --------- */
  const controlSel =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="range"]):not([type="color"]):not([type="file"]), select, textarea, [role="checkbox"], [role="switch"], [role="radio"], button, [role="button"]';
  const controls: ControlFact[] = [];
  for (const el of all(controlSel)) {
    if (!Z.visible(el)) continue;
    const s = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || '').toLowerCase();
    const isIconOnly =
      (tag === 'button' || el.getAttribute('role') === 'button') &&
      !Z.text(el) &&
      !!el.querySelector('svg');
    const isField = tag === 'input' || tag === 'select' || tag === 'textarea';
    const isToggle = ['checkbox', 'radio'].includes(type) || ['checkbox', 'switch', 'radio'].includes(el.getAttribute('role') || '');
    if (!isField && !isToggle && !isIconOnly) continue;
    // Native checkboxes and radios are painted by the browser; their outline is
    // not in the computed style, so there is nothing honest to measure.
    if (isToggle && tag === 'input' && s.appearance !== 'none') continue;
    let iconColor: number[] | null = null;
    if (isIconOnly) {
      const svg = el.querySelector('svg')!;
      const ss = getComputedStyle(svg);
      const stroke = ss.stroke && ss.stroke !== 'none' ? Z.rgba(ss.stroke) : null;
      const fill = ss.fill && ss.fill !== 'none' ? Z.rgba(ss.fill) : null;
      iconColor = (stroke && stroke[3] > 0 ? stroke : fill) || Z.rgba(ss.color);
    }
    controls.push({
      ...Z.ref(el),
      role: isIconOnly ? 'icon-button' : isToggle ? el.getAttribute('role') || type : tag === 'select' ? 'select' : tag === 'textarea' ? 'textarea' : 'textbox',
      disabled: (el as HTMLInputElement).disabled === true || el.getAttribute('aria-disabled') === 'true',
      borderColor: Z.rgba(s.borderTopColor),
      borderWidth: parseFloat(s.borderTopWidth) || 0,
      borderStyle: s.borderTopStyle,
      bg: Z.rgba(s.backgroundColor),
      outerBg: Z.effectiveBg(el.parentElement),
      innerBg: Z.effectiveBg(el),
      iconColor: iconColor as any,
    });
  }

  /* ---- links and targets ------------------------------------------- */
  const links: LinkFact[] = all<HTMLAnchorElement>('a[href]')
    .filter((a) => Z.visible(a))
    .map((a) => ({
      ...Z.ref(a),
      name: Z.nameOf(a),
      href: a.getAttribute('href') || '',
      ariaLabel: !!(a.getAttribute('aria-label') || a.getAttribute('aria-labelledby')),
    }))
    .filter((l) => l.inView);

  const interactive: InteractiveFact[] = all(
    'a[href], button, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], select, summary, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="tab"]',
  )
    .filter((el) => Z.visible(el) && !Z.srOnly(el))
    .map((el) => {
      const s = getComputedStyle(el);
      const parent = el.parentElement;
      // A link inside running text: inline, and the sentence around it is
      // noticeably longer than the link itself.
      const inline =
        el.tagName === 'A' &&
        s.display === 'inline' &&
        !!parent &&
        /^(P|LI|SPAN|TD|DD|BLOCKQUOTE|LABEL|SMALL|EM|STRONG)$/.test(parent.tagName) &&
        Z.text(parent).length > Z.text(el).length + 20;
      return { ...Z.ref(el), name: Z.nameOf(el), href: el.getAttribute('href'), inline };
    })
    .filter((x) => x.inView);

  /* ---- colour-only groups ------------------------------------------ */
  const KEY = /(status|legend|badge|dot|indicator|state|valid|invalid|error|success|warning|danger|online|offline|severity|priority)/i;
  const colorGroups: ColorGroup[] = [];
  const seenContainers = new Set<Element>();
  for (const container of all('ul, ol, div, dl, section, legend, fieldset, span')) {
    if (seenContainers.has(container)) continue;
    const kids = Array.from(container.children).filter((k) => Z.visible(k));
    if (kids.length < 2 || kids.length > 12) continue;
    // Status variants differ by exactly the class that names the state, so a
    // group is recognised by tag and structure rather than by class list.
    const sig = (k: Element) => k.tagName + '/' + k.childElementCount;
    const first = sig(kids[0]);
    if (!kids.every((k) => sig(k) === first)) continue;
    const cBox = Z.boxOf(container);
    if (!Z.inView(cBox)) continue;
    const items = kids.map((k) => {
      const s = getComputedStyle(k);
      let c = Z.rgba(s.backgroundColor);
      if (c[3] === 0) {
        const dot = k.querySelector('*');
        const ds = dot ? getComputedStyle(dot) : null;
        const dc = ds ? Z.rgba(ds.backgroundColor) : [0, 0, 0, 0];
        c = dc[3] > 0 ? dc : Z.rgba(s.color);
      }
      const label = [k.getAttribute('aria-label'), k.getAttribute('title'), Z.text(k)].filter(Boolean).join(' ').trim();
      return {
        ...Z.ref(k),
        color: Z.hex(c),
        label,
        hasIcon: !!k.querySelector('svg, img, i, [class*="icon" i]'),
        keywords: KEY.test((k.getAttribute('class') || '') + ' ' + (k.getAttribute('role') || '')),
      };
    });
    if (new Set(items.map((i) => i.color)).size < 2) continue;
    seenContainers.add(container);
    colorGroups.push({
      container: Z.ref(container),
      items,
      keywords:
        KEY.test((container.getAttribute('class') || '') + ' ' + (container.getAttribute('role') || '')) ||
        items.some((i) => i.keywords),
    });
    if (colorGroups.length >= 20) break;
  }

  /* ---- media ------------------------------------------------------- */
  const media: MediaFact[] = all<HTMLMediaElement>('video, audio').map((m) => {
    const box = Z.boxOf(m);
    const container = m.parentElement?.parentElement?.parentElement || m.parentElement;
    const nearbyControl = !!container &&
      Array.from(container.querySelectorAll('button, [role="button"]')).some((b) =>
        /pause|play|stop|mute/i.test(Z.nameOf(b)),
      );
    const s = getComputedStyle(m);
    const parentBox = m.parentElement ? Z.boxOf(m.parentElement) : box;
    const covers =
      (s.position === 'absolute' || s.position === 'fixed' || s.objectFit === 'cover') &&
      box.w >= parentBox.w * 0.9 &&
      box.h >= parentBox.h * 0.9;
    return {
      ...Z.ref(m),
      kind: m.tagName === 'VIDEO' ? 'video' : 'audio',
      src: (m.currentSrc || m.getAttribute('src') || m.querySelector('source')?.getAttribute('src') || '').slice(0, 300),
      autoplay: m.autoplay || m.hasAttribute('autoplay'),
      playing: !m.paused && m.currentTime > 0,
      muted: m.muted || m.hasAttribute('muted'),
      loop: m.loop,
      duration: Number.isFinite(m.duration) ? Math.round(m.duration * 10) / 10 : m.duration === Infinity ? Infinity : null,
      controls: m.controls,
      nearbyControl,
      decorative: m.getAttribute('aria-hidden') === 'true' || covers,
    };
  });

  /* ---- motion ------------------------------------------------------ */
  const keyframeSheet = (name: string): string => {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const r of Array.from(rules)) {
        if ((r as CSSKeyframesRule).name === name) return sheet.href || 'inline <style>';
      }
    }
    return 'not readable (cross-origin stylesheet)';
  };
  let reducedMotionRule = false;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const r of Array.from(sheet.cssRules)) {
        if (r instanceof CSSMediaRule && /prefers-reduced-motion/.test(r.conditionText || r.media.mediaText)) {
          reducedMotionRule = true;
        }
      }
    } catch {
      /* cross-origin sheet */
    }
  }

  const MOVE = /^(transform|translate|scale|rotate|offset|top|left|right|bottom|margin|inset)/;
  const motion: MotionFact[] = [];
  const animated = new Set<Element>();
  for (const anim of document.getAnimations()) {
    const effect = anim.effect as KeyframeEffect | null;
    const target = effect?.target as Element | null;
    if (!effect || !target || anim.playState !== 'running') continue;
    const timing = effect.getComputedTiming();
    const duration = typeof timing.duration === 'number' ? timing.duration : 0;
    const props = Array.from(
      new Set(
        effect
          .getKeyframes()
          .flatMap((k) => Object.keys(k))
          .filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k)),
      ),
    );
    const b = Z.boxOf(target);
    animated.add(target);
    const name =
      (anim as any).animationName || (anim as any).transitionProperty || anim.id || 'script animation';
    motion.push({
      id: Z.idOf(target),
      selector: Z.selectorOf(target),
      box: b,
      inView: Z.inView(b),
      kind: 'animation',
      name,
      durationMs: Math.round(duration),
      props,
      transformBased: props.some((p) => MOVE.test(p)),
      sheet: (anim as any).animationName ? keyframeSheet((anim as any).animationName) : 'Web Animations API (script)',
    });
  }
  // Declared movement transitions on what is visible — they run on hover or focus.
  for (const el of all('a, button, [role="button"], img, div, section, li, span').slice(0, 2500)) {
    if (animated.has(el)) continue;
    const s = getComputedStyle(el);
    if (!s.transitionDuration || s.transitionDuration === '0s') continue;
    const durations = s.transitionDuration.split(',').map((d) => parseFloat(d) * (d.includes('ms') ? 1 : 1000));
    const props = s.transitionProperty.split(',').map((p) => p.trim());
    const moving = props
      .map((p, i) => ({ p, d: durations[i % durations.length] }))
      .filter(({ p, d }) => d > 0 && (p === 'all' || MOVE.test(p)));
    if (!moving.length) continue;
    const b = Z.boxOf(el);
    if (!Z.inView(b) || !Z.visible(el)) continue;
    const longest = Math.max(...moving.map((m) => m.d));
    motion.push({
      id: Z.idOf(el),
      selector: Z.selectorOf(el),
      box: b,
      inView: true,
      kind: 'transition',
      name: moving.map((m) => m.p).join(', '),
      durationMs: Math.round(longest),
      props: moving.map((m) => m.p),
      transformBased: moving.some((m) => m.p === 'all' || /transform|translate|scale|rotate/.test(m.p)),
      sheet: 'computed transition on the element',
    });
    if (motion.length > 200) break;
  }

  const animatedSources = {
    animations: motion.filter((m) => m.kind === 'animation' && m.inView).length,
    video: media.filter((m) => m.kind === 'video' && m.inView && m.playing).length,
    canvas: all('canvas').filter((c) => Z.visible(c) && Z.inView(Z.boxOf(c))).length,
    gif: all<HTMLImageElement>('img').filter((i) => /\.(gif|apng)(\?|$)/i.test(i.currentSrc || i.src) && Z.inView(Z.boxOf(i))).length,
  };

  /* ---- palette: the text colours the page already uses ---------------- */
  const colours = new Map<string, number>();
  for (const el of all('h1,h2,h3,h4,h5,h6,p,a,span,li,button,label').slice(0, 1500)) {
    const c = Z.rgba(getComputedStyle(el).color);
    if (c[3] < 0.9) continue;
    const h = Z.hex(c);
    colours.set(h, (colours.get(h) || 0) + 1);
  }
  const palette = [...colours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([h]) => h);

  /* ---- focusables: record how each looks before it has focus ------------ */
  const focusables = all(
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable="true"]',
  ).filter((el) => {
    const ti = el.getAttribute('tabindex');
    return (ti === null || Number(ti) >= 0) && !(el as HTMLInputElement).disabled && Z.visible(el);
  });
  const baseline = Z.focusBaseline as Map<string, any>;
  for (const el of focusables) {
    const id = Z.idOf(el);
    const parents: any[] = [];
    for (let p = el.parentElement, d = 0; p && d < 2; p = p.parentElement, d += 1) parents.push(Z.snap(p));
    baseline.set(id, { self: Z.snap(el), parents, box: Z.boxOf(el) });
  }

  const modal = all('dialog[open], [aria-modal="true"]').find((m) => Z.visible(m));

  return {
    url: location.href,
    dir: (getComputedStyle(html).direction === 'rtl' ? 'rtl' : 'ltr') as 'ltr' | 'rtl',
    lang: html.getAttribute('lang'),
    htmlAttributes,
    title: document.querySelector('title') ? document.title : null,
    viewportMeta: document.querySelector('meta[name="viewport" i]')?.getAttribute('content') ?? null,
    landmarks,
    navLinkMax,
    headings,
    h1: { scope: h1Scope, items: h1Items },
    largestText,
    images,
    fields,
    controls,
    links,
    interactive,
    colorGroups,
    media,
    motion,
    reducedMotionRule,
    animatedSources,
    palette,
    focusableCount: focusables.length,
    modalOpen: !!modal,
    bodyText: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 4000),
    docHeight: Math.max(html.scrollHeight, document.body?.scrollHeight || 0),
  };
}

/* ============================================================ keyboard */

export type FocusStop = {
  body: boolean;
  id: string | null;
  selector: string | null;
  tag: string | null;
  name: string;
  box: Box | null;
  inView: boolean;
  fixed: boolean;
  scrollY: number;
  inModal: boolean;
  focused: StyleSnap | null;
  baseline: { self: StyleSnap; parents: StyleSnap[]; box: Box } | null;
  parentsFocused: StyleSnap[];
  elementBg: number[] | null;
  outerBg: number[] | null;
  href: string | null;
};

/** Where focus is now, and how the focused element looks compared to at rest. */
export function readFocus(): FocusStop {
  const Z = (window as any).__zx;
  let el = document.activeElement as Element | null;
  while (el && (el as any).shadowRoot?.activeElement) el = (el as any).shadowRoot.activeElement;
  if (!el || el === document.body || el === document.documentElement) {
    return {
      body: true, id: null, selector: null, tag: null, name: '', box: null, inView: false, fixed: false,
      scrollY: window.scrollY, inModal: false, focused: null, baseline: null, parentsFocused: [],
      elementBg: null, outerBg: null, href: null,
    };
  }
  const id = Z.idOf(el);
  const fixed = Z.fixedOrSticky(el);
  const r = el.getBoundingClientRect();
  // Fixed elements do not move with the page, so their first-screen position is
  // where they are drawn now; everything else is placed in page coordinates.
  const box = fixed
    ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
    : Z.boxOf(el);
  const parentsFocused: any[] = [];
  for (let p = el.parentElement, d = 0; p && d < 2; p = p.parentElement, d += 1) parentsFocused.push(Z.snap(p));
  return {
    body: false,
    id,
    selector: Z.selectorOf(el),
    tag: el.tagName.toLowerCase(),
    name: Z.nameOf(el).slice(0, 80),
    box,
    inView: Z.inView(box),
    fixed,
    scrollY: Math.round(window.scrollY),
    inModal: !!el.closest('dialog[open], [aria-modal="true"]'),
    focused: Z.snap(el),
    baseline: Z.focusBaseline.get(id) ?? null,
    parentsFocused,
    elementBg: Z.effectiveBg(el),
    outerBg: Z.effectiveBg(el.parentElement),
    href: el.getAttribute('href'),
  };
}

/* ============================================================== motion */

/** After reduced motion is requested: is each element still moving? */
export function motionAfterReduce(ids: string[]): Record<string, { moving: boolean; detail: string }> {
  const Z = (window as any).__zx;
  const out: Record<string, { moving: boolean; detail: string }> = {};
  const MOVE = /^(transform|translate|scale|rotate|offset|top|left|right|bottom|margin|inset)/;
  for (const id of ids) {
    const el = Z.byId.get(id) as Element | undefined;
    if (!el || !el.isConnected) {
      out[id] = { moving: false, detail: 'element removed' };
      continue;
    }
    const running = el
      .getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => {
        const t = (a.effect as KeyframeEffect).getComputedTiming();
        return typeof t.duration === 'number' ? t.duration : 0;
      })
      .filter((d) => d > 300);
    const s = getComputedStyle(el);
    const durations = s.transitionDuration.split(',').map((d) => parseFloat(d) * (d.includes('ms') ? 1 : 1000));
    const props = s.transitionProperty.split(',').map((p) => p.trim());
    const transitions = props
      .map((p, i) => ({ p, d: durations[i % durations.length] }))
      .filter(({ p, d }) => d > 50 && (p === 'all' || MOVE.test(p)));
    const moving = running.length > 0 || transitions.length > 0;
    out[id] = {
      moving,
      detail: moving
        ? running.length
          ? `still animating for ${Math.round(Math.max(...running))}ms`
          : `transition still ${transitions.map((t) => `${t.p} ${Math.round(t.d)}ms`).join(', ')}`
        : 'stops under reduced motion',
    };
  }
  return out;
}
