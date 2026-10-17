/**
 * L1 measurement for the Performance & technical quality pillar, and for the
 * handful of trust and conversion signals that can be read from the page.
 *
 * Same constraints as the other probes: serialised into the browser, nothing
 * closed over. The web-vitals observers are installed as an init script, before
 * the page's own code runs, because LCP and layout shifts cannot be measured
 * after the fact.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Box } from './probe';

/** Collects LCP, layout shifts and long tasks from the first moment of the document. */
export const VITALS_WATCH = `(() => {
  if (window.__zxVitals) return;
  const v = { lcp: 0, lcpElement: '', cls: 0, shifts: 0, longTasks: 0, longTaskMs: 0 };
  window.__zxVitals = v;
  const path = (el) => {
    if (!el || !el.tagName) return '';
    if (el.id) return '#' + el.id;
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && n !== document.documentElement && parts.length < 5) {
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
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        v.lcp = Math.round(e.startTime);
        v.lcpElement = path(e.element) || e.url || '';
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        v.cls += e.value;
        v.shifts += 1;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        v.longTasks += 1;
        v.longTaskMs += Math.round(e.duration);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
})();`;

export type Vitals = {
  lcp: number;
  lcpElement: string;
  cls: number;
  shifts: number;
  longTasks: number;
  longTaskMs: number;
  /** Navigation timing, in milliseconds from the start of the request. */
  ttfb: number | null;
  domContentLoaded: number | null;
  load: number | null;
  /** Transfer sizes by resource kind, in bytes. */
  weight: { total: number; images: number; scripts: number; styles: number; fonts: number };
  /** Sub-resources fetched over plain http on an https page. */
  insecure: string[];
  /** Images served much larger than they are drawn, or with no dimensions set. */
  images: { selector: string; src: string; naturalWidth: number; renderedWidth: number; bytes: number; sized: boolean; lazy: boolean; inView: boolean; box: Box }[];
};

export function readVitals(): Vitals {
  const w = window as any;
  const Z = w.__zx;
  const v = w.__zxVitals ?? { lcp: 0, lcpElement: '', cls: 0, shifts: 0, longTasks: 0, longTaskMs: 0 };
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const weight = { total: 0, images: 0, scripts: 0, styles: 0, fonts: 0 };
  const insecure: string[] = [];
  const bySrc = new Map<string, number>();
  for (const r of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
    const size = r.transferSize || r.encodedBodySize || 0;
    weight.total += size;
    if (r.initiatorType === 'img' || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(r.name)) {
      weight.images += size;
      bySrc.set(r.name, (r.encodedBodySize || r.transferSize || 0) + (bySrc.get(r.name) ?? 0));
    } else if (r.initiatorType === 'script') weight.scripts += size;
    else if (r.initiatorType === 'link' || /\.css(\?|$)/i.test(r.name)) weight.styles += size;
    else if (/\.(woff2?|ttf|otf)(\?|$)/i.test(r.name)) weight.fonts += size;
    if (location.protocol === 'https:' && r.name.startsWith('http://') && insecure.length < 10) insecure.push(r.name.slice(0, 200));
  }

  const images: Vitals['images'] = [];
  for (const img of Array.from(document.images)) {
    if (!img.naturalWidth || !Z?.visible(img)) continue;
    const box = Z.boxOf(img);
    const src = img.currentSrc || img.src;
    images.push({
      selector: Z.selectorOf(img),
      src: src.slice(0, 200),
      naturalWidth: img.naturalWidth,
      renderedWidth: Math.round(box.w),
      bytes: bySrc.get(src) ?? 0,
      sized: (img.hasAttribute('width') && img.hasAttribute('height')) || !!img.style.aspectRatio || getComputedStyle(img).aspectRatio !== 'auto',
      lazy: img.loading === 'lazy',
      inView: Z.inView(box),
      box,
    });
    if (images.length >= 40) break;
  }

  return {
    lcp: v.lcp,
    lcpElement: v.lcpElement,
    cls: Math.round(v.cls * 1000) / 1000,
    shifts: v.shifts,
    longTasks: v.longTasks,
    longTaskMs: v.longTaskMs,
    ttfb: nav ? Math.round(nav.responseStart) : null,
    domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
    load: nav ? Math.round(nav.loadEventEnd || nav.domComplete) : null,
    weight,
    insecure,
    images,
  };
}

/* ------------------------------------------------------------ page facts */

