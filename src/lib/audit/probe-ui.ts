/**
 * L1 measurement for the UI Quality family, inside the page.
 *
 * Same constraints as `probe.ts`: serialised into the browser, no module scope,
 * helpers through `window.__zx`. `collectUiFacts` reads the first screen at
 * rest; the rest are used by the interactive probes in `browser.ts` (hover and
 * press states, dark mode, text stress tests), each of which puts the page back
 * the way it found it.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Box, ElRef } from './probe';

/** One distinct value of a token dimension and where it is used. */
export type Tally = { value: string; px: number | null; count: number; selectors: string[]; boxes: Box[] };

export type Inventory = {
  fontSizes: Tally[];
  fontWeights: Tally[];
  /** Full font-family stacks. `codeOnly` and `icon` stacks are excluded by the catalog. */
  fontFamilies: (Tally & { codeOnly: boolean; icon: boolean })[];
  lineHeights: Tally[];
  colors: { text: Tally[]; background: Tally[]; border: Tally[] };
  spacing: Tally[];
  /** Individual margin/padding sides counted, after exclusions. */
  spacingDeclarations: number;
  radii: Tally[];
  /** Radius values explained by a concentric nesting (outer = inner + padding). */
  concentricRadii: string[];
  shadows: Tally[];
  borderWidths: Tally[];
  transitions: Tally[];
  elements: number;
  /** Elements left out: SVG internals, canvas, iframes, ads, vendor widgets, data-audit-ignore. */
  excluded: number;
};

export type ButtonFact = ElRef & {
  label: string;
  fill: string | null;
  fillContrast: number;
  borderWidth: number;
  borderContrast: number;
  textColor: string;
  fontWeight: number;
  fontSize: number;
  height: number;
  paddingX: number;
  radius: number;
  sizeClass: boolean;
  tierCard: boolean;
  context: 'table' | 'nav' | 'header' | 'body';
  region: string;
};

export type AlignGroup = {
  parent: string;
  axis: 'left' | 'top';
  selectors: string[];
  edges: number[];
  delta: number;
  box: Box;
};

export type ContainerFact = ElRef & { maxWidth: number };

export type DenseGroup = {
  parent: ElRef;
  groupGap: number;
  innerGap: number;
  density: number;
  count: number;
};

export type LeadingFact = ElRef & { fontSize: number; lineHeight: number; ratio: number; lines: number; heading: boolean };

export type ImageTextFact = ElRef & { color: string; imageSrc: string; overlay: boolean };

export type IconFact = ElRef & { style: 'outline' | 'filled'; stroke: number | null; grid: number; group: string };

export type ImageRatioFact = ElRef & { natural: number; rendered: number; src: string; objectFit: string };

export type TruncFact = ElRef & { full: string; shown: string; recover: boolean; inLink: boolean };

export type WeightFact = ElRef & { weight: number; fontSize: number; contrast: number; saturation: number; roles: string[]; region: string };

export type DarkDeclaration = {
  meta: string | null;
  rootScheme: string;
  mediaRules: number;
  /** How the page switches to its dark theme, when it does it with an attribute or class. */
  toggles: { kind: 'attribute' | 'class'; name: string; value: string }[];
};

export type UiFacts = {
  inventory: Inventory;
  buttons: ButtonFact[];
  align: AlignGroup[];
  containers: ContainerFact[];
  dense: DenseGroup[];
  leading: LeadingFact[];
  imageText: ImageTextFact[];
  icons: IconFact[];
  images: ImageRatioFact[];
  /** One element per markup signature, and how many on the first screen it stands for. */
  interactive: { id: string; selector: string; box: Box; signature: string; name: string; count: number }[];
  truncated: TruncFact[];
  stress: { id: string; selector: string; box: Box; text: string; signature: string }[];
  dark: DarkDeclaration;
  primary: WeightFact | null;
  heavy: WeightFact[];
  /** A point on the page with nothing interactive under it, for releasing the mouse. */
  safePoint: { x: number; y: number } | null;
};

