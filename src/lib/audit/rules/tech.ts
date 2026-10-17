import type { Instance, RuleOutcome } from '../contract';
import type { TechFacts, Vitals } from '../probe-tech';
import { atDocument, atElement, docEvidence, elEvidence, facts, plural, type Evaluator, type Need, type RuleContext } from './acc';

/**
 * Measurements for the Performance & technical quality pillar, and for the
 * trust and conversion signals that can be read from a single page.
 *
 * These are the only checks that look past the first screen: a broken link or an
 * insecure sub-resource is a property of the page, not of a rectangle on it, so
 * their findings are document-level.
 */

const notEvaluated = (ruleId: string, reason: string): RuleOutcome => ({ ruleId, status: 'not_evaluated', reason });
const notApplicable = (ruleId: string, reason: string): RuleOutcome => ({ ruleId, status: 'not_applicable', reason });
const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)}s` : `${Math.round(n)}ms`);
const kb = (n: number) => `${Math.round(n / 1024)}KB`;

function vitals(ctx: RuleContext, ruleId: string): Need<Vitals> {
  if (!ctx.measured) return { ok: false, outcome: notEvaluated(ruleId, ctx.noBrowser ?? 'No browser was available to render the page.') };
  const v = ctx.measured.vitals;
  if (!v.ok) return { ok: false, outcome: notEvaluated(ruleId, `The page's timings could not be read: ${v.error}`) };
  return { ok: true, value: v.value };
}

function tech(ctx: RuleContext, ruleId: string): Need<TechFacts> {
  if (!ctx.measured) return { ok: false, outcome: notEvaluated(ruleId, ctx.noBrowser ?? 'No browser was available to render the page.') };
  const t = ctx.measured.tech;
  if (!t.ok) return { ok: false, outcome: notEvaluated(ruleId, `The page's technical facts could not be read: ${t.error}`) };
  return { ok: true, value: t.value };
}

/* ======================================================== web vitals */

const PERF_001: Evaluator = (ctx) => {
  const ruleId = 'PERF-001';
  const v = vitals(ctx, ruleId);
  if (!v.ok) return v.outcome;
  const { lcp, lcpElement } = v.value;
  if (!lcp) return notEvaluated(ruleId, 'The browser reported no largest-contentful-paint entry for this page.');
  const el = lcpElement || 'the largest element on the first screen';
  if (lcp <= 2500) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The first screen finished painting in ${ms(lcp)} (${el}).`,
      evidence: docEvidence('html', `LCP ${ms(lcp)}`, 'at most 2.5s', { lcp_ms: lcp, lcp_element: el }),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument(
        'html',
        `Largest Contentful Paint at ${ms(lcp)} — ${el}`,
        'at most 2.5s on this connection',
        { lcp_ms: lcp, lcp_element: el, page_weight_kb: Math.round(v.value.weight.total / 1024), image_weight_kb: Math.round(v.value.weight.images / 1024) },
        { confidence: 0.9, rootCause: 'lcp', severity: lcp > 4000 ? 'high' : 'medium', fixVars: { lcp_element: el } },
      ),
    ],
    note: `Measured on a fast connection from a server nearby; real visitors will be slower, not faster.`,
  };
};

const PERF_002: Evaluator = (ctx) => {
  const ruleId = 'PERF-002';
  const v = vitals(ctx, ruleId);
  if (!v.ok) return v.outcome;
  const { cls, shifts } = v.value;
  if (cls <= 0.1) {
    return {
      ruleId,
      status: 'pass',
      checked: shifts,
      note: `Layout held still while loading (CLS ${cls}${shifts ? ` across ${plural(shifts, 'shift')}` : ''}).`,
      evidence: docEvidence('html', `CLS ${cls}`, 'at most 0.1', { cls, shifts }),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: shifts,
    instances: [
      atDocument(
        'html',
        `Cumulative Layout Shift of ${cls} across ${plural(shifts, 'shift')} while the page loaded`,
        'at most 0.1',
        { cls, shifts },
        { confidence: 0.9, rootCause: 'cls', severity: cls > 0.25 ? 'high' : 'medium' },
      ),
    ],
  };
};

const PERF_003: Evaluator = (ctx) => {
  const ruleId = 'PERF-003';
  const v = vitals(ctx, ruleId);
  if (!v.ok) return v.outcome;
  const { ttfb, load, weight } = v.value;
  if (ttfb == null) return notEvaluated(ruleId, 'Navigation timing was not available for this page.');
  const fields = { ttfb_ms: ttfb, load_ms: load ?? 0, page_weight_kb: Math.round(weight.total / 1024) };
  if (ttfb <= 800) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The server answered in ${ms(ttfb)}, and the page finished loading in ${ms(load ?? ttfb)} at ${kb(weight.total)}.`,
      evidence: docEvidence('html', `TTFB ${ms(ttfb)}`, 'at most 800ms', fields),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument('html', `The server took ${ms(ttfb)} to send the first byte`, 'at most 800ms', fields, {
        confidence: 0.88,
        rootCause: 'ttfb',
        severity: ttfb > 1800 ? 'high' : 'medium',
      }),
    ],
  };
};

