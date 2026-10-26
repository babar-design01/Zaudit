import type { MobileProbe } from '../browser';
import type { Instance, RuleOutcome } from '../contract';
import { atDocument, docEvidence, type Evaluator, type Need, type RuleContext } from './acc';

/**
 * The Mobile family.
 *
 * Every check here reads the second visit — 390×844, touch on, mobile user
 * agent — so what it judges is the page the phone was served, not the desktop
 * page in a narrow window. Findings are document-level: their boxes are in the
 * phone's coordinate space and would land in the wrong place on the desktop
 * screenshot, so the phone capture travels with the evidence instead.
 */

const notEvaluated = (ruleId: string, reason: string): RuleOutcome => ({ ruleId, status: 'not_evaluated', reason });
const notApplicable = (ruleId: string, reason: string): RuleOutcome => ({ ruleId, status: 'not_applicable', reason });

/** Thumb-sized, as Apple and Material both put it. */
const MIN_TARGET = 44;
/** WCAG 2.2 AA's own floor: below this, no amount of spacing compensates. */
const WCAG_FLOOR = 24;
/** The clear space Material asks for between two touch targets. */
const MIN_GAP = 8;
/** Below this, Safari on iOS zooms the page in when the field takes focus. */
const NO_ZOOM_FONT = 16;
/** The floor for a run of body copy on a phone. */
const MIN_BODY = 14;

function phone(ctx: RuleContext, ruleId: string): Need<MobileProbe> {
  if (!ctx.measured) return { ok: false, outcome: notEvaluated(ruleId, ctx.noBrowser ?? 'No browser was available to render the page.') };
  const m = ctx.measured.mobile;
  if (!m.ok) return { ok: false, outcome: notEvaluated(ruleId, `The page could not be opened at phone size: ${m.error}`) };
  return { ok: true, value: m.value };
}

/** The phone capture, as an evidence field, so a finding can be seen. */
const shot = (p: MobileProbe): Record<string, string> => (p.capture ? { mobile_capture: p.capture } : {});

const listOf = (xs: string[], n = 3) => xs.slice(0, n).map((s) => `"${s}"`).join(', ');

/* ----------------------------------------------------- MOB-001 tap targets */

const MOB_001: Evaluator = (ctx) => {
  const ruleId = 'MOB-001';
  const need = phone(ctx, ruleId);
  if (!need.ok) return need.outcome;
  const p = need.value;

  const judged = p.facts.targets.filter((t) => !t.inlineInProse);
  if (!judged.length) return notApplicable(ruleId, 'No controls were on the first screen at phone size.');

  // WCAG 2.5.8 treats clear space as an alternative to size, not an extra
  // demand: a 32px control with room around it is a reachable target, while
  // two 32px controls jammed together are not. Below the 24px floor nothing
  // compensates. Two full-size targets touching — a segmented control, a nav
  // row — are deliberate and pass.
  const small = judged.filter((t) => {
    const min = Math.min(t.box.w, t.box.h);
    if (min < WCAG_FLOOR) return true;
    return min < MIN_TARGET && (t.gap ?? 99) < MIN_GAP;
  });
  if (!small.length) {
    return {
      ruleId,
      status: 'pass',
      checked: judged.length,
      note: `All ${judged.length} controls on the phone's first screen are either ${MIN_TARGET}×${MIN_TARGET}px or larger, or above the ${WCAG_FLOOR}px floor with ${MIN_GAP}px of clear space around them.`,
      evidence: docEvidence('html', `${judged.length} controls measured at ${p.viewport.width}px, smallest ${Math.min(...judged.map((t) => Math.min(t.box.w, t.box.h)))}px`, `every target at least ${MIN_TARGET}×${MIN_TARGET}px`, {
        required_size: `${MIN_TARGET}×${MIN_TARGET}px`,
      }),
    };
  }

  const worst = small.reduce((a, b) => (Math.min(a.box.w, a.box.h) <= Math.min(b.box.w, b.box.h) ? a : b));
  const instances: Instance[] = [
    atDocument(
      worst.selector,
      `${small.length} of ${judged.length} controls are too small to hit on a phone; the smallest is ${worst.box.w}×${worst.box.h}px with ${worst.gap ?? 0}px of clear space (${listOf(small.map((t) => t.text || t.selector))})`,
      `every target at least ${MIN_TARGET}×${MIN_TARGET}px of hit area`,
      {
        target_size: `${worst.box.w}×${worst.box.h}px`,
        clear_space: `${worst.gap ?? 0}px`,
        required_size: `${MIN_TARGET}×${MIN_TARGET}px`,
        selectors: small.slice(0, 8).map((t) => `${t.selector} (${t.box.w}×${t.box.h}px, ${t.gap ?? 0}px clear)`),
        ...shot(p),
      },
      {
        confidence: 0.95,
        rootCause: 'touch-target-size',
        severity: small.length > judged.length / 2 ? 'high' : 'medium',
      },
    ),
  ];
  return { ruleId, status: 'fail', checked: judged.length, instances };
};

