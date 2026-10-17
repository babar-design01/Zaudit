/**
 * L1 measurement for the Usability family, inside the page.
 *
 * Same rules as `probe.ts`: every function is serialised into the browser, so
 * nothing here may close over module scope, and the shared helpers are reached
 * through `window.__zx`. Nothing here decides whether a rule fires.
 *
 * Only `snapForm`, `formValidity`, `modalVisible` and `TOAST_WATCH` are used
 * while the page is being interacted with; `collectUxFacts` reads the page at
 * rest, before the keyboard walk or any probe has touched it.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Box, ElRef } from './probe';

export type CtaFact = ElRef & {
  label: string;
  href: string | null;
  /** A solid or gradient face that stands off what it sits on. */
  filled: boolean;
  fill: string | null;
  /** Contrast of the face against what it sits on. */
  fillContrast: number | null;
  area: number;
  region: string;
  regionSelector: string;
  sticky: boolean;
  /** One of several sibling cards that each carry a price — a tier in a pricing table. */
  tierCard: boolean;
  conversion: boolean;
};

export type UxField = {
  id: string;
  selector: string;
  box: Box;
  inView: boolean;
  type: string;
  nameAttr: string | null;
  /** Text a sighted user can read as the label while typing, or null. */
  visibleLabel: string | null;
  labelSource: string | null;
  ariaLabel: boolean;
  placeholder: string;
  required: boolean;
  requiredMarker: boolean;
  optionalMarker: boolean;
  /** Help text shown next to the field before anything is submitted. */
  hint: string;
  constraint: string | null;
  honeypot: boolean;
  formId: string | null;
  /** Visible fields sharing this field's form. */
  siblings: number;
  inSearch: boolean;
  searchIcon: boolean;
};

export type FormFact = ElRef & {
  fields: UxField[];
  submitText: string;
  search: boolean;
  hasPassword: boolean;
  hasPayment: boolean;
  hasTextarea: boolean;
  heading: string;
  novalidate: boolean;
  /** A note such as "All fields are required". */
  allRequiredNote: boolean;
  context: string;
};

export type StepFact = ElRef & { n: number | null; total: number | null; kind: 'counter' | 'aria-current' | 'progressbar' };

export type EmptyFact = ElRef & {
  message: string;
  container: ElRef;
  hasAction: boolean;
  explanation: string;
  loading: boolean;
};

export type NavItem = ElRef & { href: string; matches: boolean; ariaCurrent: string | null; look: string; activeClass: boolean };
export type NavFact = { nav: ElRef; items: NavItem[]; singlePage: boolean };

export type ListFact = ElRef & { count: number; sample: string[]; sorted: boolean };

export type ParagraphFact = ElRef & { lines: number; ch: number; width: number; chars: number; fontSize: number };

export type RunFact = { first: ElRef; count: number; box: Box; selectors: string[] };

export type HoverReveal = {
  trigger: ElRef;
  target: string;
  rule: string;
  media: string | null;
  touchEquivalent: boolean;
  /** The trigger carries a toggle hint — a button, aria-expanded or aria-haspopup. */
  toggleHint: boolean;
  inNav: boolean;
  duplicated: boolean;
  revealedText: string;
};

export type ModalFact = ElRef & {
  name: string;
  kind: string;
  closeControls: string[];
  declinePath: string[];
  blocking: boolean;
  backdrop: { x: number; y: number } | null;
};

export type GenericButton = ElRef & {
  label: string;
  container: 'dialog' | 'form' | 'section';
  heading: string;
  context: string;
  commercial: boolean;
  destructive: boolean;
};

export type UxFacts = {
  url: string;
  ctas: CtaFact[];
  /** Filled CTAs anywhere on the page, grouped by region, for the "is it a system" check. */
  ctaRegions: { region: string; filled: number; equalPairs: number }[];
  conversionInView: { selector: string; label: string; why: string; box: Box }[];
  interactiveInView: { selector: string; label: string }[];
  fields: UxField[];
  forms: FormFact[];
  steps: StepFact[];
  backControls: ElRef[];
  closeControls: ElRef[];
  navLinksInView: number;
  empties: EmptyFact[];
  clearFilter: boolean;
  navs: NavFact[];
  lists: ListFact[];
  searchControls: string[];
  pagination: boolean;
  paragraphs: ParagraphFact[];
  runs: RunFact[];
  legal: boolean;
  hover: { reveals: HoverReveal[]; readable: number; unreadable: number };
  modal: ModalFact | null;
  generic: GenericButton[];
  destructive: (ElRef & { label: string })[];
  authLinks: { selector: string; label: string; href: string }[];
  demoPaths: string[];
  valueForms: string[];
  accountBound: boolean;
};

/**
 * Watches for messages that appear and then remove themselves — toasts,
 * snackbars, alerts — from the moment the document starts, and records how long
 * each stayed readable. Installed as an init script, so it is plain JavaScript.
 */