const PERF_004: Evaluator = (ctx) => {
  const ruleId = 'PERF-004';
  const v = vitals(ctx, ruleId);
  if (!v.ok) return v.outcome;
  const imgs = v.value.images;
  if (!imgs.length) return notApplicable(ruleId, 'No images on the page.');
  const instances: Instance[] = [];
  for (const img of imgs) {
    const oversized = img.renderedWidth > 0 && img.naturalWidth > img.renderedWidth * 2 && img.bytes > 50_000;
    const unsized = !img.sized && img.inView;
    const eager = !img.lazy && !img.inView;
    if (!oversized && !unsized && !eager) continue;
    const problems = [
      oversized && `served at ${img.naturalWidth}px wide for a ${img.renderedWidth}px slot (${kb(img.bytes)})`,
      unsized && 'no width and height, so the page moves when it arrives',
      eager && 'below the fold but loaded immediately',
    ].filter(Boolean) as string[];
    const inst = atElement(
      { selector: img.selector, box: img.box },
      `Image ${problems.join('; ')}`,
      'images sized in the markup, served near the size they are drawn, and lazy-loaded below the fold',
      { image_src: img.src, natural_width: img.naturalWidth, rendered_width: img.renderedWidth, bytes: img.bytes, lazy: img.lazy, sized: img.sized },
      { confidence: 0.86, rootCause: oversized ? 'oversized-images' : unsized ? 'unsized-images' : 'eager-images', severity: oversized ? 'medium' : 'low' },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: imgs.length };
  return {
    ruleId,
    status: 'pass',
    checked: imgs.length,
    note: `${plural(imgs.length, 'image')} are sized in the markup and served close to the size they are drawn.`,
    evidence: elEvidence({ selector: imgs[0].selector, box: imgs[0].box }, `${imgs[0].naturalWidth}px served for ${imgs[0].renderedWidth}px`, 'sized and sensibly scaled', {
      image_src: imgs[0].src,
    }),
  };
};

const PERF_005: Evaluator = (ctx) => {
  const ruleId = 'PERF-005';
  if (!ctx.measured) return notEvaluated(ruleId, ctx.noBrowser ?? 'No browser was available to render the page.');
  const l = ctx.measured.links;
  if (!l.ok) return notEvaluated(ruleId, `The page's links could not be followed: ${l.error}`);
  const checked = l.value.filter((x) => x.status != null);
  if (!checked.length) return notEvaluated(ruleId, 'None of the links on the page could be followed from this server.');
  const broken = checked.filter((x) => (x.status ?? 0) >= 400);
  if (!broken.length) {
    return {
      ruleId,
      status: 'pass',
      checked: checked.length,
      note: `${plural(checked.length, 'link')} were followed and all of them resolved.`,
      evidence: docEvidence('a[href]', `${checked.length} links resolve`, 'no link returns an error', { links_checked: checked.length }),
    };
  }
  const instances = broken
    .map((b) =>
      atElement({ selector: b.selector, box: b.box }, `"${b.text || b.href}" returns HTTP ${b.status}`, 'a link that resolves', { href: b.href, status: b.status ?? 0 }, {
        confidence: 0.95,
        rootCause: 'broken-links',
        severity: b.inView ? 'high' : 'medium',
      }),
    )
    .filter((x): x is Instance => !!x);
  if (!instances.length) {
    return {
      ruleId,
      status: 'fail',
      checked: checked.length,
      instances: [
        atDocument(
          'a[href]',
          `${plural(broken.length, 'link')} return an error, e.g. "${broken[0].text || broken[0].href}" → HTTP ${broken[0].status}`,
          'no link returns an error',
          { broken_links: broken.slice(0, 8).map((b) => `${b.href} → ${b.status}`), links_checked: checked.length },
          { confidence: 0.95, rootCause: 'broken-links', severity: 'medium' },
        ),
      ],
    };
  }
  return { ruleId, status: 'fail', instances, checked: checked.length, note: `${checked.length} of the page's links were followed.` };
};

const PERF_006: Evaluator = (ctx) => {
  const ruleId = 'PERF-006';
  const t = tech(ctx, ruleId);
  if (!t.ok) return t.outcome;
  const v = vitals(ctx, ruleId);
  const insecure = v.ok ? v.value.insecure : [];
  if (!t.value.https) {
    return {
      ruleId,
      status: 'fail',
      checked: 1,
      instances: [
        atDocument('html', `The page is served over plain HTTP (${t.value.url})`, 'HTTPS, with no insecure sub-resources', { scheme: 'http', insecure_resources: insecure.length }, {
          confidence: 0.99,
          rootCause: 'no-https',
          severity: 'critical',
        }),
      ],
    };
  }
  if (insecure.length) {
    return {
      ruleId,
      status: 'fail',
      checked: insecure.length,
      instances: [
        atDocument(
          'html',
          `${plural(insecure.length, 'sub-resource')} loaded over plain HTTP on an HTTPS page, e.g. ${insecure[0]}`,
          'every sub-resource over HTTPS',
          { scheme: 'https', insecure_resources: insecure.slice(0, 6) },
          { confidence: 0.95, rootCause: 'mixed-content', severity: 'high' },
        ),
      ],
    };
  }
  return {
    ruleId,
    status: 'pass',
    checked: 1,
    note: 'The page and everything it loads come over HTTPS.',
    evidence: docEvidence('html', 'HTTPS with no mixed content', 'HTTPS throughout', { scheme: 'https', insecure_resources: 0 }),
  };
};

const PERF_007: Evaluator = (ctx) => {
  const ruleId = 'PERF-007';
  const t = tech(ctx, ruleId);
  if (!t.ok) return t.outcome;
  const d = t.value;
  const missing = [
    !d.title && 'no <title>',
    d.title && d.title.length < 10 && `a title of only ${d.title.length} characters`,
    !d.description && 'no meta description',
    d.description && (d.description.length < 50 || d.description.length > 160) && `a meta description of ${d.description.length} characters`,
    !d.canonical && 'no canonical URL',
    !d.ogTitle && 'no Open Graph title for sharing',
  ].filter(Boolean) as string[];
  const fields = {
    title: d.title ?? 'missing',
    description: d.description ?? 'missing',
    canonical: d.canonical ?? 'missing',
    og_title: d.ogTitle ?? 'missing',
  };
  if (!missing.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 4,
      note: `The page carries a title, a ${d.description!.length}-character description, a canonical URL and sharing metadata.`,
      evidence: docEvidence('head', 'title, description, canonical and Open Graph present', 'complete page metadata', fields),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 4,
    instances: [
      atDocument('head', `The page has ${missing.join(', ')}`, 'a title, a 50–160 character description, a canonical URL and an Open Graph title', fields, {
        confidence: 0.92,
        rootCause: 'metadata',
        severity: missing.length >= 3 ? 'medium' : 'low',
      }),
    ],
  };
};

const PERF_008: Evaluator = (ctx) => {
  const ruleId = 'PERF-008';
  if (!ctx.measured) return notEvaluated(ruleId, ctx.noBrowser ?? 'No browser was available to render the page.');
  const r = ctx.measured.reflow;
  if (!r.ok) return notEvaluated(ruleId, `The page could not be re-rendered at 320px: ${r.error}`);
  const { overflow, width, capture } = r.value;
  if (!overflow.offenders.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `At ${width}px the page fits its width, with nothing spilling sideways.`,
      evidence: docEvidence('html', `no horizontal overflow at ${width}px`, 'content fits the viewport width', { viewport_width: width, overflow_px: overflow.overflowBy }),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument(
        'html',
        `At ${width}px the page is ${overflow.overflowBy}px wider than the screen; ${overflow.offenders.map((o) => `"${o.text}"`).slice(0, 3).join(', ')} stick out`,
        'content fits the viewport width at 320px',
        {
          viewport_width: width,
          overflow_px: overflow.overflowBy,
          offenders: overflow.offenders.map((o) => `${o.selector} (right edge ${o.right}px)`),
          ...(capture ? { reflow_capture: capture } : {}),
        },
        {
          confidence: 0.93,
          rootCause: 'reflow',
          severity: overflow.overflowBy > 80 ? 'high' : 'medium',
          fixVars: { offenders: overflow.offenders.map((o) => o.selector).slice(0, 3).join(', ') },
        },
      ),
    ],
  };
};