/* ------------------------------------------------------ MOB-003 navigation */

const MOB_003: Evaluator = (ctx) => {
  const ruleId = 'MOB-003';
  const need = phone(ctx, ruleId);
  if (!need.ok) return need.outcome;
  const p = need.value;
  const nav = p.facts.nav;

  if (!nav.present) return notApplicable(ruleId, 'The page has no navigation region to collapse.');

  if (nav.menuControl) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The navigation collapses behind "${nav.menuControl.text || nav.menuControl.selector}" at phone width.`,
      evidence: docEvidence(nav.menuControl.selector, `a menu control is present at ${p.viewport.width}px`, 'the primary navigation collapses on a phone'),
    };
  }

  const crowdedRow = nav.visibleLinks >= 6;
  if (!nav.overflows && !crowdedRow) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The navigation shows ${nav.visibleLinks} link${nav.visibleLinks === 1 ? '' : 's'} at phone width and fits the screen.`,
      evidence: docEvidence('nav', `${nav.visibleLinks} links, no horizontal overflow at ${p.viewport.width}px`, 'navigation that fits the screen or collapses'),
    };
  }

  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument(
        'nav',
        nav.overflows
          ? `At ${p.viewport.width}px the navigation lays out wider than the screen, with ${nav.visibleLinks} links and no control to collapse it`
          : `At ${p.viewport.width}px the navigation shows ${nav.visibleLinks} links in a row with no control to collapse it`,
        'the primary navigation collapses behind a labelled menu control on a phone',
        {
          visible_links: nav.visibleLinks,
          nav_overflows: nav.overflows,
          ...shot(p),
        },
        { confidence: 0.88, rootCause: 'mobile-nav', severity: nav.overflows ? 'high' : 'medium' },
      ),
    ],
  };
};

/* ----------------------------------------------------- MOB-004 pinned bars */

const MOB_004: Evaluator = (ctx) => {
  const ruleId = 'MOB-004';
  const need = phone(ctx, ruleId);
  if (!need.ok) return need.outcome;
  const p = need.value;
  const bars = p.facts.pinned.filter((b) => b.edge !== 'other');
  const share = p.facts.pinnedShare;

  if (!bars.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: 'Nothing is pinned over the content at phone size.',
      evidence: docEvidence('html', 'no fixed or sticky bars on the first screen', 'the screen belongs to the content'),
    };
  }

  if (share <= 0.3) {
    return {
      ruleId,
      status: 'pass',
      checked: bars.length,
      note: `${bars.length} pinned bar${bars.length === 1 ? '' : 's'} cover ${Math.round(share * 100)}% of the phone screen.`,
      evidence: docEvidence(bars[0].selector, `${Math.round(share * 100)}% of the viewport covered`, 'no more than 30% of the screen pinned'),
    };
  }

  return {
    ruleId,
    status: 'fail',
    checked: bars.length,
    instances: [
      atDocument(
        bars[0].selector,
        `${bars.length} pinned bar${bars.length === 1 ? '' : 's'} cover ${Math.round(share * 100)}% of the phone screen (${bars.map((b) => `${b.edge} ${Math.round(b.share * 100)}%`).join(', ')})`,
        'no more than 30% of the screen given to pinned furniture',
        {
          covered_share: `${Math.round(share * 100)}%`,
          bars: bars.map((b) => `${b.selector} — ${b.edge}, ${Math.round(b.share * 100)}% of the screen`),
          ...shot(p),
        },
        { confidence: 0.9, rootCause: 'pinned-chrome', severity: share > 0.45 ? 'high' : 'medium' },
      ),
    ],
  };
};

/* ------------------------------------------------------ MOB-005 field zoom */

