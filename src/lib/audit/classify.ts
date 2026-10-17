import type { PageType, PageTypeResult } from './contract';
import type { DocFacts } from './document';

/**
 * Page-type classification from measured signals — the fallback for when the
 * model is not available, and the evidence the model is shown when it is.
 *
 * Each type accumulates points from facts counted on the page. The winner has
 * to clear a threshold *and* beat the runner-up by a margin; otherwise the page
 * is `unknown`, and the contract then restricts evaluation to rules marked
 * `[all]` rather than letting a guess decide which rules run.
 */

const THRESHOLD = 0.6;

type Score = { type: PageType; points: number; signals: string[] };

export function classifyBySignals(d: DocFacts): PageTypeResult {
  const path = d.path.toLowerCase();
  const title = (d.title || '').toLowerCase();
  const scores = new Map<PageType, Score>();
  const add = (type: PageType, points: number, signal: string) => {
    const s = scores.get(type) ?? { type, points: 0, signals: [] };
    s.points += points;
    s.signals.push(signal);
    scores.set(type, s);
  };
  const isRoot = path === '/' || path === '';
  const ld = (re: RegExp) => d.jsonLdTypes.some((x) => re.test(x));

  /* error -------------------------------------------------------------- */
  if (d.status && d.status >= 400) add('error_page', 1, `HTTP status ${d.status}`);
  if (/\b(404|page not found|not found|500|server error)\b/.test(title)) add('error_page', 0.6, `title "${d.title}"`);

  /* auth --------------------------------------------------------------- */
  if (d.passwordFields === 1 && d.inputs <= 6) add('login', 0.5, '1 password field in a short form');
  if (d.passwordFields === 1 && /\b(sign in|log in|login|signin)\b/.test(title)) add('login', 0.25, `title "${d.title}"`);
  if (/(^|\/)(login|log-in|signin|sign-in)(\/|$)/.test(path)) add('login', 0.5, `path ${d.path}`);
  if (d.passwordFields >= 2) add('signup', 0.4, `${d.passwordFields} password fields (password + confirm)`);
  if (d.passwordFields >= 1 && d.inputs >= 3 && d.emailFields >= 1) add('signup', 0.25, 'password, email and further fields');
  if (/(^|\/)(signup|sign-up|register|join|create-account)(\/|$)/.test(path)) add('signup', 0.5, `path ${d.path}`);

  /* commerce ----------------------------------------------------------- */
  // A card form on a site's front page is usually a product demo, not a checkout.
  if (d.paymentFields > 0) add('checkout', isRoot ? 0.3 : 0.6, `${d.paymentFields} payment field(s)${isRoot ? ' on the site root' : ''}`);
  if (/(^|\/)(checkout|cart|basket|bag)(\/|$)/.test(path)) add('checkout', 0.5, `path ${d.path}`);
  if (ld(/^Product$/i)) add('product_detail', 0.5, 'schema.org Product markup');
  if (d.addToCart >= 1 && d.addToCart <= 3) add('product_detail', 0.35, `${d.addToCart} add-to-cart control(s)`);
  if (/(^|\/)(product|products|p|item|dp)\//.test(path)) add('product_detail', 0.2, `path ${d.path}`);
  if (d.repeatedCards >= 8) add('listing', 0.45, `${d.repeatedCards} repeated linked cards`);
  if (d.addToCart >= 4) add('listing', 0.3, `${d.addToCart} add-to-cart controls`);
  if (/(^|\/)(collections?|category|categories|shop|search|catalog|browse)(\/|$)/.test(path)) add('listing', 0.35, `path ${d.path}`);

  /* pricing ------------------------------------------------------------ */
  if (/(^|\/)(pricing|plans|price)(\/|$)/.test(path)) add('pricing', 0.5, `path ${d.path}`);
  if (d.planCards >= 2) add('pricing', 0.35, `${d.planCards} plan cards with prices`);
  else if (d.priceMentions >= 3) add('pricing', 0.2, `${d.priceMentions} price mentions`);

  /* content ------------------------------------------------------------ */
  if (ld(/^(Article|BlogPosting|NewsArticle)$/i)) add('blog_article', 0.5, 'schema.org Article markup');
  if (d.articles === 1 && d.wordCount >= 600) add('blog_article', 0.3, `one <article>, ${d.wordCount} words`);
  if (d.timeElements >= 1 && d.articles >= 1) add('blog_article', 0.15, 'publication date in <time>');
  if (/(^|\/)(blog|posts?|news|articles?|stories)\/[^/]+/.test(path)) add('blog_article', 0.35, `path ${d.path}`);
  if (/(^|\/)(docs?|documentation|guides?|reference|api)(\/|$)/.test(path)) add('docs', 0.5, `path ${d.path}`);
  if (d.codeBlocks >= 3) add('docs', 0.3, `${d.codeBlocks} code blocks`);

  /* contact ------------------------------------------------------------ */
  if (/(^|\/)(contact|contact-us|support|get-in-touch)(\/|$)/.test(path)) add('contact', 0.5, `path ${d.path}`);
  if (d.textareas >= 1 && d.emailFields >= 1 && d.passwordFields === 0) add('contact', 0.3, 'message box and email field');

  /* app surfaces ------------------------------------------------------- */
  if (/(^|\/)(settings|account|preferences|profile)(\/|$)/.test(path)) add('settings', 0.5, `path ${d.path}`);
  if (/(^|\/)(dashboard|app|overview|home)(\/|$)/.test(path) && d.landmarks.nav >= 1) add('dashboard', 0.35, `path ${d.path}`);
  if (/(^|\/)(onboarding|welcome|get-started|setup)(\/|$)/.test(path)) add('onboarding', 0.5, `path ${d.path}`);

  /* landing ------------------------------------------------------------ */
  if (isRoot) add('landing', 0.35, 'site root');
  if (d.h1Count >= 1 && d.ctaLabels.length >= 1 && d.forms <= 1 && d.passwordFields === 0) {
    add('landing', 0.2, `headline plus call to action (${d.ctaLabels.slice(0, 2).join(', ')})`);
  }
  if (d.headings.length >= 5 && d.passwordFields === 0 && (d.paymentFields === 0 || isRoot)) add('landing', 0.1, `${d.headings.length} section headings`);

  const ranked = [...scores.values()].sort((a, b) => b.points - a.points);
  const best = ranked[0];
  const next = ranked[1];
  if (!best) return { type: 'unknown', confidence: 0, source: 'none', signals: ['no page-type signal was measured'] };

  const confidence = Math.min(0.95, Math.round(best.points * 100) / 100);
  const margin = best.points - (next?.points ?? 0);
  if (confidence < THRESHOLD || margin < 0.15) {
    return {
      type: 'unknown',
      confidence,
      source: 'signals',
      signals: [
        `signals were too weak or too close to call (${ranked
          .slice(0, 3)
          .map((s) => `${s.type} ${s.points.toFixed(2)}`)
          .join(', ')})`,
      ],
    };
  }
  return { type: best.type, confidence, source: 'signals', signals: best.signals };
}