/* ====================================================== navigation */

const NAV_001: Evaluator = (ctx) => {
  const ruleId = 'NAV-001';
  const t = tech(ctx, ruleId);
  if (!t.ok) return t.outcome;
  const d = t.value;
  if (d.depth < 3) return notApplicable(ruleId, `This page is ${d.depth} ${d.depth === 1 ? 'level' : 'levels'} into the site, which is not deep enough to need a breadcrumb trail.`);
  if (d.breadcrumb.present) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `A breadcrumb trail of ${plural(d.breadcrumb.items, 'step')} shows the way back up.`,
      evidence: docEvidence(d.breadcrumb.selector ?? 'nav', `breadcrumb with ${d.breadcrumb.items} items`, 'a breadcrumb trail', { depth: d.depth }),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument('body', `This page is ${d.depth} levels deep (${new URL(d.url).pathname}) with no breadcrumb trail`, 'a breadcrumb trail on pages three or more levels deep', { depth: d.depth }, {
        confidence: 0.85,
        rootCause: 'breadcrumbs',
        severity: 'medium',
      }),
    ],
  };
};

const NAV_002: Evaluator = (ctx) => {
  const ruleId = 'NAV-002';
  const t = tech(ctx, ruleId);
  if (!t.ok) return t.outcome;
  const f = facts(ctx, ruleId);
  const d = t.value;
  if (d.nav.present) {
    return {
      ruleId,
      status: 'pass',
      checked: d.nav.landmarks,
      note: `Navigation with ${plural(d.nav.links, 'destination')} is marked up as a navigation region.`,
      evidence: docEvidence(d.nav.selector ?? 'nav', `${d.nav.links} destinations in a <nav>`, 'a navigation region', { nav_links: d.nav.links, nav_landmarks: d.nav.landmarks }),
    };
  }
  const links = f.ok ? f.value.navLinkMax : 0;
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument(
        'body',
        links >= 2 ? `Links sit in the header but no region is marked up as navigation` : 'The page offers no navigation region',
        'a <nav> landmark holding the primary destinations',
        { nav_links: links, nav_landmarks: d.nav.landmarks },
        { confidence: 0.85, rootCause: 'no-nav', severity: links >= 2 ? 'medium' : 'high' },
      ),
    ],
  };
};