const MOB_005: Evaluator = (ctx) => {
  const ruleId = 'MOB-005';
  const need = phone(ctx, ruleId);
  if (!need.ok) return need.outcome;
  const p = need.value;
  const fields = p.facts.smallFields;

  if (!p.facts.targets.some((t) => ['input', 'select', 'textarea'].includes(t.tag))) {
    return notApplicable(ruleId, 'The first screen has no text fields at phone size.');
  }
  if (!fields.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `Every field on the phone's first screen is set at ${NO_ZOOM_FONT}px or more, so focusing one does not zoom the page.`,
      evidence: docEvidence('input', `all fields at ${NO_ZOOM_FONT}px or above`, 'fields that do not trigger the iOS zoom'),
    };
  }

  const worst = fields.reduce((a, b) => (a.px <= b.px ? a : b));
  return {
    ruleId,
    status: 'fail',
    checked: fields.length,
    instances: [
      atDocument(
        worst.selector,
        `${fields.length} field${fields.length === 1 ? '' : 's'} are set below ${NO_ZOOM_FONT}px (smallest ${worst.px}px), so iOS zooms the page in when one takes focus`,
        `every text field at ${NO_ZOOM_FONT}px or more`,
        {
          font_px: `${worst.px}px`,
          selectors: fields.slice(0, 8).map((f) => `${f.selector} (${f.type}, ${f.px}px)`),
          ...shot(p),
        },
        { confidence: 0.97, rootCause: 'ios-input-zoom' },
      ),
    ],
  };
};

/* -------------------------------------------------------- MOB-006 legibility */

const MOB_006: Evaluator = (ctx) => {
  const ruleId = 'MOB-006';
  const need = phone(ctx, ruleId);
  if (!need.ok) return need.outcome;
  const p = need.value;
  const small = p.facts.smallText;

  if (!small.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `Every run of body copy on the phone's first screen is at least ${MIN_BODY}px.`,
      evidence: docEvidence('body', `no body text below ${MIN_BODY}px at ${p.viewport.width}px`, `body copy at ${MIN_BODY}px or more`),
    };
  }

  const worst = small[0];
  return {
    ruleId,
    status: 'fail',
    checked: small.length,
    instances: [
      atDocument(
        worst.selector,
        `${small.length} run${small.length === 1 ? '' : 's'} of body copy ${small.length === 1 ? 'sits' : 'sit'} below ${MIN_BODY}px on a phone; the longest is ${worst.px}px — "${worst.text.slice(0, 60)}"`,
        `body copy at ${MIN_BODY}px or more on a phone`,
        {
          font_px: `${worst.px}px`,
          sample: worst.text.slice(0, 120),
          selectors: small.slice(0, 8).map((t) => `${t.selector} (${t.px}px, ${t.chars} characters)`),
          ...shot(p),
        },
        { confidence: 0.93, rootCause: 'mobile-type-size' },
      ),
    ],
  };
};

/* --------------------------------------------------------- MOB-007 overflow */

const MOB_007: Evaluator = (ctx) => {
  const ruleId = 'MOB-007';
  const need = phone(ctx, ruleId);
  if (!need.ok) return need.outcome;
  const p = need.value;
  const { overflow } = p;

  if (!overflow.offenders.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `At ${p.viewport.width}px the page fits its width, with nothing spilling sideways.`,
      evidence: docEvidence('html', `no horizontal overflow at ${p.viewport.width}px`, 'content fits the phone screen', {
        viewport_width: p.viewport.width,
        overflow_px: overflow.overflowBy,
      }),
    };
  }

  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument(
        'html',
        `On a phone the page is ${overflow.overflowBy}px wider than the screen; ${listOf(overflow.offenders.map((o) => o.text || o.selector))} stick out`,
        'content fits the phone screen',
        {
          viewport_width: p.viewport.width,
          overflow_px: overflow.overflowBy,
          offenders: overflow.offenders.slice(0, 8).map((o) => `${o.selector} (right edge ${o.right}px)`),
          ...shot(p),
        },
        {
          confidence: 0.93,
          rootCause: 'reflow',
          severity: overflow.overflowBy > 60 ? 'high' : 'medium',
          fixVars: { offenders: overflow.offenders.slice(0, 3).map((o) => o.selector).join(', ') },
        },
      ),
    ],
  };
};

export const MOBILE_EVALUATORS: Record<string, Evaluator> = {
  'MOB-001': MOB_001,
  'MOB-003': MOB_003,
  'MOB-004': MOB_004,
  'MOB-005': MOB_005,
  'MOB-006': MOB_006,
  'MOB-007': MOB_007,
};
