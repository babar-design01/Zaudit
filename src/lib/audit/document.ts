import { JSDOM } from 'jsdom';

/**
 * Facts about the document itself — the parts that have no position on screen.
 *
 * These are read from HTML with jsdom rather than in the browser so they exist
 * even when no browser could be launched: the rendered HTML when there is one,
 * the served HTML otherwise. They feed the document-level rules and the
 * page-type classifier.
 */
export type DocFacts = {
  url: string;
  path: string;
  status: number | null;
  lang: string | null;
  htmlAttributes: Record<string, string>;
  title: string | null;
  viewportMeta: string | null;
  landmarks: { main: number; nav: number; header: number; footer: number; aside: number };
  navLinkMax: number;
  h1Count: number;
  h1Values: string[];
  headings: { level: number; text: string }[];
  forms: number;
  passwordFields: number;
  emailFields: number;
  textareas: number;
  inputs: number;
  paymentFields: number;
  priceMentions: number;
  planCards: number;
  addToCart: number;
  jsonLdTypes: string[];
  articles: number;
  timeElements: number;
  codeBlocks: number;
  repeatedCards: number;
  wordCount: number;
  ctaLabels: string[];
  bodyText: string;
};

const PRICE = /(?:[$€£¥₹]\s?\d[\d,.]*|\d[\d,.]*\s?(?:USD|EUR|GBP))(?:\s*(?:\/|per)\s*(?:mo|month|yr|year|user|seat))?/gi;
/** Non-global twin of PRICE for .test(), which would otherwise carry lastIndex between calls. */
const HAS_PRICE = new RegExp(PRICE.source, 'i');
const CTA = /^(get started|start|try|sign ?up|book|buy|subscribe|request|contact|download|join|create account|talk to|get a quote|apply|add to cart|checkout|log ?in|sign ?in)/i;

export function parseHtml(html: string, url: string): Document | null {
  if (!html || !/<html|<body|<div|<main/i.test(html)) return null;
  try {
    return new JSDOM(html, { url }).window.document;
  } catch {
    return null;
  }
}