export function collectUiFacts(): UiFacts {
  const Z = (window as any).__zx;
  window.scrollTo(0, 0);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const all = <T extends Element = Element>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
  const shown = (el: Element) => Z.visible(el) && !Z.srOnly(el);
  const clean = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
  const px = (v: string) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 2) / 2 : null;
  };
  const ownText = (el: Element) =>
    clean(Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent || '').join(' '));
  // A colour as authored — #RRGGBB, or #RRGGBBAA when translucent — rather than
  // as composited, so one rgba() token over two backgrounds stays one token.
  const authored = (c: number[]) =>
    Z.hex(c) + (c[3] < 0.995 ? Math.round(c[3] * 255).toString(16).padStart(2, '0').toUpperCase() : '');
  const sigOf = (el: Element) =>
    el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').split(/\s+/).filter((c) => c && !/^(is-|has-|active|hover|focus|selected|current)/.test(c)).sort().join('.');

  /* ---- what is in scope ------------------------------------------------- */
  // The ids and classes these widgets actually inject — specific enough that a
  // site's own `.drift` or `.intercom` class is not mistaken for a vendor's.
  const VENDOR =
    /onetrust|cookiebot|intercom-(container|frame|lightweight|launcher|app)|hubspot-messages|hs-banner|drift-(widget|frame)|crisp-client|zendesk-|launcher-frame|_hj-|hotjar|usercentrics|didomi|tawk-|adsbygoogle|google_ads|\bad-slot\b|\badslot\b|\bad-container\b/i;
  const excludedRoot = (el: Element) => {
    if (el.closest('svg, canvas, iframe, object, embed, [data-audit-ignore], ins.adsbygoogle')) return true;
    for (let n: Element | null = el, d = 0; n && d < 8; n = n.parentElement, d += 1) {
      if (VENDOR.test((n.id || '') + ' ' + (n.getAttribute('class') || ''))) return true;
    }
    return false;
  };
  let excluded = 0;
  const scope: Element[] = [];
  for (const el of all('body *').slice(0, 6000)) {
    if (!shown(el)) continue;
    const b = Z.boxOf(el);
    if (!Z.inView(b)) continue;
    if (excludedRoot(el)) {
      excluded += 1;
      continue;
    }
    scope.push(el);
  }

  /* ---- the token inventory ------------------------------------------------ */
  const tallies = () => new Map<string, Tally>();
  const bump = (m: Map<string, Tally>, value: string, pxv: number | null, el: Element) => {
    let t = m.get(value);
    if (!t) {
      t = { value, px: pxv, count: 0, selectors: [], boxes: [] };
      m.set(value, t);
    }
    t.count += 1;
    if (t.selectors.length < 4) {
      t.selectors.push(Z.selectorOf(el));
      t.boxes.push(Z.boxOf(el));
    }
  };
  const sizes = tallies();
  const weights = tallies();
  const families = tallies();
  const familyMeta = new Map<string, { code: boolean; icon: boolean }>();
  const heights = tallies();
  const textColors = tallies();
  const bgColors = tallies();
  const borderColors = tallies();
  const spacing = tallies();
  const radii = tallies();
  const shadows = tallies();
  const borderWidths = tallies();
  const transitions = tallies();
  let spacingDeclarations = 0;
  const concentric = new Set<string>();

  for (const el of scope) {
    const s = getComputedStyle(el);
    const b = Z.boxOf(el);
    const text = ownText(el);
    if (text) {
      const fs = px(s.fontSize);
      bump(sizes, `${fs}px`, fs, el);
      bump(weights, String(Math.round(Number(s.fontWeight) || 400)), Number(s.fontWeight) || 400, el);
      const stack = s.fontFamily.toLowerCase().replace(/["']/g, '').replace(/\s*,\s*/g, ', ');
      bump(families, stack, null, el);
      const meta = familyMeta.get(stack) ?? { code: true, icon: true };
      meta.code &&= !!el.closest('pre, code, kbd, samp') && /mono|courier|consol|menlo|monaco/.test(stack);
      meta.icon &&= /icon|awesome|material symbols|material icons|glyph|fontello|ionicons/.test(stack) || /^[-\s]+$/.test(text);
      familyMeta.set(stack, meta);
      bump(heights, s.lineHeight, px(s.lineHeight), el);
      const tc = Z.rgba(s.color);
      if (tc[3] > 0) bump(textColors, authored(tc), null, el);
    }
    const bg = Z.rgba(s.backgroundColor) as number[];
    if (bg[3] > 0.02) bump(bgColors, authored(bg), null, el);
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const w = parseFloat((s as any)[`border${side}Width`]) || 0;
      const st = (s as any)[`border${side}Style`];
      if (w > 0 && st !== 'none' && st !== 'hidden') {
        const c = Z.rgba((s as any)[`border${side}Color`]);
        if (c[3] > 0) bump(borderColors, authored(c), null, el);
        bump(borderWidths, `${px(String(w))}px`, px(String(w)), el);
      }
    }

    // Spacing. Equal horizontal margins on a narrower block are `margin: auto`
    // centring, which is layout, not a spacing decision.
    const icon = el.matches('img, i, [class*="icon" i]') && b.w <= 32;
    const ml = parseFloat(s.marginLeft) || 0;
    const mr = parseFloat(s.marginRight) || 0;
    const centred = ml > 0 && Math.abs(ml - mr) < 1 && !!el.parentElement && b.w < Z.boxOf(el.parentElement).w - 1;
    for (const prop of ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) {
      const v = Math.abs(parseFloat((s as any)[prop]) || 0);
      if (!v) continue;
      if (centred && (prop === 'marginLeft' || prop === 'marginRight')) continue;
      if (icon && v < 4) continue;
      spacingDeclarations += 1;
      bump(spacing, `${px(String(v))}px`, px(String(v)), el);
    }

    // Radius, per corner; a pill or circle is "full", which the catalog excludes.
    const corners = new Set<string>();
    for (const c of [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius]) {
      if (!c || c.includes('%')) continue;
      const r = parseFloat(c) || 0;
      if (r <= 0 || r >= Math.min(b.w, b.h) / 2 - 0.5 || r >= 9999) continue;
      corners.add(`${px(String(r))}px`);
    }
    for (const c of corners) bump(radii, c, px(c), el);
    if (corners.size) {
      const outer = parseFloat(s.borderTopLeftRadius) || 0;
      const pad = parseFloat(s.paddingTop) || 0;
      const child = el.firstElementChild;
      if (child && pad > 0) {
        const inner = parseFloat(getComputedStyle(child).borderTopLeftRadius) || 0;
        if (inner > 0 && Math.abs(outer - (inner + pad)) <= 1) {
          concentric.add(`${px(String(outer))}px`);
          concentric.add(`${px(String(inner))}px`);
        }
      }
    }

    if (s.boxShadow && s.boxShadow !== 'none') bump(shadows, s.boxShadow.replace(/\s+/g, ' '), null, el);
    if (s.transitionDuration && !/^0s(,\s*0s)*$/.test(s.transitionDuration)) bump(transitions, s.transitionDuration, null, el);
  }
  const list = (m: Map<string, Tally>) => [...m.values()].sort((a, b) => b.count - a.count);
  const inventory: Inventory = {
    fontSizes: list(sizes),
    fontWeights: list(weights),
    fontFamilies: list(families).map((t) => ({ ...t, codeOnly: familyMeta.get(t.value)?.code ?? false, icon: familyMeta.get(t.value)?.icon ?? false })),
    lineHeights: list(heights),
    colors: { text: list(textColors), background: list(bgColors), border: list(borderColors) },
    spacing: list(spacing),
    spacingDeclarations,
    radii: list(radii),
    concentricRadii: [...concentric],
    shadows: list(shadows),
    borderWidths: list(borderWidths),
    transitions: list(transitions),
    elements: scope.length,
    excluded,
  };

  /* ---- buttons ------------------------------------------------------------ */
  const regionOf = (el: Element) =>
    el.closest('section, header, footer, article, aside, form, [role="region"], [role="banner"], [role="dialog"]') ?? document.body;
  const priceRe = /[$€£¥₹]\s?\d|\/\s?(mo|month|yr|year)\b|per (month|year|seat|user)/i;
  const buttons: ButtonFact[] = [];
  for (const el of all('a[href], button, [role="button"], input[type="submit"], input[type="button"]')) {
    if (!shown(el) || excludedRoot(el)) continue;
    const b = Z.boxOf(el);
    if (!Z.inView(b) || b.h < 24 || b.h > 80 || b.w < 40) continue;
    const label = clean(el.tagName === 'INPUT' ? (el as HTMLInputElement).value : Z.nameOf(el));
    if (!label || label.length > 40) continue;
    const s = getComputedStyle(el);
    const outer = Z.effectiveBg(el.parentElement) as number[] | null;
    const face = Z.rgba(s.backgroundColor) as number[];
    const bw = parseFloat(s.borderTopWidth) || 0;
    const hasBorder = bw > 0 && s.borderTopStyle !== 'none';
    const filled = face[3] >= 0.9 && !!outer && Z.contrast(face, outer) >= 1.15;
    if (!filled && !hasBorder && !/gradient/.test(s.backgroundImage)) continue;
    let tierCard = false;
    for (let n = el.parentElement, d = 0; n && d < 6 && !tierCard; n = n.parentElement, d += 1) {
      const p = n.parentElement;
      if (p && priceRe.test(Z.text(n)) && Array.from(p.children).some((c) => c !== n && c.tagName === n!.tagName && priceRe.test(Z.text(c)))) tierCard = true;
    }
    buttons.push({
      ...Z.ref(el),
      label,
      fill: filled ? Z.hex(face) : /gradient/.test(s.backgroundImage) ? 'gradient' : null,
      fillContrast: filled && outer ? Z.contrast(face, outer) : 1,
      borderWidth: hasBorder ? bw : 0,
      borderContrast: hasBorder && outer ? Z.contrast(Z.rgba(s.borderTopColor), outer) : 1,
      textColor: Z.hex(Z.rgba(s.color)),
      fontWeight: Number(s.fontWeight) || 400,
      fontSize: parseFloat(s.fontSize) || 0,
      height: b.h,
      paddingX: Math.round(((parseFloat(s.paddingLeft) || 0) + (parseFloat(s.paddingRight) || 0)) / 2),
      radius: parseFloat(s.borderTopLeftRadius) || 0,
      sizeClass: /(^|[-_\s])(xs|sm|small|md|medium|lg|large|xl|size-)/i.test(el.getAttribute('class') || ''),
      tierCard,
      context: el.closest('table, [role="grid"], [role="table"]')
        ? 'table'
        : el.closest('nav, [role="navigation"]')
          ? 'nav'
          : el.closest('header, [role="banner"]') || Z.fixedOrSticky(el)
            ? 'header'
            : 'body',
      region: Z.selectorOf(regionOf(el)),
    });
    if (buttons.length >= 40) break;
  }

  /* ---- alignment within groups ---------------------------------------------- */
  const align: AlignGroup[] = [];
  const blockish = (c: Element) => {
    const cs = getComputedStyle(c);
    return cs.position !== 'absolute' && cs.position !== 'fixed' && cs.display !== 'inline' && cs.display !== 'contents' && cs.float === 'none';
  };
  for (const parent of scope) {
    if (align.length >= 30) break;
    const ps = getComputedStyle(parent);
    if (/masonry/i.test(parent.getAttribute('class') || '') || ps.display === 'contents') continue;
    const kids = Array.from(parent.children).filter(
      (c) => shown(c) && blockish(c) && !c.matches('svg, img, i, [class*="icon" i]') && Z.inView(Z.boxOf(c)),
    );
    if (kids.length < 2) continue;
    const rects = kids.map((c) => c.getBoundingClientRect());
    const row = ps.display.includes('flex') && !ps.flexDirection.startsWith('column');
    const stacked = !row && rects.every((r, i) => i === 0 || r.top >= rects[i - 1].bottom - 1);
    let axis: 'left' | 'top' | null = null;
    let edges: number[] = [];
    if (stacked) {
      const pr = parent.getBoundingClientRect();
      const pc = pr.left + (parseFloat(ps.paddingLeft) || 0) + (pr.width - (parseFloat(ps.paddingLeft) || 0) - (parseFloat(ps.paddingRight) || 0)) / 2;
      // Centred stacks align on their centres, not their left edges.
      if (rects.every((r) => Math.abs(r.left + r.width / 2 - pc) < 1.5)) continue;
      axis = 'left';
      edges = rects.map((r) => r.left);
    } else if (row && ['normal', 'stretch', 'flex-start', 'start', 'baseline'].includes(ps.alignItems)) {
      if (ps.alignItems === 'baseline') continue;
      axis = 'top';
      edges = rects.map((r) => r.top);
    }
    if (!axis) continue;
    const delta = Math.max(...edges) - Math.min(...edges);
    if (delta < 1 || delta > 6) continue;
    const x = Math.min(...rects.map((r) => r.left));
    const y = Math.min(...rects.map((r) => r.top));
    align.push({
      parent: Z.selectorOf(parent),
      axis,
      selectors: kids.map((k) => Z.selectorOf(k)).slice(0, 6),
      edges: edges.map((e) => Math.round(e * 10) / 10).slice(0, 6),
      delta: Math.round(delta * 10) / 10,
      box: {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(Math.max(...rects.map((r) => r.right)) - x),
        h: Math.round(Math.max(...rects.map((r) => r.bottom)) - y),
      },
    });
  }

  /* ---- centred content containers -------------------------------------------- */
  const containers: ContainerFact[] = [];
  for (const el of scope) {
    const s = getComputedStyle(el);
    if (s.maxWidth === 'none' || !s.maxWidth.endsWith('px')) continue;
    const b = Z.boxOf(el);
    if (b.w < 480 || b.w > vw - 20) continue;
    const ml = parseFloat(s.marginLeft) || 0;
    const mr = parseFloat(s.marginRight) || 0;
    if (ml <= 0 || Math.abs(ml - mr) > 1) continue;
    if (containers.some((c) => Z.byId.get(c.id)?.contains(el))) continue;
    containers.push({ ...Z.ref(el), maxWidth: Math.round(parseFloat(s.maxWidth)) });
  }

  /* ---- groups packed too tightly ---------------------------------------------- */
  const dense: DenseGroup[] = [];
  for (const parent of scope) {
    if (dense.length >= 10) break;
    if (parent.closest('table, [role="grid"], [role="table"]')) continue;
    const kids = Array.from(parent.children).filter((c) => shown(c) && Z.inView(Z.boxOf(c)) && c.children.length >= 2);
    if (kids.length < 2) continue;
    const sig = sigOf(kids[0]);
    if (!kids.every((k) => sigOf(k) === sig)) continue;
    const r = kids.map((k) => k.getBoundingClientRect());
    const gaps: number[] = [];
    for (let i = 1; i < r.length; i += 1) {
      const sameRow = Math.abs(r[i].top - r[i - 1].top) < 4;
      gaps.push(sameRow ? r[i].left - r[i - 1].right : r[i].top - r[i - 1].bottom);
    }
    const groupGap = Math.min(...gaps);
    if (groupGap < 0) continue;
    const inner = Array.from(kids[0].children).filter((c) => shown(c)).map((c) => c.getBoundingClientRect());
    const innerGaps: number[] = [];
    for (let i = 1; i < inner.length; i += 1) {
      const g = inner[i].top - inner[i - 1].bottom;
      if (g >= 0) innerGaps.push(g);
    }
    if (!innerGaps.length) continue;
    const innerGap = Math.min(...innerGaps);
    // Ink: text and images, as a share of the group's area.
    const pr = parent.getBoundingClientRect();
    let ink = 0;
    const range = document.createRange();
    range.selectNodeContents(parent);
    for (const t of Array.from(range.getClientRects())) ink += t.width * t.height;
    for (const img of all('img, svg, video', parent)) {
      const ir = img.getBoundingClientRect();
      ink += ir.width * ir.height;
    }
    dense.push({
      parent: Z.ref(parent),
      groupGap: Math.round(groupGap),
      innerGap: Math.round(innerGap),
      density: Math.round(Math.min(1, ink / Math.max(1, pr.width * pr.height)) * 100) / 100,
      count: kids.length,
    });
  }

  /* ---- line height on multi-line text ------------------------------------------- */
  const lineCount = (el: Element) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops: number[] = [];
    for (const r of Array.from(range.getClientRects())) if (r.width > 1 && r.height > 1) tops.push(Math.round(r.bottom));
    return [...new Set(tops)].sort((a, b) => a - b);
  };
  const leading: LeadingFact[] = [];
  for (const el of scope) {
    if (leading.length >= 60) break;
    if (el.closest('button, label, td, th, [role="button"], nav') || el.matches('a, span') && getComputedStyle(el).display === 'inline') continue;
    const text = ownText(el);
    if (text.length < 20) continue;
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize) || 0;
    const bottoms = lineCount(el);
    if (bottoms.length < 2) continue;
    let lh = parseFloat(s.lineHeight);
    if (!Number.isFinite(lh)) {
      const steps = bottoms.slice(1).map((v, i) => v - bottoms[i]);
      lh = steps.reduce((a, v) => a + v, 0) / steps.length;
    }
    leading.push({
      ...Z.ref(el),
      fontSize: fs,
      lineHeight: Math.round(lh * 10) / 10,
      ratio: Math.round((lh / fs) * 100) / 100,
      lines: bottoms.length,
      heading: /^H[1-6]$/.test(el.tagName) || fs >= 24,
    });
  }

  /* ---- text sitting on a raster image ------------------------------------------ */
  const imageText: ImageTextFact[] = [];
  for (const el of scope) {
    if (imageText.length >= 30) break;
    const text = ownText(el);
    if (text.length < 2) continue;
    let src = '';
    let overlay = false;
    let solid = false;
    for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
      const s = getComputedStyle(n);
      const url = s.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (url) {
        src = url[1];
        break;
      }
      if (/gradient/.test(s.backgroundImage)) overlay = true;
      const c = Z.rgba(s.backgroundColor);
      if (c[3] >= 0.95) {
        solid = true;
        break;
      }
      if (c[3] > 0.1) overlay = true;
    }
    if (!src && !solid) {
      // Media painted behind the text by positioning rather than as a background.
      const r = el.getBoundingClientRect();
      const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const own = stack.indexOf(el);
      for (const n of stack.slice(own + 1)) {
        if (n.contains(el)) continue;
        if (n.matches('img, video, picture, canvas')) {
          src = (n as HTMLImageElement).currentSrc || n.getAttribute('src') || n.tagName.toLowerCase();
          break;
        }
        const s = getComputedStyle(n);
        const c = Z.rgba(s.backgroundColor);
        if (c[3] >= 0.95) break;
        if (c[3] > 0.1 || /gradient/.test(s.backgroundImage)) overlay = true;
      }
    }
    if (!src || /\.svg(\?|$)/i.test(src)) continue;
    imageText.push({ ...Z.ref(el), color: Z.hex(Z.rgba(getComputedStyle(el).color)), imageSrc: src.slice(0, 200), overlay });
  }

  /* ---- icons -------------------------------------------------------------------- */
  const icons: IconFact[] = [];
  for (const svg of all<SVGSVGElement>('svg')) {
    if (icons.length >= 60) break;
    if (!shown(svg) || excludedRoot(svg.parentElement ?? svg)) continue;
    const b = Z.boxOf(svg);
    if (!Z.inView(b) || b.w < 10 || b.w > 64 || b.h > 64) continue;
    if (svg.closest('[class*="logo" i], [id*="logo" i], [aria-label*="logo" i]')) continue;
    const vb = svg.viewBox?.baseVal;
    const grid = vb && vb.width ? vb.width : b.w;
    const shapes = all('path, circle, rect, line, polyline, polygon, ellipse', svg).filter((sh) => !sh.closest('defs, clipPath, mask'));
    if (!shapes.length) continue;
    let stroked = 0;
    let filled = 0;
    const widths = new Set<number>();
    for (const sh of shapes) {
      const s = getComputedStyle(sh);
      const sw = parseFloat(s.strokeWidth) || 0;
      if (s.stroke && s.stroke !== 'none' && sw > 0 && Z.rgba(s.stroke)[3] > 0) {
        stroked += 1;
        widths.add(Math.round(((sw * 24) / grid) * 4) / 4);
      }
      if (s.fill && s.fill !== 'none' && Z.rgba(s.fill)[3] > 0) filled += 1;
    }
    const style = stroked && !filled ? 'outline' : filled && !stroked ? 'filled' : null;
    if (!style) continue;
    // A functional group is a set of controls working together, not the page.
    const group = svg.closest('nav, ul, ol, menu, [role="toolbar"], [role="tablist"], [role="menu"], [role="menubar"], [role="group"]');
    icons.push({
      ...Z.ref(svg),
      style,
      stroke: style === 'outline' && widths.size === 1 ? [...widths][0] : null,
      grid: Math.round(grid),
      group: group ? Z.selectorOf(group) : '',
    });
  }

  /* ---- images drawn at the wrong shape ---------------------------------------------- */
  const images: ImageRatioFact[] = [];
  for (const img of all<HTMLImageElement>('img')) {
    if (!shown(img) || !img.naturalWidth || !img.naturalHeight || excludedRoot(img)) continue;
    const src = img.currentSrc || img.src;
    if (/\.svg(\?|$)|^data:image\/svg/i.test(src)) continue;
    const b = Z.boxOf(img);
    if (!Z.inView(b) || b.w < 16 || b.h < 16) continue;
    const s = getComputedStyle(img);
    const w = b.w - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0) - (parseFloat(s.borderLeftWidth) || 0) - (parseFloat(s.borderRightWidth) || 0);
    const h = b.h - (parseFloat(s.paddingTop) || 0) - (parseFloat(s.paddingBottom) || 0) - (parseFloat(s.borderTopWidth) || 0) - (parseFloat(s.borderBottomWidth) || 0);
    if (w <= 0 || h <= 0) continue;
    images.push({
      ...Z.ref(img),
      natural: Math.round((img.naturalWidth / img.naturalHeight) * 1000) / 1000,
      rendered: Math.round((w / h) * 1000) / 1000,
      src: src.slice(0, 200),
      objectFit: s.objectFit,
    });
  }

  /* ---- interactive elements, for the state probe ------------------------------------ */
  // One element per markup signature is enough: elements sharing tag and classes
  // share their state rules. Each stands for `count` elements on the screen.
  const interactive: UiFacts['interactive'] = [];
  const bySig = new Map<string, UiFacts['interactive'][number]>();
  for (const el of all('a[href], button, [role="button"], input[type="submit"], input[type="button"], summary')) {
    if (!shown(el) || excludedRoot(el) || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') continue;
    const b = Z.boxOf(el);
    if (!Z.inView(b) || b.w < 8 || b.h < 8) continue;
    const sig = sigOf(el) + '@' + (el.parentElement ? sigOf(el.parentElement) : '');
    const held = bySig.get(sig);
    if (held) {
      held.count += 1;
      continue;
    }
    if (interactive.length >= 24) continue;
    const item = { id: Z.idOf(el), selector: Z.selectorOf(el), box: b, signature: sig, name: clean(Z.nameOf(el)).slice(0, 40), count: 1 };
    bySig.set(sig, item);
    interactive.push(item);
  }

  /* ---- truncated text --------------------------------------------------------------- */
  const truncated: TruncFact[] = [];
  for (const el of scope) {
    if (truncated.length >= 20) break;
    const s = getComputedStyle(el);
    const ellipsis = s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1;
    const clamp = (s as any).webkitLineClamp && (s as any).webkitLineClamp !== 'none' && el.scrollHeight > el.clientHeight + 1;
    if (!ellipsis && !clamp) continue;
    const full = clean(el.textContent || '');
    if (full.length < 12 || el.closest('button, label, th, nav, [role="button"]')) continue;
    let recover = false;
    for (let n: Element | null = el, d = 0; n && d < 3; n = n.parentElement, d += 1) {
      const t = n.getAttribute('title') || n.getAttribute('data-tooltip') || n.getAttribute('data-tip') || n.getAttribute('aria-label') || '';
      if (t && clean(t).length >= full.length * 0.8) recover = true;
    }
    if (el.getAttribute('aria-describedby')) recover = true;
    const keep = ellipsis ? Math.max(1, Math.floor((full.length * el.clientWidth) / el.scrollWidth) - 1) : Math.max(1, Math.floor((full.length * el.clientHeight) / el.scrollHeight) - 1);
    truncated.push({ ...Z.ref(el), full: full.slice(0, 200), shown: full.slice(0, keep) + '…', recover, inLink: !!el.closest('a[href]') });
  }

  /* ---- candidates for the text stress test -------------------------------------------- */
  const stress: UiFacts['stress'] = [];
  const seenSig = new Set<string>();
  for (const el of scope) {
    if (stress.length >= 24) break;
    if (!el.matches('h1, h2, h3, h4, h5, h6, a, button, label, li, span, p, [role="button"], strong, dt, dd')) continue;
    if (el.children.length > 0) continue;
    const text = clean(el.textContent || '');
    if (text.length < 3 || text.length > 80) continue;
    const sig = sigOf(el) + '@' + sigOf(el.parentElement ?? el);
    if (seenSig.has(sig)) continue;
    seenSig.add(sig);
    stress.push({ id: Z.idOf(el), selector: Z.selectorOf(el), box: Z.boxOf(el), text, signature: sig });
  }

  /* ---- dark theme declarations ---------------------------------------------------------- */
  let mediaRules = 0;
  const toggles = new Map<string, DarkDeclaration['toggles'][number]>();
  const walkRules = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSMediaRule && /prefers-color-scheme\s*:\s*dark/i.test(r.conditionText)) mediaRules += 1;
      if (r instanceof CSSStyleRule) {
        // Only a theme keyed on the document itself: `[data-theme="dark"] …`,
        // `html.dark …`. A widget's own theme attribute (a toast library's,
        // say) is not the page's.
        for (const part of r.selectorText.split(',').map((p) => p.trim())) {
          const m = part.match(/^(?:html|:root|body)?\[(data-(?:theme|mode|color-scheme|color-mode|bs-theme|scheme))=["']?dark["']?\]/i);
          if (m) toggles.set(m[1], { kind: 'attribute', name: m[1], value: 'dark' });
          const c = part.match(/^(?:html|:root|body)?\.(dark|theme-dark|dark-mode|dark-theme)(?![\w-])/);
          if (c) toggles.set('.' + c[1], { kind: 'class', name: c[1], value: '' });
        }
      }
      if ((r as any).cssRules) walkRules((r as any).cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walkRules(sheet.cssRules);
    } catch {
      /* cross-origin */
    }
  }
  const dark: DarkDeclaration = {
    meta: document.querySelector('meta[name="color-scheme" i]')?.getAttribute('content') ?? null,
    rootScheme: getComputedStyle(document.documentElement).colorScheme,
    mediaRules,
    toggles: [...toggles.values()].slice(0, 3),
  };

  /* ---- visual weight: the primary message and what outweighs it --------------------------- */
  const sat = (c: number[]) => {
    const [r, g, b] = c.slice(0, 3).map((v) => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  };
  const weigh = (el: Element): WeightFact => {
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize) || 0;
    const fg = Z.rgba(s.color) as number[];
    const face = Z.rgba(s.backgroundColor) as number[];
    const bg = (face[3] >= 0.9 ? face : Z.effectiveBg(el)) ?? [255, 255, 255, 1];
    const contrast = Z.contrast(fg, bg);
    const saturation = Math.max(sat(fg), face[3] >= 0.9 ? sat(face) : 0);
    const roles: string[] = [];
    // A sticky header's own links are navigation, not clutter; a fixed layer's
    // text (an announcement, a cookie notice) is the case the rule names.
    if (Z.fixedOrSticky(el) && !el.closest('a[href], button, [role="button"], nav')) roles.push('sits in a fixed or sticky layer');
    if (face[3] >= 0.9 && Z.boxOf(el).h <= 40 && parseFloat(s.borderTopLeftRadius) >= 8) roles.push('styled as a badge or pill');
    if (el.closest('[aria-hidden="true"]')) roles.push('marked decorative (aria-hidden)');
    if (/cookie|consent|gdpr/i.test(Z.text(el.closest('[class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i]') ?? el))) roles.push('part of a cookie or consent message');
    if (el.closest('[class*="announcement" i], [class*="promo" i], [class*="banner" i]')) roles.push('inside an announcement or promo banner');
    const weight = Math.round(fs * ((Number(s.fontWeight) || 400) / 400) * (contrast / 21) * (1 + saturation) * 100) / 100;
    return {
      ...Z.ref(el),
      weight,
      fontSize: fs,
      contrast,
      saturation: Math.round(saturation * 100) / 100,
      roles,
      region: Z.selectorOf(el.closest('section, header, main, article, aside, footer') ?? document.body),
    };
  };
  const h1 = all('h1').find((h) => shown(h) && Z.inView(Z.boxOf(h)));
  // Some pages paint the headline in a separate, aria-hidden element and keep
  // the h1 for assistive tech. That painted twin is the primary message.
  const headline = h1 ? clean(Z.text(h1)).toLowerCase() : '';
  const twin = (el: Element) => {
    const t = clean(Z.text(el)).toLowerCase();
    return !!headline && t.length >= 8 && (headline.includes(t) || t.includes(headline));
  };
  let primary = h1 ? weigh(h1) : null;
  if (h1) {
    for (const el of scope) {
      if (el === h1 || !ownText(el) || !twin(el)) continue;
      const w = weigh(el);
      if (w.weight > primary!.weight) primary = w;
    }
  }
  const heavy: WeightFact[] = [];
  if (primary) {
    for (const el of scope) {
      if (heavy.length >= 10) break;
      if (el === h1 || h1!.contains(el) || el.contains(h1!) || !ownText(el) || /^H[12]$/.test(el.tagName) || twin(el)) continue;
      const w = weigh(el);
      if (w.weight > primary.weight && (w.region === primary.region || w.roles.some((r) => r.startsWith('sits in a fixed')))) heavy.push(w);
    }
  }

  /* ---- somewhere to release the mouse ---------------------------------------------------- */
  let safePoint: UiFacts['safePoint'] = null;
  for (const [x, y] of [[vw - 6, vh - 6], [6, vh - 6], [vw / 2, vh - 6], [vw - 6, vh / 2], [6, vh / 2]]) {
    const hit = document.elementFromPoint(x, y);
    if (hit && !hit.closest('a, button, input, select, textarea, label, summary, [role="button"], [onclick], [tabindex]')) {
      safePoint = { x: Math.round(x), y: Math.round(y) };
      break;
    }
  }

  return {
    inventory,
    buttons,
    align,
    containers,
    dense,
    leading,
    imageText,
    icons,
    images,
    interactive,
    truncated,
    stress,
    dark,
    primary,
    heavy,
    safePoint,
  };
}

/* ======================================================== interaction */

/** How an element looks right now, including its pseudo-elements and first descendants. */
export function stateLook(id: string): string | null {
  const Z = (window as any).__zx;
  const el = Z.byId.get(id) as Element | undefined;
  if (!el || !el.isConnected) return null;
  const parts: string[] = [];
  const read = (n: Element, pseudo: string | null) => {
    const s = getComputedStyle(n, pseudo);
    if (pseudo && (s.content === 'none' || s.content === 'normal')) return;
    parts.push(
      [s.color, s.backgroundColor, s.backgroundImage.slice(0, 80), s.borderTopColor, s.borderBottomColor, s.boxShadow, s.textDecorationLine, s.textDecorationColor, s.opacity, s.transform, s.filter, s.outlineStyle, pseudo ? s.width : ''].join('|'),
    );
  };
  read(el, null);
  read(el, '::before');
  read(el, '::after');
  for (const c of Array.from(el.querySelectorAll('*')).slice(0, 3)) read(c, null);
  if (el.parentElement) read(el.parentElement, null);
  return parts.join('/');
}

/** Whether the element (or something inside it) is what the pointer hits at its centre. */
export function hitAt(args: { id: string; x: number; y: number }): boolean {
  const Z = (window as any).__zx;
  const el = Z.byId.get(args.id) as Element | undefined;
  const hit = document.elementFromPoint(args.x, args.y);
  return !!el && !!hit && (el === hit || el.contains(hit));
}

export function freezeMotion(on: boolean): void {
  const id = '__zx-freeze';
  document.getElementById(id)?.remove();
  if (!on) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
  document.head.appendChild(s);
}

export type DarkOffender = { selector: string; box: Box; kind: 'light surface' | 'dark text'; value: string; against: string; ratio: number | null };

/** With the dark theme on: surfaces still light, and text still dark on a dark ground. */
export function darkScan(): { pageBg: string; dark: boolean; offenders: DarkOffender[] } {
  const Z = (window as any).__zx;
  const lum = (c: number[]) => {
    const ch = (v: number) => {
      const x = v / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  };
  const pageBg = (Z.effectiveBg(document.body) ?? [255, 255, 255, 1]) as number[];
  const isDark = lum(pageBg) < 0.2;
  const offenders: DarkOffender[] = [];
  if (!isDark) return { pageBg: Z.hex(pageBg), dark: false, offenders };
  const vwArea = window.innerWidth * window.innerHeight;
  for (const el of Array.from(document.querySelectorAll('body *')).slice(0, 5000)) {
    if (offenders.length >= 12) break;
    if (!Z.visible(el) || el.closest('svg, canvas, iframe, img, video, picture, [data-audit-ignore]')) continue;
    const b = Z.boxOf(el);
    if (!Z.inView(b)) continue;
    const s = getComputedStyle(el);
    const face = Z.rgba(s.backgroundColor) as number[];
    if (face[3] >= 0.9 && lum(face) >= 0.8 && b.w * b.h >= 0.01 * vwArea) {
      if (!offenders.some((o) => Z.byId.get(Z.idOf(el)) && document.querySelector(o.selector)?.contains(el))) {
        offenders.push({ selector: Z.selectorOf(el), box: b, kind: 'light surface', value: Z.hex(face), against: Z.hex(pageBg), ratio: null });
      }
      continue;
    }
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent || '').trim());
    if (!own) continue;
    const fg = Z.rgba(s.color) as number[];
    const under = Z.effectiveBg(el) as number[] | null;
    if (!under || lum(under) >= 0.2) continue;
    const ratio = Z.contrast(fg, under);
    if (ratio < 3 && lum(fg) < 0.1) {
      offenders.push({ selector: Z.selectorOf(el), box: b, kind: 'dark text', value: Z.hex(fg), against: Z.hex(under), ratio });
    }
  }
  return { pageBg: Z.hex(pageBg), dark: true, offenders };
}

