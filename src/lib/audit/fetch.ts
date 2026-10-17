import { JSDOM } from 'jsdom';
import { assertPublicUrl } from './net';

/**
 * Getting a real copy of someone else's page.
 *
 * Two sources, and which one answers is itself evidence:
 *
 *  - **Direct** is the HTML the server actually sends. Fast, honest about status
 *    codes and redirects, and it is what a crawler or a link preview would see.
 *  - **The reader** (Jina, no key) returns the page after its scripts have run.
 *    Slower, and a third party, so it is asked only when it can add something.
 *
 * A page whose served HTML is thin but whose rendered HTML is full is not a
 * fetch problem — it is a finding, and `clientRendered` records it rather than
 * letting the checks infer it from a low word count.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/131.0.0.0 Safari/537.36 Zaudit/1.0 (+https://zaudit.com/bot)';

/** Enough for any real page; a cap so one enormous response cannot exhaust memory. */
const MAX_BYTES = 8 * 1024 * 1024;

export type FetchSource = 'direct' | 'reader' | 'browser';

export type PageFetch = {
  doc: Document;
  html: string;
  /** Where the redirects actually ended up. */
  finalUrl: string;
  status: number | null;
  /** Which source the parsed document came from. */
  source: FetchSource;
  /** Served HTML was near-empty and the rendered copy was not. */
  clientRendered: boolean;
  /** Words in the served HTML, when it was readable. Null if direct never answered. */
  servedWordCount: number | null;
  /** Why direct failed, when it did. Shown as context, never as a finding. */
  directError: string | null;
  readerError: string | null;
};

export class FetchError extends Error {}

/** Read a response body with a ceiling, so a hostile length cannot be trusted. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let out = '';
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

function looksLikeHtml(html: string): boolean {
  return /<html|<body|<head|<div|<main|<section/i.test(html);
}

function parse(html: string, url: string): Document | null {
  if (!html || !looksLikeHtml(html)) return null;
  try {
    // `url` so that relative hrefs resolve and `document.location` is the real page.
    return new JSDOM(html, { url }).window.document;
  } catch {
    return null;
  }
}

function wordsIn(doc: Document): number {
  const text = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
  return (text.match(/\S+/g) || []).length;
}

/** The HTML the server sends, with redirects followed. */
async function viaDirect(url: string): Promise<{ html: string; finalUrl: string; status: number }> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(20_000),
  });

  const type = res.headers.get('content-type') || '';
  if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) {
    throw new FetchError(`that address returned ${type.split(';')[0]}, not a web page`);
  }
  if (!res.ok && res.status !== 403 && res.status !== 401) {
    // A 403 still often carries a real page; anything else that failed did not.
    throw new FetchError(`the site answered ${res.status}`);
  }

  return { html: await readCapped(res), finalUrl: res.url || url, status: res.status };
}

/**
 * The page after its own scripts have run.
 *
 * Works without a key, but the keyless tier is metered per IP and answers 403
 * once that is spent — which under any real traffic is most of the time. So a
 * refusal is retried once, and `JINA_API_KEY` lifts the limit properly.
 */
async function viaReader(url: string): Promise<string> {
  const headers: Record<string, string> = { 'x-return-format': 'html', 'User-Agent': UA };
  if (process.env.JINA_API_KEY) {
    headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
  }

  let last = 0;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch('https://r.jina.ai/' + url, {
      headers,
      signal: AbortSignal.timeout(45_000),
    });
    if (res.ok) return readCapped(res);
    last = res.status;
    // 403 and 429 both mean "not right now" on the keyless tier, so one pause
    // is worth trying. Anything else is a real answer and not worth repeating.
    if (res.status !== 403 && res.status !== 429) break;
    if (attempt === 0) await new Promise((r) => setTimeout(r, 2500));
  }
  throw new FetchError(
    last === 403 || last === 429
      ? 'the rendering reader is rate limited (set JINA_API_KEY to lift it)'
      : `the reader answered ${last}`,
  );
}

/**
 * The signature of a page whose content is assembled in the browser: almost no
 * text, an empty mount point, and the scripts that will fill it.
 *
 * This is the fallback for when the reader is unavailable — it is weaker than
 * comparing the served copy against the rendered one, but it is still measured
 * on the served HTML rather than guessed at from a low word count alone.
 */
function looksClientRendered(doc: Document, words: number): boolean {
  if (words >= 200) return false;
  const mount = doc.querySelector(
    '#root:empty, #app:empty, #__next:empty, [data-reactroot], #root > :only-child:empty',
  );
  const scripts = doc.querySelectorAll('script[src]').length;
  return (!!mount && scripts > 0) || (words < 60 && scripts >= 3);
}

/**
 * A page thin enough that the interesting part is probably still in JavaScript.
 * Both conditions have to hold: a short page is not suspicious on its own.
 */
function isThin(doc: Document, words: number): boolean {
  return words < 120 || (words < 400 && doc.querySelectorAll('h1,h2,h3,p').length < 5);
}

export async function fetchPage(rawUrl: string): Promise<PageFetch> {
  const url = await assertPublicUrl(rawUrl);
  const href = url.href;

  let directDoc: Document | null = null;
  let directHtml = '';
  let finalUrl = href;
  let status: number | null = null;
  let directError: string | null = null;
  let servedWordCount: number | null = null;

  try {
    const direct = await viaDirect(href);
    finalUrl = direct.finalUrl;
    status = direct.status;
    directHtml = direct.html;
    directDoc = parse(direct.html, direct.finalUrl);
    if (directDoc) servedWordCount = wordsIn(directDoc);
    else directError = 'the response was not readable as HTML';
  } catch (err) {
    directError =
      err instanceof Error
        ? err.name === 'TimeoutError'
          ? 'the site did not answer in time'
          : err.message
        : String(err);
  }

  // Ask the reader only when direct gave us nothing, or gave us a shell.
  const needsReader = !directDoc || isThin(directDoc, servedWordCount ?? 0);
  let readerDoc: Document | null = null;
  let readerHtml = '';
  let readerError: string | null = null;

  if (needsReader) {
    try {
      readerHtml = await viaReader(href);
      readerDoc = parse(readerHtml, finalUrl);
      if (!readerDoc) readerError = 'the reader returned nothing readable';
    } catch (err) {
      readerError =
        err instanceof Error
          ? err.name === 'TimeoutError'
            ? 'the reader did not answer in time'
            : err.message
          : String(err);
    }
  }

  const readerWords = readerDoc ? wordsIn(readerDoc) : 0;

  // Prefer whichever copy actually has the page in it.
  const useReader = !!readerDoc && (!directDoc || readerWords > (servedWordCount ?? 0) * 1.5);

  const doc = useReader ? readerDoc : directDoc;
  if (!doc) {
    const why = [directError, readerError].filter(Boolean).join('; ');
    throw new FetchError(
      'Could not read ' + href + (why ? ' — ' + why : '') +
        '. The site may block automated readers, or be unreachable.',
    );
  }

  /* Measured two ways, in order of confidence: the served copy was thin and the
     rendered one was not, or — when the reader could not be reached — the served
     HTML carries the shape of an unfilled application shell. */
  const clientRendered =
    !!directDoc && !!readerDoc
      ? (servedWordCount ?? 0) < 120 && readerWords >= 200
      : !!directDoc && looksClientRendered(directDoc, servedWordCount ?? 0);

  return {
    doc,
    html: useReader ? readerHtml : directHtml,
    finalUrl,
    status,
    source: useReader ? 'reader' : 'direct',
    clientRendered,
    servedWordCount,
    directError,
    readerError,
  };
}