export function docFacts(doc: Document, url: string, status: number | null): DocFacts {
  const all = (sel: string) => Array.from(doc.querySelectorAll(sel));
  const t = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();

  const html = doc.documentElement;
  const htmlAttributes: Record<string, string> = {};
  for (const a of Array.from(html.attributes)) htmlAttributes[a.name] = a.value;

  // Scripts and styles are text to jsdom; they are not words anyone reads.
  const body = doc.body?.cloneNode(true) as HTMLElement | undefined;
  body?.querySelectorAll('script, style, noscript, template').forEach((n) => n.remove());
  const bodyText = (body?.textContent || '').replace(/\s+/g, ' ').trim();

  const headings = all('h1,h2,h3,h4,h5,h6')
    .map((h) => ({ level: Number(h.tagName[1]), text: t(h).slice(0, 100) }))
    .filter((h) => h.text);
  const main = doc.querySelector('main, [role="main"]');
  const h1s = all('h1').filter((h) => !main || main.contains(h));

  const jsonLdTypes: string[] = [];
  for (const s of all('script[type="application/ld+json"]')) {
    try {
      const walk = (v: unknown): void => {
        if (Array.isArray(v)) return v.forEach(walk);
        if (v && typeof v === 'object') {
          const o = v as Record<string, unknown>;
          const type = o['@type'];
          if (typeof type === 'string') jsonLdTypes.push(type);
          if (Array.isArray(type)) type.forEach((x) => typeof x === 'string' && jsonLdTypes.push(x));
          if (o['@graph']) walk(o['@graph']);
        }
      };
      walk(JSON.parse(s.textContent || ''));
    } catch {
      /* malformed JSON-LD is common and says nothing about the page type */
    }
  }

  /* Repeated sibling blocks carrying a link — the shape of a listing. */
  let repeatedCards = 0;
  for (const parent of all('ul, ol, div, section')) {
    const kids = Array.from(parent.children);
    if (kids.length < 6) continue;
    const withLink = kids.filter((k) => k.querySelector('a[href]') && k.querySelector('img, h2, h3, h4'));
    if (withLink.length >= 6) repeatedCards = Math.max(repeatedCards, withLink.length);
  }

  const planCards = all('[class*="plan" i], [class*="tier" i], [class*="pricing" i] > *').filter((el) =>
    HAS_PRICE.test(t(el)),
  ).length;

  const ctaLabels = [
    ...new Set(
      all('a[href], button, [role="button"], input[type="submit"]')
        .map((el) => (el.getAttribute('value') || t(el)).slice(0, 50))
        .filter((x) => CTA.test(x)),
    ),
  ].slice(0, 20);

  let pathname = '/';
  try {
    pathname = new URL(url).pathname || '/';
  } catch {
    /* keep the root */
  }

  return {
    url,
    path: pathname,
    status,
    lang: html.getAttribute('lang'),
    htmlAttributes,
    title: doc.querySelector('title') ? (doc.title ?? '') : null,
    viewportMeta: doc.querySelector('meta[name="viewport" i]')?.getAttribute('content') ?? null,
    landmarks: {
      main: all('main, [role="main"]').length,
      nav: all('nav, [role="navigation"]').length,
      header: all('header, [role="banner"]').length,
      footer: all('footer, [role="contentinfo"]').length,
      aside: all('aside, [role="complementary"]').length,
    },
    navLinkMax: Math.max(0, ...all('nav, [role="navigation"], header').map((n) => n.querySelectorAll('a[href]').length)),
    h1Count: h1s.length,
    h1Values: h1s.map((h) => t(h).slice(0, 100)),
    headings: headings.slice(0, 40),
    forms: all('form').length,
    passwordFields: all('input[type="password"]').length,
    emailFields: all('input[type="email"], input[autocomplete="email"], input[name*="email" i]').length,
    textareas: all('textarea').length,
    inputs: all('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').length,
    paymentFields: all('input[autocomplete^="cc-"], input[name*="card" i], iframe[src*="stripe" i], iframe[src*="braintree" i]').length,
    priceMentions: (bodyText.match(PRICE) || []).length,
    planCards,
    addToCart: all('button, a, input[type="submit"]').filter((el) => /add to (cart|bag|basket)|buy now/i.test(t(el) || el.getAttribute('value') || '')).length,
    jsonLdTypes: [...new Set(jsonLdTypes)],
    articles: all('article').length,
    timeElements: all('time[datetime]').length,
    codeBlocks: all('pre code, pre').length,
    repeatedCards,
    wordCount: (bodyText.match(/\S+/g) || []).length,
    ctaLabels,
    bodyText: bodyText.slice(0, 4000),
  };
}

/* ------------------------------------------------------------ language */

/**
 * The page's language, read from its own words.
 *
 * Only used to fill the fix for a missing `lang` — never to decide whether a
 * rule fires. Returns null unless one language is clearly ahead, so a fix never
 * names a language on a guess.
 */
const STOPWORDS: Record<string, string[]> = {
  en: ['the', 'and', 'to', 'of', 'you', 'your', 'for', 'with', 'is', 'that', 'on', 'are', 'our', 'this'],
  es: ['el', 'la', 'de', 'que', 'y', 'en', 'los', 'para', 'con', 'una', 'por', 'las', 'su', 'es'],
  fr: ['le', 'la', 'les', 'de', 'et', 'des', 'pour', 'vous', 'une', 'est', 'dans', 'votre', 'avec', 'sur'],
  de: ['der', 'die', 'und', 'das', 'mit', 'für', 'sie', 'ist', 'nicht', 'ein', 'eine', 'auf', 'zu', 'ihre'],
  pt: ['de', 'que', 'e', 'o', 'a', 'para', 'com', 'um', 'uma', 'os', 'seu', 'sua', 'não', 'em'],
  it: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'una', 'con', 'non', 'sono', 'del', 'della', 'il'],
  nl: ['de', 'het', 'een', 'en', 'van', 'voor', 'met', 'je', 'uw', 'op', 'is', 'niet', 'zijn', 'dat'],
};

export function detectLanguage(text: string): { code: string; share: number } | null {
  const words = text.toLowerCase().match(/\p{L}+/gu) || [];
  if (words.length < 40) return null;
  const scores = Object.entries(STOPWORDS).map(([code, list]) => {
    const set = new Set(list);
    return { code, hits: words.filter((w) => set.has(w)).length };
  });
  scores.sort((a, b) => b.hits - a.hits);
  const [best, next] = scores;
  if (best.hits < 8 || best.hits < next.hits * 1.8) return null;
  return { code: best.code, share: Math.round((best.hits / words.length) * 100) / 100 };
}