export type StressResult = { overflow: 'clipped' | 'overflow' | 'overlap'; detail: string; box: Box } | null;

/**
 * Replaces an element's text with a longer or shorter version and reports
 * whether it now spills out of its box, is clipped by a container, or runs into
 * a neighbour. The original text is restored by `restoreText`.
 */
export function stressText(args: { id: string; factor: number }): StressResult {
  const Z = (window as any).__zx;
  const el = Z.byId.get(args.id) as HTMLElement | undefined;
  if (!el || !el.isConnected) return null;
  const w = window as any;
  w.__zxStress ??= new Map<string, string>();
  const original = w.__zxStress.get(args.id) ?? el.textContent ?? '';
  w.__zxStress.set(args.id, original);
  const parent = el.parentElement;
  const siblings = parent ? Array.from(parent.children).filter((c) => c !== el && Z.visible(c)) : [];
  const overlaps = (a: DOMRect, b: DOMRect) =>
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > 4;
  const before = el.getBoundingClientRect();
  const touching = new Set(siblings.filter((s) => overlaps(before, s.getBoundingClientRect())));
  // How far the glyphs already reach past the box at rest — tight leading puts
  // ascenders outside it by design. Only a change from this counts.
  const reach = (box: DOMRect) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    let m = 0;
    for (const t of Array.from(range.getClientRects())) m = Math.max(m, t.right - box.right, t.bottom - box.bottom, box.left - t.left);
    return m;
  };
  const reachBefore = reach(before);
  const clipBefore = Math.max(el.scrollWidth - el.clientWidth, el.scrollHeight - el.clientHeight);

  const text = original.trim();
  el.textContent = args.factor > 1 ? `${text} ${text}` : text.slice(0, Math.max(1, Math.ceil(text.length * args.factor)));

  const r = el.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(el);
  const ink = Array.from(range.getClientRects());
  const spill = reach(r) > reachBefore + 2;
  const s = getComputedStyle(el);
  const clippedSelf =
    s.overflow !== 'visible' && s.textOverflow !== 'ellipsis' && Math.max(el.scrollWidth - el.clientWidth, el.scrollHeight - el.clientHeight) > clipBefore + 1;
  let clippedBy: Element | null = null;
  for (let n = parent, d = 0; n && d < 3 && !clippedBy; n = n.parentElement, d += 1) {
    const ns = getComputedStyle(n);
    if (ns.overflow === 'visible' && ns.overflowX === 'visible' && ns.overflowY === 'visible') continue;
    const nr = n.getBoundingClientRect();
    if (ink.some((t) => t.right > nr.right + 1 || t.bottom > nr.bottom + 1)) clippedBy = n;
  }
  const hit = siblings.find((sib) => !touching.has(sib) && overlaps(r, sib.getBoundingClientRect()));
  const box = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  if (clippedSelf || clippedBy) {
    return { overflow: 'clipped', detail: clippedSelf ? 'the element hides the text that no longer fits' : `${Z.selectorOf(clippedBy!)} cuts the text off`, box };
  }
  if (hit) return { overflow: 'overlap', detail: `the text now runs into ${Z.selectorOf(hit)}`, box };
  if (spill) return { overflow: 'overflow', detail: 'the text spills outside its box', box };
  return null;
}

export function restoreText(id: string): void {
  const Z = (window as any).__zx;
  const w = window as any;
  const el = Z.byId.get(id) as HTMLElement | undefined;
  const original = w.__zxStress?.get(id);
  if (el && original != null) el.textContent = original;
}
