import type { Box } from './probe';

/**
 * The page's elements, as a list an auditor can point at.
 *
 * The expert review is allowed to say things only a person would — "the hero
 * splits attention between two messages" — but only about something that is
 * actually on the page. So before the model looks, the page is walked top to
 * bottom and every element worth pointing at gets a short id, a kind, its text
 * and where it is. A finding that cites no id from this list is dropped.
 *
 * Serialised into the page, so it may only use `window.__zx` and the DOM.
 */

export type AnchorKind =
  | 'heading'
  | 'cta'
  | 'link'
  | 'nav'
  | 'form'
  | 'field'
  | 'image'
  | 'section'
  | 'pinned'
  | 'text';

export type Anchor = {
  id: string;
  kind: AnchorKind;
  /** The words on it, trimmed — what an auditor would quote. */
  text: string;
  selector: string;
  /** Page coordinates, not viewport: the full-page capture is drawn in these. */
  box: Box;
};

export function collectAnchors(opts: { prefix: string; max: number; maxY: number }): Anchor[] {
  const zx = (window as any).__zx;
  const out: Anchor[] = [];
  const seen = new Set<Element>();
  let n = 0;

  const clip = (s: string, len: number) => {
    const t = s.replace(/\s+/g, ' ').trim();
    return t.length > len ? t.slice(0, len - 1) + '…' : t;
  };

  const looksLikeButton = (el: Element) => {
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return true;
    if (el.tagName !== 'A') return false;
    const s = getComputedStyle(el);
    const filled = s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor);
    const boxed = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none';
    const padded = parseFloat(s.paddingLeft) >= 10 && parseFloat(s.paddingTop) >= 6;
    return (filled || boxed) && padded;
  };

  const add = (el: Element, kind: AnchorKind, textLen = 80) => {
    if (out.length >= opts.max || seen.has(el)) return;
    if (!zx.visible(el) || zx.srOnly(el)) return;
    const box = zx.boxOf(el) as Box;
    if (box.w < 8 || box.h < 8 || box.y > opts.maxY) return;
    const text = clip(
      (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.getAttribute('alt') || el.getAttribute('placeholder') || '').toString(),
      textLen,
    );
    seen.add(el);
    n += 1;
    out.push({ id: `${opts.prefix}${n}`, kind, text, selector: zx.selectorOf(el), box });
  };

  // Landmarks and sections first, so a finding can point at a whole region.
  for (const el of Array.from(document.querySelectorAll('header, nav, main > section, section, footer, aside, form'))) {
    const kind: AnchorKind = el.tagName === 'NAV' ? 'nav' : el.tagName === 'FORM' ? 'form' : 'section';
    add(el, kind, 60);
  }

  // Bars pinned over the content: cookie banners, sticky headers, chat launchers.
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const p = getComputedStyle(el).position;
    if (p !== 'fixed' && p !== 'sticky') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 24) continue;
    add(el, 'pinned', 60);
  }

  for (const el of Array.from(document.querySelectorAll('h1, h2, h3'))) add(el, 'heading', 100);
  for (const el of Array.from(document.querySelectorAll('a[href], button, [role="button"], input[type="submit"]'))) {
    if (looksLikeButton(el)) add(el, 'cta', 60);
  }
  for (const el of Array.from(document.querySelectorAll('nav a[href], header a[href]'))) add(el, 'link', 40);
  for (const el of Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'))) add(el, 'field', 50);
  for (const el of Array.from(document.querySelectorAll('img, picture, video, [role="img"]'))) {
    const b = zx.boxOf(el) as Box;
    if (b.w >= 160 && b.h >= 100) add(el, 'image', 60);
  }
  // Substantial runs of copy: hero sublines, value statements, banner text.
  for (const el of Array.from(document.querySelectorAll('p, li, blockquote'))) {
    if (((el as HTMLElement).innerText || '').trim().length >= 40) add(el, 'text', 120);
  }

  // Numbered top to bottom, so "d12" sits above "d13" — easier to read, and
  // easier for the model to keep straight.
  const sorted = out.sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
  sorted.forEach((a, i) => (a.id = `${opts.prefix}${i + 1}`));
  return sorted;
}