/* =========================================================== trust */

const TRUST_001: Evaluator = (ctx) => {
  const ruleId = 'TRUST-001';
  const t = tech(ctx, ruleId);
  if (!t.ok) return t.outcome;
  const c = t.value.consent;
  if (!c) return notApplicable(ruleId, 'No consent or cookie dialog appeared on this page.');
  if (c.decline.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The consent notice offers "${c.decline[0]}" alongside "${c.accept[0] ?? 'accept'}".`,
      evidence: elEvidence({ selector: c.selector!, box: c.box! }, `decline: ${c.decline.join(', ')}`, 'a decline as reachable as the accept', { accept: c.accept, decline: c.decline }),
    };
  }
  const inst = c.box
    ? atElement(
        { selector: c.selector!, box: c.box },
        `The consent notice offers ${c.accept.length ? `"${c.accept[0]}"` : 'an accept'} with no way to decline`,
        'a decline as reachable as the accept',
        { accept: c.accept, decline: [], notice_text: c.text },
        { confidence: 0.86, rootCause: 'consent', severity: 'high' },
      )
    : null;
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: 1 } : notEvaluated(ruleId, 'The consent notice is outside the first screen.');
};

const TRUST_002: Evaluator = (ctx) => {
  const ruleId = 'TRUST-002';
  const t = tech(ctx, ruleId);
  if (!t.ok) return t.outcome;
  const forms = t.value.credentials;
  if (!forms.length) return notApplicable(ruleId, 'This page collects no passwords or payment details.');
  const insecure = forms.filter((f) => !f.secure);
  if (!insecure.length) {
    return {
      ruleId,
      status: 'pass',
      checked: forms.length,
      note: `${plural(forms.length, 'form')} collecting ${forms[0].kinds.join(' and ')} post to a secure endpoint.`,
      evidence: elEvidence({ selector: forms[0].form, box: forms[0].box }, `posts to ${forms[0].action}`, 'an HTTPS endpoint', { kinds: forms[0].kinds, action: forms[0].action }),
    };
  }
  const instances = insecure
    .map((f) =>
      atElement({ selector: f.form, box: f.box }, `A form collecting ${f.kinds.join(' and ')} posts to ${f.action}`, 'an HTTPS page posting to an HTTPS endpoint', {
        kinds: f.kinds,
        action: f.action,
      }, { confidence: 0.97, rootCause: 'insecure-credentials', severity: 'critical' }),
    )
    .filter((x): x is Instance => !!x);
  return instances.length ? { ruleId, status: 'fail', instances, checked: forms.length } : notEvaluated(ruleId, 'The form is outside the first screen.');
};

/* ====================================================== conversion */

const CONV_001: Evaluator = (ctx) => {
  const ruleId = 'CONV-001';
  const t = tech(ctx, ruleId);
  if (!t.ok) return t.outcome;
  const v = t.value.valueProp;
  const missing = [!v.headline && 'a headline', !v.support && 'a supporting line', !v.action && 'an action'].filter(Boolean) as string[];
  const fields = { headline: v.headline ?? 'none', supporting_line: v.support ?? 'none', action: v.action ?? 'none' };
  if (!missing.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 3,
      note: `The first screen makes its case: "${v.headline}", a supporting line, and "${v.action}".`,
      evidence: v.headlineBox
        ? elEvidence({ selector: 'h1', box: v.headlineBox }, `headline, supporting line and "${v.action}"`, 'a complete value proposition', fields)
        : docEvidence('body', 'headline, supporting line and action', 'a complete value proposition', fields),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 3,
    instances: [
      atDocument('body', `The first screen is missing ${missing.join(' and ')}`, 'a headline, a supporting line and an action without scrolling', fields, {
        confidence: 0.84,
        rootCause: 'value-prop',
        severity: missing.length > 1 ? 'high' : 'medium',
      }),
    ],
  };
};

const CONV_002: Evaluator = (ctx) => {
  const ruleId = 'CONV-002';
  const t = tech(ctx, ruleId);
  if (!t.ok) return t.outcome;
  const proof = t.value.socialProof;
  if (proof.length) {
    return {
      ruleId,
      status: 'pass',
      checked: proof.length,
      note: `The page carries ${proof.map((p) => p.kind).filter((k, i, a) => a.indexOf(k) === i).join(', ')} — e.g. "${proof[0].text}".`,
      evidence: elEvidence(proof[0], proof[0].text, 'evidence from someone other than the product', { proof_kind: proof[0].kind }),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 0,
    instances: [
      atDocument('body', 'No customer count, rating, testimonial, certification or customer logos were found on the page', 'proof from someone other than the product', { proof_kind: 'none' }, {
        confidence: 0.75,
        rootCause: 'social-proof',
        severity: 'low',
      }),
    ],
  };
};

export const TECH_EVALUATORS: Record<string, Evaluator> = {
  'PERF-001': PERF_001,
  'PERF-002': PERF_002,
  'PERF-003': PERF_003,
  'PERF-004': PERF_004,
  'PERF-005': PERF_005,
  'PERF-006': PERF_006,
  'PERF-007': PERF_007,
  'PERF-008': PERF_008,
  'NAV-001': NAV_001,
  'NAV-002': NAV_002,
  'TRUST-001': TRUST_001,
  'TRUST-002': TRUST_002,
  'CONV-001': CONV_001,
  'CONV-002': CONV_002,
};