export const TOAST_WATCH = `(() => {
  if (window.__zxToasts) return;
  const recs = [];
  window.__zxToasts = recs;
  const SEL = '[role="alert"],[role="status"],[role="alertdialog"],[class*="toast" i],[class*="snackbar" i],[class*="notification" i],[class*="flash-message" i],[class*="flash_message" i]';
  const sel = (el) => {
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && n !== document.documentElement && parts.length < 7) {
      let p = n.tagName.toLowerCase();
      const par = n.parentElement;
      if (par) {
        const same = Array.from(par.children).filter((c) => c.tagName === n.tagName);
        if (same.length > 1) p += ':nth-of-type(' + (same.indexOf(n) + 1) + ')';
      }
      parts.unshift(p);
      n = par;
    }
    return parts.join(' > ');
  };
  const fixed = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  };
  const shown = (el) => {
    if (!el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    for (let n = el, d = 0; n && d < 8; n = n.parentElement, d += 1) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.1) return false;
    }
    return true;
  };
  const live = new Map();
  const t0 = performance.now();
  const tick = () => {
    if (!document.body) return;
    const now = performance.now();
    for (const el of document.querySelectorAll(SEL)) {
      if (live.has(el)) continue;
      const text = (el.innerText || '').replace(/\\s+/g, ' ').trim();
      if (!text || text.length > 400 || !shown(el)) continue;
      if (/cookie|consent|gdpr/i.test(text)) continue;
      if (el.querySelectorAll('img, video, a[href]').length > 2) continue;
      const r = el.getBoundingClientRect();
      const isFixed = fixed(el);
      const rec = {
        selector: sel(el),
        text: text.slice(0, 240),
        words: text.split(/\\s+/).filter(Boolean).length,
        box: { x: Math.round(r.left + (isFixed ? 0 : scrollX)), y: Math.round(r.top + (isFixed ? 0 : scrollY)), w: Math.round(r.width), h: Math.round(r.height) },
        shownAt: Math.round(now - t0),
        hiddenAt: null,
        closeButton: !!el.querySelector('button, [role="button"]'),
      };
      recs.push(rec);
      live.set(el, rec);
    }
    for (const [el, rec] of live) {
      if (rec.hiddenAt != null) continue;
      if (!shown(el) || !(el.innerText || '').trim()) rec.hiddenAt = Math.round(now - t0);
    }
    if (now - t0 < 60000) setTimeout(tick, 100);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();
})();`;

export type ToastRecord = {
  selector: string;
  text: string;
  words: number;
  box: Box;
  shownAt: number;
  hiddenAt: number | null;
  closeButton: boolean;
};

export function readToasts(): { records: ToastRecord[]; persistentText: string } {
  const w = window as any;
  const recs: ToastRecord[] = w.__zxToasts ?? [];
  return { records: recs.map((r) => ({ ...r })), persistentText: (document.body?.innerText || '').replace(/\s+/g, ' ').slice(0, 20000) };
}

/* ============================================================ at rest */