export type TechFacts = {
  url: string;
  https: boolean;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogImage: string | null;
  h1Count: number;
  /** Path segments, for deciding whether the page is deep enough to need breadcrumbs. */
  depth: number;
  breadcrumb: { present: boolean; selector: string | null; items: number };
  nav: { present: boolean; selector: string | null; links: number; landmarks: number };
  /** Links worth checking for a 404, as absolute URLs. */
  links: { href: string; text: string; selector: string; box: Box; inView: boolean }[];
  consent: { present: boolean; selector: string | null; box: Box | null; accept: string[]; decline: string[]; text: string } | null;
  credentials: { form: string; box: Box; kinds: string[]; action: string; secure: boolean }[];
  /** The first screen's value proposition: a headline, a supporting line, an action. */
  valueProp: { headline: string | null; headlineBox: Box | null; support: string | null; action: string | null };
  socialProof: { kind: string; text: string; selector: string; box: Box }[];
};

export function collectTechFacts(): TechFacts {
  const Z = (window as any).__zx;
  const all = <T extends Element = Element>(sel: string) => Array.from(document.querySelectorAll<T>(sel));
  const clean = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
  const meta = (name: string) =>
    document.querySelector<HTMLMetaElement>(`meta[name="${name}" i]`)?.content?.trim() ||
    document.querySelector<HTMLMetaElement>(`meta[property="${name}" i]`)?.content?.trim() ||
    null;

  /* breadcrumbs and navigation */
  const crumbEl =
    document.querySelector('nav[aria-label*="breadcrumb" i], [class*="breadcrumb" i], [itemtype*="BreadcrumbList" i], ol[class*="crumb" i]') ?? null;
  const navEl = all('nav, [role="navigation"]').find((n) => Z.visible(n) && n.querySelectorAll('a[href]').length >= 2) ?? null;

  /* links worth checking */
  const seen = new Set<string>();
  const links: TechFacts['links'] = [];
  for (const a of all<HTMLAnchorElement>('a[href]')) {
    const href = a.href;
    if (!/^https?:/i.test(href) || seen.has(href) || !Z.visible(a)) continue;
    seen.add(href);
    const box = Z.boxOf(a);
    links.push({ href: href.slice(0, 500), text: clean(Z.nameOf(a)).slice(0, 60), selector: Z.selectorOf(a), box, inView: Z.inView(box) });
    if (links.length >= 60) break;
  }

  /* a consent or cookie banner, and whether declining is as easy as accepting */
  let consent: TechFacts['consent'] = null;
  for (const el of all('div, section, aside, dialog, [role="dialog"], [role="alertdialog"], [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i]')) {
    if (consent) break;
    const t = clean(Z.text(el));
    if (t.length < 20 || t.length > 1200 || !/cookie|consent|privacy|tracking|gdpr/i.test(t)) continue;
    if (!Z.visible(el) || el.querySelectorAll('button, a[href], [role="button"]').length < 1) continue;
    const box = Z.boxOf(el);
    if (box.h > 0.9 * window.innerHeight && box.w > 0.9 * window.innerWidth && el.children.length > 6) continue;
    const names = Array.from(el.querySelectorAll('button, a[href], [role="button"], input[type="submit"]'))
      .filter((b) => Z.visible(b))
      .map((b) => clean(Z.nameOf(b) || (b as HTMLInputElement).value || ''))
      .filter(Boolean);
    consent = {
      present: true,
      selector: Z.selectorOf(el),
      box,
      accept: names.filter((n) => /accept|agree|allow|got it|ok\b|continue|yes/i.test(n)),
      decline: names.filter((n) => /decline|reject|deny|refuse|necessary only|only necessary|essential only|manage|settings|customi[sz]e|no thanks|disagree/i.test(n)),
      text: t.slice(0, 300),
    };
  }

  /* where credentials are collected */
  const credentials: TechFacts['credentials'] = [];
  for (const form of all<HTMLFormElement>('form')) {
    const kinds: string[] = [];
    if (form.querySelector('input[type="password"]')) kinds.push('password');
    if (form.querySelector('input[autocomplete*="cc-" i], input[name*="card" i], input[name*="cvc" i], input[name*="cvv" i]')) kinds.push('payment');
    if (!kinds.length || !Z.visible(form)) continue;
    const action = form.getAttribute('action') || location.href;
    let actionUrl = action;
    try {
      actionUrl = new URL(action, location.href).href;
    } catch {
      /* keep the raw value */
    }
    credentials.push({
      form: Z.selectorOf(form),
      box: Z.boxOf(form),
      kinds,
      action: actionUrl.slice(0, 200),
      secure: location.protocol === 'https:' && !actionUrl.startsWith('http://'),
    });
  }

  /* the first screen's case: headline, supporting line, action */
  const inFirst = (el: Element) => Z.visible(el) && Z.inView(Z.boxOf(el));
  const headline = all('h1').find(inFirst) ?? all('h1, h2, [role="heading"]').find(inFirst) ?? null;
  const support = all('p, h2, [class*="subtitle" i], [class*="lede" i], [class*="lead" i]')
    .filter((el) => inFirst(el) && el !== headline && clean(Z.text(el)).length >= 30)
    .map((el) => clean(Z.text(el)))[0] ?? null;
  const action = all('a[href], button, [role="button"], input[type="submit"]')
    .filter((el) => inFirst(el))
    .map((el) => clean(Z.nameOf(el) || (el as HTMLInputElement).value || ''))
    .find((t) => t.length > 1 && /\b(start|try|get|buy|book|request|contact|sign ?up|subscribe|demo|join|download|order|shop|create|run|see plans|talk)\b/i.test(t)) ?? null;

  /* social proof */
  const PROOF: [RegExp, string][] = [
    [/trusted by|used by|join \d|\d[\d,.]*\+? (customers|companies|teams|users|businesses)/i, 'customer count'],
    [/★|⭐|\b\d(\.\d)? ?\/ ?5\b|rated|reviews?\b/i, 'rating or reviews'],
    [/testimonial|case stud(y|ies)|success stor/i, 'testimonial or case study'],
    [/as seen (in|on)|featured in|award|certified|iso ?\d|soc ?2|hipaa|gdpr compliant/i, 'recognition or certification'],
  ];
  const socialProof: TechFacts['socialProof'] = [];
  for (const el of all('section, div, p, span, h2, h3, ul, figure')) {
    if (socialProof.length >= 6) break;
    if (el.children.length > 6 || !Z.visible(el)) continue;
    const t = clean(Z.text(el));
    if (!t || t.length > 200) continue;
    const hit = PROOF.find(([re]) => re.test(t));
    if (!hit) continue;
    const box = Z.boxOf(el);
    if (socialProof.some((s) => s.text === t)) continue;
    socialProof.push({ kind: hit[1], text: t.slice(0, 120), selector: Z.selectorOf(el), box });
  }
  const logoRow = all('img[alt*="logo" i], [class*="logo" i] img').filter((el) => Z.visible(el));
  if (logoRow.length >= 3 && socialProof.length < 6) {
    socialProof.push({ kind: 'customer logos', text: `${logoRow.length} logos`, selector: Z.selectorOf(logoRow[0]), box: Z.boxOf(logoRow[0]) });
  }

  return {
    url: location.href,
    https: location.protocol === 'https:',
    title: document.title ? document.title.trim() : null,
    description: meta('description'),
    canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null,
    robots: meta('robots'),
    ogTitle: meta('og:title'),
    ogImage: meta('og:image'),
    h1Count: all('h1').length,
    depth: location.pathname.split('/').filter(Boolean).length,
    breadcrumb: {
      present: !!crumbEl && Z.visible(crumbEl),
      selector: crumbEl ? Z.selectorOf(crumbEl) : null,
      items: crumbEl ? crumbEl.querySelectorAll('a, li').length : 0,
    },
    nav: {
      present: !!navEl,
      selector: navEl ? Z.selectorOf(navEl) : null,
      links: navEl ? navEl.querySelectorAll('a[href]').length : 0,
      landmarks: all('nav, [role="navigation"]').length,
    },
    links,
    consent,
    credentials,
    valueProp: {
      headline: headline ? clean(Z.text(headline)).slice(0, 160) : null,
      headlineBox: headline ? Z.boxOf(headline) : null,
      support: support ? support.slice(0, 200) : null,
      action,
    },
    socialProof,
  };
}

/* ------------------------------------------------------------ reflow */

export type Overflow = {
  width: number;
  scrollWidth: number;
  overflowBy: number;
  offenders: { selector: string; right: number; text: string }[];
};

/** What sticks out horizontally at a narrow width. */
export function scanOverflow(): Overflow {
  const Z = (window as any).__zx;
  const width = document.documentElement.clientWidth;
  const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
  const offenders: Overflow['offenders'] = [];
  if (scrollWidth > width + 2) {
    for (const el of Array.from(document.querySelectorAll('body *')).slice(0, 4000)) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.right <= width + 2) continue;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') continue;
      // Report the outermost element that sticks out, not every child inside it.
      if (offenders.some((o) => document.querySelector(o.selector)?.contains(el))) continue;
      offenders.push({ selector: Z.selectorOf(el), right: Math.round(r.right), text: (Z.text(el) || el.tagName.toLowerCase()).slice(0, 60) });
      if (offenders.length >= 6) break;
    }
  }
  return { width, scrollWidth, overflowBy: Math.max(0, scrollWidth - width), offenders };
}