export function collectUxFacts(): UxFacts {
  const Z = (window as any).__zx;
  window.scrollTo(0, 0);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const all = <T extends Element = Element>(sel: string, root: ParentNode = document) =>
    Array.from(root.querySelectorAll<T>(sel));
  const shown = (el: Element) => Z.visible(el) && !Z.srOnly(el);
  const clean = (s: string) => (s || '').replace(/\s+/g, ' ').trim();

  const CONVERSION =
    /\b(sign ?up|get started|start|try|buy|add to (cart|bag|basket)|book|request|contact|subscribe|download|join|demo|order|shop|get|free|register|install|apply|quote|reserve|checkout|upgrade|talk to|schedule|create|run|audit|scan|analy[sz]e)\b/i;

  /* ---- calls to action -------------------------------------------------- */
  const regionOf = (el: Element): Element => {
    const r = el.closest('section, header, footer, article, aside, form, [role="region"], [role="banner"], [role="dialog"]');
    if (r) return r;
    let n: Element = el;
    while (n.parentElement && n.parentElement !== document.body && n.parentElement.tagName !== 'MAIN') n = n.parentElement;
    return n;
  };
  const priceRe = /[$€£¥₹]\s?\d|\d\s?(usd|eur|gbp)\b|\/\s?(mo|month|yr|year)\b|per (month|year|seat|user)/i;
  const tierCardOf = (el: Element): boolean => {
    for (let n = el.parentElement, d = 0; n && d < 6; n = n.parentElement, d += 1) {
      const p = n.parentElement;
      if (!p) break;
      const sibs = Array.from(p.children).filter((c) => c.tagName === n!.tagName && c !== n);
      if (sibs.length >= 1 && priceRe.test(Z.text(n)) && sibs.some((s) => priceRe.test(Z.text(s)))) return true;
    }
    return false;
  };

  const ctaEls = all('a[href], button, input[type="submit"], input[type="button"], [role="button"]').filter(shown);
  const ctas: CtaFact[] = [];
  const allFilled: { region: Element; fill: string; area: number; contrast: number }[] = [];
  for (const el of ctaEls) {
    const label = clean(el.tagName === 'INPUT' ? (el as HTMLInputElement).value : Z.nameOf(el));
    if (label.length < 2 || label.length > 50) continue;
    const b = Z.boxOf(el);
    if (b.w < 60 || b.h < 28 || b.h > 120) continue;
    const s = getComputedStyle(el);
    const outer = Z.effectiveBg(el.parentElement) as number[] | null;
    const face = Z.rgba(s.backgroundColor) as number[];
    const gradient = /gradient/.test(s.backgroundImage);
    let filled = false;
    let fill: string | null = null;
    let fillContrast: number | null = null;
    if (face[3] >= 0.9 && outer) {
      const fc: number = Z.contrast(face, outer);
      fillContrast = fc;
      const dist = Math.abs(face[0] - outer[0]) + Math.abs(face[1] - outer[1]) + Math.abs(face[2] - outer[2]);
      filled = fc >= 1.3 || dist > 60;
      fill = Z.hex(face);
    } else if (gradient) {
      filled = true;
      fill = 'gradient';
    }
    const region = regionOf(el);
    if (filled) {
      allFilled.push({ region, fill: fill!, area: b.w * b.h, contrast: fillContrast ?? 0 });
    }
    if (!Z.inView(b)) continue;
    ctas.push({
      ...Z.ref(el),
      label,
      href: el.getAttribute('href'),
      filled,
      fill,
      fillContrast,
      area: b.w * b.h,
      region: Z.idOf(region),
      regionSelector: Z.selectorOf(region),
      sticky: Z.fixedOrSticky(el) || !!el.closest('header, [role="banner"]'),
      tierCard: tierCardOf(el),
      conversion: CONVERSION.test(label),
    });
  }
  const within = (a: number, b: number) => Math.abs(a - b) <= 0.1 * Math.max(a, b, 0.0001);
  const regionMap = new Map<Element, typeof allFilled>();
  for (const f of allFilled) {
    const g = regionMap.get(f.region) ?? [];
    g.push(f);
    regionMap.set(f.region, g);
  }
  const ctaRegions = [...regionMap.entries()].map(([r, g]) => {
    let equalPairs = 0;
    for (let i = 0; i < g.length; i += 1)
      for (let j = i + 1; j < g.length; j += 1)
        if (g[i].fill === g[j].fill && within(g[i].area, g[j].area) && within(g[i].contrast, g[j].contrast)) equalPairs += 1;
    return { region: Z.idOf(r), filled: g.length, equalPairs };
  });

  /* ---- what can be acted on in the first screen ------------------------- */
  const interactiveInView = all('a[href], button, input[type="submit"], input[type="button"], [role="button"], select, input:not([type="hidden"]), textarea')
    .filter((el) => shown(el) && Z.inView(Z.boxOf(el)))
    .slice(0, 80)
    .map((el) => ({ selector: Z.selectorOf(el), label: clean(Z.nameOf(el) || (el as HTMLInputElement).placeholder || el.tagName.toLowerCase()).slice(0, 60) }));

  /* ---- fields and forms -------------------------------------------------- */
  const textOf = (el: Element | null) => (el ? clean(Z.text(el)) : '');
  const nearLabel = (el: Element): { text: string; source: string } | null => {
    const input = el as HTMLInputElement;
    for (const l of Array.from(input.labels ?? [])) {
      if (!shown(l)) continue;
      const clone = l.cloneNode(true) as Element;
      clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      const t = clean(clone.textContent || '');
      if (t) return { text: t, source: 'label' };
    }
    const by = (el.getAttribute('aria-labelledby') || '').split(/\s+/).map((i) => document.getElementById(i)).filter(Boolean) as Element[];
    const byText = by.filter(shown).map(textOf).join(' ').trim();
    if (byText) return { text: byText, source: 'aria-labelledby' };
    // Text set directly before the field — in its own wrapper, or before a wrapper
    // that holds only this field — and close to it, above or to the left.
    const fb = Z.boxOf(el);
    let node: Element | null = el;
    for (let d = 0; node && d < 2; d += 1, node = node.parentElement) {
      if (d > 0 && node.querySelectorAll('input, select, textarea').length > 1) break;
      let prev = node.previousElementSibling;
      while (prev && !shown(prev)) prev = prev.previousElementSibling;
      if (!prev || prev.matches('input, select, textarea, button, a, [role="button"]') || prev.querySelector('input, select, textarea, button, a')) continue;
      const pb = Z.boxOf(prev);
      const above = pb.y + pb.h <= fb.y + 4 && fb.y - (pb.y + pb.h) <= 40;
      const left = pb.x + pb.w <= fb.x + 4 && Math.abs(pb.y + pb.h / 2 - (fb.y + fb.h / 2)) <= fb.h;
      const t = textOf(prev);
      if (t && t.length <= 80 && (above || left)) return { text: t, source: 'adjacent text' };
    }
    return null;
  };

  const fieldEls = all(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="checkbox"]):not([type="radio"]), select, textarea',
  );
  const formOf = (el: Element): Element | null =>
    (el as HTMLInputElement).form || el.closest('form, [role="form"], [role="search"]');
  const visibleFieldCount = new Map<Element | null, number>();
  const honeypotOf = (el: Element) => {
    const s = getComputedStyle(el);
    return !!el.closest('[aria-hidden="true"]') || el.getAttribute('tabindex') === '-1' || Z.srOnly(el) || Number(s.opacity) < 0.05 || !Z.visible(el);
  };
  for (const el of fieldEls) {
    if (honeypotOf(el)) continue;
    const f = formOf(el);
    visibleFieldCount.set(f, (visibleFieldCount.get(f) ?? 0) + 1);
  }
  const fields: UxField[] = fieldEls.map((el) => {
    const input = el as HTMLInputElement;
    const type = el.tagName === 'INPUT' ? input.type || 'text' : el.tagName.toLowerCase();
    const lab = nearLabel(el);
    const labelText = lab?.text ?? '';
    const describedBy = (el.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .map((i) => document.getElementById(i))
      .filter((n): n is HTMLElement => !!n && shown(n))
      .map(textOf)
      .join(' ');
    let hint = describedBy;
    if (!hint) {
      const next = (el.nextElementSibling && shown(el.nextElementSibling) ? el.nextElementSibling : null) ||
        (el.parentElement?.nextElementSibling && shown(el.parentElement.nextElementSibling) ? el.parentElement.nextElementSibling : null);
      const t = next && !next.querySelector('input, select, textarea, button') ? textOf(next) : '';
      if (t && t.length <= 160) hint = t;
    }
    const constraint =
      ['email', 'url', 'tel', 'number', 'date'].includes(type)
        ? type
        : input.pattern
          ? 'pattern'
          : input.minLength > 0
            ? 'minlength'
            : input.required || el.getAttribute('aria-required') === 'true'
              ? 'required'
              : null;
    const form = formOf(el);
    const inSearch = type === 'search' || !!el.closest('[role="search"]') || /search/i.test([el.getAttribute('name'), el.getAttribute('aria-label'), input.placeholder, el.id].join(' '));
    const wrap = el.parentElement?.parentElement ?? el.parentElement;
    return {
      id: Z.idOf(el),
      selector: Z.selectorOf(el),
      box: Z.boxOf(el),
      inView: Z.inView(Z.boxOf(el)),
      type,
      nameAttr: el.getAttribute('name'),
      visibleLabel: labelText || null,
      labelSource: lab?.source ?? null,
      ariaLabel: !!clean(el.getAttribute('aria-label') || ''),
      placeholder: input.placeholder || '',
      required: input.required === true || el.getAttribute('aria-required') === 'true',
      requiredMarker: /\*|\brequired\b/i.test(labelText),
      optionalMarker: /\boptional\b/i.test(labelText),
      hint: hint.slice(0, 160),
      constraint,
      honeypot: honeypotOf(el),
      formId: form ? Z.idOf(form) : null,
      siblings: visibleFieldCount.get(form) ?? 1,
      inSearch,
      searchIcon: !!wrap?.querySelector('svg, img, [class*="icon" i], button'),
    };
  });

  const PAYMENT = /card|cc-|cvc|cvv|expir|iban|billing/i;
  const forms: FormFact[] = all('form, [role="form"]')
    .filter((f) => shown(f))
    .map((f) => {
      const own = fields.filter((x) => x.formId === Z.idOf(f) && !x.honeypot);
      const submit = all('button:not([type="button"]):not([type="reset"]), input[type="submit"]', f).find(shown) ??
        all('button, [role="button"]', f).find(shown);
      let heading = '';
      const legend = f.querySelector('legend, h1, h2, h3, h4');
      if (legend) heading = textOf(legend);
      if (!heading) {
        const hs = all('h1, h2, h3, h4').filter((h) => shown(h) && h.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING);
        heading = hs.length ? textOf(hs[hs.length - 1]) : '';
      }
      const ctxText = clean(Z.text(f.closest('section, article, main, [role="dialog"]') ?? f)).slice(0, 500);
      return {
        ...Z.ref(f),
        fields: own,
        submitText: submit ? clean(submit.tagName === 'INPUT' ? (submit as HTMLInputElement).value : Z.nameOf(submit)) : '',
        search: f.matches('[role="search"]') || (own.length === 1 && own[0].inSearch),
        hasPassword: own.some((x) => x.type === 'password'),
        hasPayment: own.some((x) => PAYMENT.test([x.nameAttr, x.visibleLabel, x.placeholder].join(' '))),
        hasTextarea: own.some((x) => x.type === 'textarea'),
        heading: heading.slice(0, 120),
        novalidate: f.hasAttribute('novalidate'),
        allRequiredNote: /all fields (are )?required|every field is required/i.test(Z.text(f)),
        context: ctxText,
      };
    })
    .filter((f) => f.fields.length > 0);

  /* ---- multi-step flows ---------------------------------------------------- */
  const steps: StepFact[] = [];
  for (const el of all('p, span, div, li, h1, h2, h3, h4, h5, h6, small, strong, label, legend')) {
    if (el.children.length > 3) continue;
    const t = textOf(el);
    if (t.length > 60) continue;
    const m = t.match(/\bstep\s+(\d+)\s*(?:of|\/)\s*(\d+)\b/i) || t.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!m || !shown(el) || !Z.inView(Z.boxOf(el))) continue;
    if (steps.some((s) => Z.byId.get(s.id)?.contains(el))) continue;
    steps.push({ ...Z.ref(el), n: Number(m[1]), total: Number(m[2]), kind: 'counter' });
  }
  for (const el of all('[aria-current="step"]')) {
    if (!shown(el) || !Z.inView(Z.boxOf(el))) continue;
    const li = el.closest('li') ?? el;
    const sibs = li.parentElement ? Array.from(li.parentElement.children) : [li];
    steps.push({ ...Z.ref(el), n: sibs.indexOf(li) + 1, total: sibs.length, kind: 'aria-current' });
  }
  for (const el of all('[role="progressbar"], progress')) {
    if (!shown(el) || !Z.inView(Z.boxOf(el))) continue;
    steps.push({ ...Z.ref(el), n: null, total: null, kind: 'progressbar' });
  }
  const controlsInView = all('a[href], button, [role="button"], input[type="button"], input[type="submit"]').filter(
    (el) => shown(el) && Z.inView(Z.boxOf(el)),
  );
  const nameOrValue = (el: Element) => clean(el.tagName === 'INPUT' ? (el as HTMLInputElement).value : Z.nameOf(el));
  const backControls = controlsInView.filter((el) => /^(back|go back|previous|prev|←|‹|<)(\b|$)|\bprevious step\b/i.test(nameOrValue(el))).map((el) => Z.ref(el));
  const closeControls = controlsInView
    .filter((el) => /^(×|✕|✖|x)$|\b(close|exit|cancel|save (and|&) exit|save for later|dismiss)\b/i.test(nameOrValue(el)))
    .map((el) => Z.ref(el));
  const navLinksInView = all('nav a[href], [role="navigation"] a[href], header a[href]').filter(
    (el) => shown(el) && Z.inView(Z.boxOf(el)),
  ).length;

  /* ---- empty states --------------------------------------------------------- */
  const EMPTY = /^(no (data|results?|items?|records?|entries|matches|activity|projects?|files?|messages?|notifications?|orders?)\b|no \w+( \w+)? (yet|found|to (show|display))|nothing (here|to (show|see|display))( yet)?|(it'?s|this is) empty|empty\b|you (don'?t|do not|haven'?t) (have|added|created) any|there (are|is) no \w+)/i;
  const empties: EmptyFact[] = [];
  for (const el of all('p, span, div, h2, h3, h4, h5, td, li, strong')) {
    if (el.children.length > 2) continue;
    const t = textOf(el);
    if (!t || t.length > 120 || !EMPTY.test(t)) continue;
    if (!shown(el) || !Z.inView(Z.boxOf(el))) continue;
    if (empties.some((e) => Z.byId.get(e.id)?.contains(el) || el.contains(Z.byId.get(e.id)))) continue;
    let container: Element = el.parentElement ?? el;
    for (let d = 0; d < 3 && container.parentElement && Z.boxOf(container).h < 120; d += 1) container = container.parentElement;
    const actions = all('a[href], button, [role="button"]', container).filter((a) => shown(a) && !a.contains(el));
    const rest = clean(Z.text(container).replace(t, ''));
    empties.push({
      ...Z.ref(el),
      message: t,
      container: Z.ref(container),
      hasAction: actions.length > 0,
      explanation: rest.slice(0, 160),
      loading: !!container.closest('[aria-busy="true"]') || /\bloading\b/i.test(Z.text(container)),
    });
    if (empties.length >= 8) break;
  }
  const clearFilter = all('a, button, [role="button"]').some((el) => shown(el) && /\b(clear|reset|remove) (all )?(filters?|search)\b/i.test(Z.nameOf(el)));

  /* ---- navigation and the current page ------------------------------------- */
  const here = (u: string) => {
    try {
      const x = new URL(u, location.href);
      return x.origin + (x.pathname.replace(/\/+$/, '') || '/');
    } catch {
      return '';
    }
  };
  const current = here(location.href);
  const lookOf = (el: Element) => {
    const parts: string[] = [];
    for (const [n, pseudo] of [[el, null], [el, '::after'], [el, '::before'], [el.parentElement, null]] as [Element | null, string | null][]) {
      if (!n) continue;
      const s = getComputedStyle(n, pseudo);
      if (pseudo && (s.content === 'none' || s.content === 'normal')) {
        parts.push('-');
        continue;
      }
      parts.push(
        [s.color, s.fontWeight, s.textDecorationLine, s.backgroundColor, s.borderBottomWidth + ' ' + s.borderBottomColor, s.opacity, pseudo ? s.width + ' ' + s.transform : ''].join('|'),
      );
    }
    return parts.join(' / ');
  };
  const navs: NavFact[] = all('nav, [role="navigation"]')
    .filter((n) => shown(n) && Z.inView(Z.boxOf(n)))
    .slice(0, 4)
    .map((n) => {
      const items = all<HTMLAnchorElement>('a[href]', n)
        .filter((a) => shown(a) && clean(Z.text(a)).length > 0 && Z.inView(Z.boxOf(a)))
        .map((a) => {
          const href = a.getAttribute('href') || '';
          return {
            ...Z.ref(a),
            href,
            matches: !href.startsWith('#') && here(href) === current,
            ariaCurrent: a.getAttribute('aria-current') ?? a.parentElement?.getAttribute('aria-current') ?? null,
            look: lookOf(a),
            activeClass: /\b(active|current|selected|is-active)\b/i.test((a.className || '') + ' ' + (a.parentElement?.className || '')),
          };
        });
      const singlePage = items.length > 0 && items.every((i) => i.href.startsWith('#') || here(i.href) === current);
      return { nav: Z.ref(n), items, singlePage };
    })
    .filter((n) => n.items.length >= 2);

  /* ---- long lists and the controls to search them -------------------------- */
  const lists: ListFact[] = [];
  for (const c of all('ul, ol, tbody, [role="list"], [role="grid"], [role="table"], div')) {
    const kids = Array.from(c.children);
    if (kids.length <= 25) continue;
    if (c.closest('nav, footer, header, select, [role="navigation"], [role="menu"], [role="listbox"]')) continue;
    const b = Z.boxOf(c);
    if (b.y >= vh || b.y + b.h <= 0 || !shown(c)) continue;
    const sig = (k: Element) => k.tagName + '.' + ((k.getAttribute('class') || '').split(/\s+/)[0] || '');
    const counts = new Map<string, number>();
    for (const k of kids) counts.set(sig(k), (counts.get(sig(k)) ?? 0) + 1);
    const top = Math.max(...counts.values());
    const items = kids.filter((k) => Z.visible(k));
    if (top < 0.8 * kids.length || items.length <= 25) continue;
    if (lists.some((l) => Z.byId.get(l.id)?.contains(c))) continue;
    const texts = items.map((k) => textOf(k).slice(0, 60)).filter(Boolean);
    let asc = 0;
    let desc = 0;
    for (let i = 1; i < texts.length; i += 1) {
      const cmp = texts[i - 1].localeCompare(texts[i], undefined, { numeric: true, sensitivity: 'base' });
      if (cmp <= 0) asc += 1;
      if (cmp >= 0) desc += 1;
    }
    const sorted = texts.length > 1 && Math.max(asc, desc) >= 0.9 * (texts.length - 1);
    lists.push({ ...Z.ref(c), count: items.length, sample: texts.slice(0, 5), sorted });
    if (lists.length >= 6) break;
  }
  const searchControls = all('input, select, [role="search"], [role="searchbox"], button, [role="combobox"]')
    .filter((el) => Z.visible(el))
    .filter((el) => {
      const sig = [el.getAttribute('type'), el.getAttribute('name'), el.getAttribute('placeholder'), el.getAttribute('aria-label'), el.getAttribute('role'), el.tagName === 'BUTTON' ? Z.text(el) : '', el.id].join(' ');
      return /search|filter|find|sort|categor/i.test(sig);
    })
    .slice(0, 10)
    .map((el) => Z.selectorOf(el));
  const pagination =
    !!document.querySelector('[aria-label*="pagination" i], [class*="pagination" i], a[rel="next"], nav [aria-current="page"]') ||
    all('a, button').some((el) => shown(el) && /^(next|next page|›|»|load more)$/i.test(clean(Z.nameOf(el))));

  /* ---- paragraphs: lines, characters per line, runs ------------------------ */
  const zeroWidth = (() => {
    const cv = document.createElement('canvas').getContext('2d')!;
    const cache = new Map<string, number>();
    return (s: CSSStyleDeclaration) => {
      const font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      let v = cache.get(font);
      if (v == null) {
        cv.font = font;
        v = cv.measureText('0').width || parseFloat(s.fontSize) * 0.5;
        cache.set(font, v);
      }
      return v;
    };
  })();
  const lineCount = (el: Element) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops = new Set<number>();
    for (const r of Array.from(range.getClientRects())) if (r.width > 1 && r.height > 1) tops.add(Math.round(r.bottom / 4));
    return tops.size;
  };
  const NOT_BODY = 'figcaption, caption, td, th, aside, [role="complementary"], nav, footer, label, button, dialog, [role="dialog"], blockquote, pre, code';
  const paragraphs: ParagraphFact[] = [];
  const candidates = all('p, dd, article div, main div, section div').slice(0, 2500);
  for (const el of candidates) {
    if (el.tagName !== 'P' && el.tagName !== 'DD') {
      // A div counts only when it holds running text directly, not blocks.
      const direct = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent || '').join('').trim();
      if (direct.length < 120 || el.querySelector('div, p, ul, ol, table, section')) continue;
    }
    if (el.closest(NOT_BODY)) continue;
    const t = textOf(el);
    if (t.length < 60 || !shown(el)) continue;
    const b = Z.boxOf(el);
    if (!Z.inView(b)) continue;
    const s = getComputedStyle(el);
    const width = b.w - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
    const lines = lineCount(el);
    paragraphs.push({
      ...Z.ref(el),
      lines,
      ch: Math.round(width / zeroWidth(s)),
      width: Math.round(width),
      chars: t.length,
      fontSize: parseFloat(s.fontSize) || 0,
    });
    if (paragraphs.length >= 60) break;
  }
  const runs: RunFact[] = [];
  const seenRun = new Set<Element>();
  for (const p of all('p')) {
    if (seenRun.has(p) || p.closest(NOT_BODY)) continue;
    const run: Element[] = [];
    for (let n: Element | null = p; n && n.tagName === 'P'; n = n.nextElementSibling) {
      if (Z.visible(n) && textOf(n).length >= 40) run.push(n);
      seenRun.add(n);
    }
    if (run.length < 6) continue;
    const boxes = run.map((r) => Z.boxOf(r));
    const x = Math.min(...boxes.map((q: Box) => q.x));
    const y = Math.min(...boxes.map((q: Box) => q.y));
    const box = { x, y, w: Math.max(...boxes.map((q: Box) => q.x + q.w)) - x, h: Math.max(...boxes.map((q: Box) => q.y + q.h)) - y };
    if (!Z.inView({ ...box, h: Math.min(box.h, vh) })) continue;
    runs.push({ first: Z.ref(run[0]), count: run.length, box, selectors: run.map((r) => Z.selectorOf(r)) });
  }
  const legal = /\b(terms( of (service|use))?|privacy( policy)?|cookie policy|legal|gdpr|data processing|acceptable use|conditions)\b/i.test(
    [document.title, textOf(document.querySelector('h1')), location.pathname].join(' '),
  );

  /* ---- content revealed only on hover --------------------------------------- */
  const reveals: HoverReveal[] = [];
  let readable = 0;
  let unreadable = 0;
  const styleRules: { sel: string; style: CSSStyleDeclaration; media: string | null }[] = [];
  const walk = (list: CSSRuleList, media: string | null) => {
    for (const r of Array.from(list)) {
      if (r instanceof CSSStyleRule) styleRules.push({ sel: r.selectorText, style: r.style, media });
      else if (r instanceof CSSMediaRule) walk(r.cssRules, media ? `${media} and ${r.conditionText}` : r.conditionText);
      else if ((r as any).cssRules) walk((r as any).cssRules, media);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules, null);
      readable += 1;
    } catch {
      unreadable += 1;
    }
  }
  const desktopOnly = (m: string | null) => {
    if (!m) return false;
    if (/\(\s*(any-)?hover\s*:\s*hover\s*\)|\(\s*(any-)?pointer\s*:\s*fine\s*\)/i.test(m)) return true;
    const min = m.match(/min-width\s*:\s*(\d+(?:\.\d+)?)(px|em|rem)/i);
    if (min) {
      const px = Number(min[1]) * (min[2].toLowerCase() === 'px' ? 1 : 16);
      if (px > 1024) return true;
    }
    return false;
  };
  const hidden = (el: Element) => {
    const s = getComputedStyle(el);
    return s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.1;
  };
  const TOGGLE = /focus|aria-expanded|\[open\]|\.open\b|\.is-open|\.active|\.show\b|\.is-active|:checked|\.expanded|\.visible|\.toggled/i;
  const seenTargets = new Set<string>();
  for (const { sel, style, media } of styleRules) {
    if (!sel || !sel.includes(':hover') || reveals.length >= 20) continue;
    const reveal =
      (style.display && style.display !== 'none') ||
      style.visibility === 'visible' ||
      (style.opacity !== '' && Number(style.opacity) >= 0.5);
    if (!reveal) continue;
    for (const part of sel.split(',').map((p) => p.trim())) {
      const m = part.match(/^(.*?:hover(?:[:.\w()-]|\[[^\]]*\])*)(\s*[>+~]\s*|\s+)(.+)$/);
      if (!m) continue;
      const triggerSel = m[1].replace(/:hover/g, '') || '*';
      const targetSel = part.replace(/:hover/g, '');
      if (seenTargets.has(targetSel) || desktopOnly(media)) continue;
      let targets: Element[] = [];
      let triggers: Element[] = [];
      try {
        targets = all(targetSel).filter(hidden);
        triggers = all(triggerSel).filter((t) => shown(t) && Z.inView(Z.boxOf(t)));
      } catch {
        continue;
      }
      if (!targets.length || !triggers.length) continue;
      const trigger = triggers.find((t) => targets.some((x) => t.contains(x) || t.parentElement?.contains(x)));
      if (!trigger) continue;
      const revealed = targets.filter((x) => trigger.contains(x) || trigger.parentElement?.contains(x));
      const revealedText = clean(revealed.map((x) => x.textContent || '').join(' '));
      const controls = revealed.flatMap((x) => all<HTMLAnchorElement>('a[href], button', x));
      if (!revealedText && !controls.length) continue; // decorative
      // A button or link animating its own label on hover: the control itself is
      // still there to tap, and nothing it offers is hidden.
      const host = trigger.closest('a[href], button, [role="button"]') ?? trigger.querySelector('a[href], button, [role="button"]');
      if (!controls.length && host && revealed.every((x) => host.contains(x))) continue;
      seenTargets.add(targetSel);
      const last = m[3].trim().split(/\s*[>+~]\s*|\s+/).pop() || '';
      const touchEquivalent = styleRules.some((r) => r.sel !== sel && r.sel.includes(last) && TOGGLE.test(r.sel));
      const outsideHrefs = new Set(
        all<HTMLAnchorElement>('a[href]').filter((a) => !revealed.some((x) => x.contains(a)) && Z.visible(a)).map((a) => a.href),
      );
      const links = controls.filter((c): c is HTMLAnchorElement => c.tagName === 'A');
      reveals.push({
        trigger: Z.ref(trigger),
        target: targetSel.slice(0, 160),
        rule: `${part.slice(0, 160)} { ${style.cssText.slice(0, 120)} }`,
        media,
        touchEquivalent,
        toggleHint: !!trigger.querySelector('[aria-expanded], [aria-haspopup], button, summary') || trigger.matches('[aria-expanded], [aria-haspopup], button, summary'),
        inNav: !!trigger.closest('nav, header, [role="navigation"], [role="menubar"]'),
        duplicated: links.length > 0 && !revealedText.replace(links.map((l) => clean(l.textContent || '')).join(' '), '').trim() && links.every((l) => outsideHrefs.has(l.href)),
        revealedText: revealedText.slice(0, 120),
      });
    }
  }

  /* ---- an open modal ------------------------------------------------------- */
  let modal: ModalFact | null = null;
  const area = vw * vh;
  const covering = (el: Element) => {
    const s = getComputedStyle(el);
    if (s.position !== 'fixed' && s.position !== 'absolute') return false;
    const r = el.getBoundingClientRect();
    const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return ix * iy >= 0.6 * area;
  };
  let panel: Element | undefined = all('dialog, [aria-modal="true"], [role="dialog"], [role="alertdialog"]').find((d) => {
    if (!shown(d) || !Z.inView(Z.boxOf(d))) return false;
    let isModal = d.getAttribute('aria-modal') === 'true';
    try {
      isModal ||= d.matches(':modal');
    } catch {
      /* :modal unsupported */
    }
    if (isModal) return true;
    for (let n = d.parentElement; n && n !== document.body; n = n.parentElement) if (covering(n)) return true;
    return covering(d) && !!all('a[href], button, input', d).length;
  });
  let kind = panel ? (panel.getAttribute('aria-modal') === 'true' ? 'aria-modal dialog' : 'dialog') : '';
  if (!panel) {
    // An overlay built from divs: a fixed layer over most of the screen with controls in it.
    const overlay = all('body *')
      .slice(0, 4000)
      .find((el) => {
        const s = getComputedStyle(el);
        if (s.position !== 'fixed' || !covering(el) || !shown(el)) return false;
        const z = parseInt(s.zIndex, 10);
        return (Number.isFinite(z) ? z >= 10 : false) && all('a[href], button, input', el).some(shown) && Z.rgba(s.backgroundColor)[3] >= 0.2;
      });
    if (overlay) {
      panel = all('*', overlay).find((c) => {
        const b = Z.boxOf(c);
        return shown(c) && Z.rgba(getComputedStyle(c).backgroundColor)[3] >= 0.9 && b.w * b.h < 0.8 * area && b.w * b.h > 0.03 * area;
      }) ?? overlay;
      kind = 'overlay';
    }
  }
  if (panel) {
    const pb = panel.getBoundingClientRect();
    const controls = all('a[href], button, [role="button"], input[type="button"], input[type="submit"]', panel).filter(shown);
    const names = controls.map((c) => clean(Z.nameOf(c) || (c as HTMLInputElement).value || c.getAttribute('title') || '')).filter(Boolean);
    const closeNames = names.filter((n) => /^(×|✕|✖|x)$|\b(close|dismiss|cancel|no,? thanks|not now|skip|maybe later|continue without|got it)\b/i.test(n));
    const decline = names.filter((n) => /\b(decline|reject|deny|no,? thanks|i('?m| am) under|leave|exit|only necessary|necessary only|disagree)\b/i.test(n));
    let backdrop: { x: number; y: number } | null = null;
    const points = [
      [12, 12], [vw - 12, 12], [12, vh - 12], [vw - 12, vh - 12],
      [Math.max(4, pb.left - 24), pb.top + pb.height / 2], [Math.min(vw - 4, pb.right + 24), pb.top + pb.height / 2],
    ];
    for (const [x, y] of points) {
      if (x >= pb.left && x <= pb.right && y >= pb.top && y <= pb.bottom) continue;
      const hit = document.elementFromPoint(x, y);
      if (!hit || panel.contains(hit)) continue;
      let layered = false;
      for (let n: Element | null = hit; n && n !== document.documentElement; n = n.parentElement) {
        if (covering(n) && getComputedStyle(n).position === 'fixed') {
          layered = true;
          break;
        }
      }
      if (layered && !hit.closest('a[href], button, input, select, textarea')) {
        backdrop = { x: Math.round(x), y: Math.round(y) };
        break;
      }
    }
    modal = {
      ...Z.ref(panel),
      name: clean(panel.getAttribute('aria-label') || textOf(panel.querySelector('h1, h2, h3, [id]')) || '').slice(0, 80),
      kind,
      closeControls: closeNames.slice(0, 5),
      declinePath: decline.slice(0, 5),
      blocking: /\b(age|cookie|consent|terms|verify|18\+|21\+|privacy|agree)\b/i.test(Z.text(panel)),
      backdrop,
    };
  }

  /* ---- buttons with a generic verb ------------------------------------------ */
  const GENERIC = /^(ok|okay|submit|continue|yes|no|confirm)$/i;
  const COMMERCIAL = /[$€£¥₹]\s?\d|\d\s?(usd|eur|gbp)\b|\b(pay|payment|order|purchase|buy|checkout|subscribe|subscription|plan|billing|card|upgrade)\b/i;
  const DESTRUCTIVE = /\b(delete|remove|cancel|deactivate|clear|erase|discard|unsubscribe|close (your )?account|revoke|reset)\b/i;
  const generic: GenericButton[] = [];
  for (const el of controlsInView) {
    if (el.tagName === 'A' && !/btn|button/i.test(el.getAttribute('class') || '')) continue;
    const label = nameOrValue(el).replace(/[\s.!→›>»]+$/, '');
    if (!GENERIC.test(label)) continue;
    const dialog = el.closest('dialog, [role="dialog"], [role="alertdialog"], [aria-modal="true"]');
    const form = el.closest('form');
    const scope = dialog ?? form ?? el.closest('section, article, main') ?? document.body;
    // What the action is about is often stated just outside the form — the plan, the price.
    const around = dialog ?? el.closest('section, article, main') ?? scope;
    let heading = '';
    const labelled = scope.getAttribute('aria-labelledby');
    if (labelled) heading = textOf(document.getElementById(labelled));
    if (!heading) heading = textOf(scope.querySelector('h1, h2, h3, h4, legend'));
    if (!heading && around !== scope) heading = textOf(around.querySelector('h1, h2, h3, h4'));
    const context = clean(Z.text(around)).slice(0, 400);
    generic.push({
      ...Z.ref(el),
      label,
      container: dialog ? 'dialog' : form ? 'form' : 'section',
      heading: heading.slice(0, 120),
      context,
      commercial: COMMERCIAL.test(context),
      destructive: DESTRUCTIVE.test(context),
    });
  }
  const destructive = controlsInView
    .map((el) => ({ el, label: nameOrValue(el) }))
    .filter(({ label }) => label.length <= 40 && /\b(delete|remove|cancel subscription|deactivate|clear|erase|discard|close account)\b/i.test(label))
    .map(({ el, label }) => ({ ...Z.ref(el), label }));

  /* ---- is value behind an account? ----------------------------------------- */
  const AUTH = /sign-?up|signup|register|registration|log-?in|sign-?in|signin|auth|account\/(new|create)|\/join\b|onboarding|create-account/i;
  const authLinks = ctas
    .filter((c) => c.conversion && c.href && AUTH.test(c.href))
    .map((c) => ({ selector: c.selector, label: c.label, href: c.href! }));
  const DEMO = /\b(demo|sample|example|try (it|now|for free|without)|playground|preview|tour|see (it|how)|live|interactive|sandbox|free tool|calculator)\b/i;
  const demoPaths = all<HTMLAnchorElement>('a[href], button')
    .filter((el) => Z.visible(el))
    .filter((el) => {
      const href = el.getAttribute('href') || '';
      return (DEMO.test(Z.nameOf(el)) || /demo|sample|playground|sandbox|tour/i.test(href)) && !AUTH.test(href);
    })
    .slice(0, 8)
    .map((el) => clean(Z.nameOf(el)).slice(0, 60));
  const valueForms = forms
    .filter((f) => f.inView && !f.hasPassword && !f.hasPayment && !f.search && !/subscribe|newsletter|sign ?up|register|log ?in|sign ?in/i.test(f.submitText))
    .filter((f) => !(f.fields.length === 1 && f.fields[0].type === 'email'))
    .map((f) => f.selector);
  const accountBound = /\b(online banking|bank account|your inbox|webmail|health records?|patient portal|medical records?)\b/i.test(
    (document.body?.innerText || '').slice(0, 6000),
  );

  return {
    url: location.href,
    ctas,
    ctaRegions,
    conversionInView: [
      ...ctas.filter((c) => c.filled || c.conversion).map((c) => ({ selector: c.selector, label: c.label, why: c.filled ? 'filled button' : 'action label', box: c.box })),
      ...forms
        .filter((f) => f.inView && !f.search && f.submitText)
        .map((f) => ({ selector: f.selector, label: f.submitText, why: 'form with a submit control', box: f.box })),
    ],
    interactiveInView,
    fields,
    forms,
    steps,
    backControls,
    closeControls,
    navLinksInView,
    empties,
    clearFilter,
    navs,
    lists,
    searchControls,
    pagination,
    paragraphs,
    runs,
    legal,
    hover: { reveals, readable, unreadable },
    modal,
    generic,
    destructive,
    authLinks,
    demoPaths,
    valueForms,
    accountBound,
  };
}

/* ========================================================= interaction */

export type FormSnap = {
  texts: { text: string; selector: string; box: Box; errorish: boolean }[];
  fields: Record<string, { invalid: boolean; look: string; focused: boolean }>;
  focusedId: string | null;
};

/** The visible text around a form and how each of its fields looks right now. */
export function snapForm(formId: string): FormSnap | null {
  const Z = (window as any).__zx;
  const form = Z.byId.get(formId) as Element | undefined;
  if (!form || !form.isConnected) return null;
  const scope = form.parentElement ?? form;
  const texts: FormSnap['texts'] = [];
  for (const el of Array.from(scope.querySelectorAll('*'))) {
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
    if (!own || own.length > 200 || !Z.visible(el)) continue;
    const sig = [el.getAttribute('class'), el.getAttribute('role'), el.id, el.parentElement?.getAttribute('class')].join(' ');
    texts.push({
      text: own,
      selector: Z.selectorOf(el),
      box: Z.boxOf(el),
      errorish: /error|invalid|danger|alert|warning|help-block|feedback/i.test(sig),
    });
    if (texts.length > 300) break;
  }
  const fields: FormSnap['fields'] = {};
  for (const el of Array.from(form.querySelectorAll('input, select, textarea'))) {
    const s = getComputedStyle(el);
    fields[Z.idOf(el)] = {
      invalid: el.getAttribute('aria-invalid') === 'true',
      look: [s.borderTopColor, s.borderBottomColor, s.boxShadow, s.backgroundColor, s.outlineColor + ' ' + s.outlineStyle].join('|'),
      focused: document.activeElement === el,
    };
  }
  const active = document.activeElement;
  return { texts, fields, focusedId: active && active !== document.body ? Z.idOf(active) : null };
}

/**
 * Asks the form to validate itself without submitting it: `reportValidity`
 * fires the same `invalid` events a submission would, so a page that paints its
 * own messages on those events paints them now — and nothing is sent.
 */
export function formValidity(formId: string): { ran: boolean; invalid: number } {
  const Z = (window as any).__zx;
  const form = Z.byId.get(formId) as HTMLFormElement | undefined;
  if (!form || form.tagName !== 'FORM') return { ran: false, invalid: 0 };
  const invalid = Array.from(form.elements).filter((e) => (e as HTMLInputElement).willValidate && !(e as HTMLInputElement).checkValidity()).length;
  form.reportValidity();
  return { ran: true, invalid };
}

export function modalVisible(id: string): boolean {
  const Z = (window as any).__zx;
  const el = Z.byId.get(id) as Element | undefined;
  return !!el && el.isConnected && Z.visible(el);
}
