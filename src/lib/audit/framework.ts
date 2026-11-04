/**
 * The audit benchmark framework: Pillars → Criteria → Evidence → Score.
 *
 * A pillar is a dimension being judged. A criterion is a checkable statement
 * carrying the standard it comes from, the platforms it applies to, and whether
 * it can be measured or needs a person. Evidence is what the engine saw. The
 * score is per criterion, rolled up to the pillar, then weighted by the goal the
 * user declared before the audit started.
 *
 * The goal never changes the criteria — only their weight, and which optional
 * pillars switch on.
 */

/* ---------------------------------------------------------------- platform */

export const PLATFORMS = ['web', 'webapp', 'ios', 'android', 'desktop'] as const;
export type Platform = (typeof PLATFORMS)[number];

/* ------------------------------------------------------------------ method */

/**
 * How a criterion can be judged. `auto` is measured outright; `assisted` is
 * measured and then read (a model or a person judges the wording or intent);
 * `manual` needs a person to work the product.
 */
export type Method = 'auto' | 'assisted' | 'manual';

export const METHOD_LABEL: Record<Method, string> = {
  auto: 'Measured',
  assisted: 'Measured, then judged',
  manual: 'Needs a reviewer',
};

/* ----------------------------------------------------------------- verdict */

export type Verdict = 'pass' | 'partial' | 'fail' | 'not_applicable' | 'not_assessed';

export const VERDICT_LABEL: Record<Verdict, string> = {
  pass: 'Pass',
  partial: 'Partial',
  fail: 'Fail',
  not_applicable: 'Not applicable',
  not_assessed: 'Not assessed',
};

/* ---------------------------------------------------------------- severity */

/** Nielsen's 0–4 severity scale, applied to every failure. */
export type Severity = 0 | 1 | 2 | 3 | 4;

export const SEVERITY_NAME: Record<Severity, string> = {
  4: 'Critical',
  3: 'Major',
  2: 'Minor',
  1: 'Cosmetic',
  0: 'Not a problem',
};

export const SEVERITY_MEANING: Record<Severity, string> = {
  4: 'Blocks a task or shuts people out',
  3: 'Significant friction; people get through, slowly or wrongly',
  2: 'Minor problem; fix when convenient',
  1: 'Cosmetic; fix if time allows',
  0: 'Not a usability problem',
};

/* ----------------------------------------------------------------- pillars */

export type PillarId = 'usability' | 'ia' | 'hierarchy' | 'consistency' | 'states' | 'accessibility' | 'content' | 'performance' | 'technical' | 'trust' | 'conversion';

export type PillarDef = {
  id: PillarId;
  name: string;
  /** What this pillar judges, in one line a client can read. */
  question: string;
  /** The standards and practice the criteria are drawn from. */
  standards: string[];
  /** Optional pillars are switches, not defaults: they depend on the product. */
  optional?: boolean;
};

/* ---------------------------------------------------------------- criteria */

export type CriterionDef = {
  /** Stable and quotable in a report: `AC-01`, `US-03`. */
  id: string;
  pillar: PillarId;
  name: string;
  /** The pass condition, written so a failure can be argued from it. */
  passCondition: string;
  /** Where the criterion comes from — a WCAG success criterion, a heuristic, a metric. */
  standard: string;
  appliesTo: Platform[];
  method: Method;
  /** Severity of a failure before the engine adjusts it for what it measured. */
  severityBase: Severity;
  /** The measurements behind it. Empty means there is nothing to measure yet. */
  checks: string[];
  /** Why it matters, in business terms rather than standards language. */
  why: string;
  /** What a reviewer has to do when the criterion cannot be measured. */
  reviewerTask?: string;
};

/* -------------------------------------------------------------------- goals */

export type GoalId = 'accessible' | 'conversion' | 'redesign' | 'support' | 'prelaunch' | 'health';

export type GoalDef = {
  id: GoalId;
  name: string;
  /** What the audit will lean on, for the person choosing. */
  blurb: string;
  /** Pillars weighted above the rest. */
  heavier: PillarId[];
  /** Optional pillars switched on by this goal. */
  toggles: PillarId[];
};

export const GOALS: GoalDef[] = [
  {
    id: 'accessible',
    name: 'Make it accessible',
    blurb: 'Weighted towards accessibility, content and system states — the work that gets a product usable by everyone.',
    heavier: ['accessibility', 'content', 'states'],
    toggles: [],
  },
  {
    id: 'conversion',
    name: 'Improve conversion',
    blurb: 'Weighted towards usability, content, visual hierarchy and performance, with the conversion pillar switched on.',
    heavier: ['usability', 'content', 'hierarchy', 'performance'],
    toggles: ['conversion'],
  },
  {
    id: 'redesign',
    name: 'Redesign or modernise',
    blurb: 'Weighted towards visual hierarchy, consistency and content — what a redesign is judged on.',
    heavier: ['hierarchy', 'consistency', 'content'],
    toggles: [],
  },
  {
    id: 'support',
    name: 'Reduce support tickets',
    blurb: 'Weighted towards usability, navigation, system states and content — where confusion turns into tickets.',
    heavier: ['usability', 'ia', 'states', 'content'],
    toggles: [],
  },
  {
    id: 'prelaunch',
    name: 'Pre-launch QA',
    blurb: 'Weighted towards states, consistency, accessibility and performance, with trust and technical quality switched on.',
    heavier: ['states', 'consistency', 'accessibility', 'performance'],
    toggles: ['trust', 'technical'],
  },
  {
    id: 'health',
    name: 'General health check',
    blurb: 'Equal weight on the eight design pillars. The default when no particular goal has been set.',
    heavier: [],
    toggles: [],
  },
];

export const DEFAULT_GOAL: GoalId = 'health';

/** What an audit is actually weighted for: one goal, or several taken together. */
export type AuditGoal = Omit<GoalDef, 'id'> & { id: string; ids: GoalId[] };

/**
 * Several goals weigh what any of them weighs, and switch on what any of them
 * switches on. The health check is equal weight on everything, which nothing can
 * be combined with, so it only stands when it is alone. Anything unrecognised is
 * dropped, which is what lets this take a request's body as it came.
 */
export function combineGoals(asked: readonly unknown[]): AuditGoal {
  const specific = GOALS.filter((g) => g.id !== DEFAULT_GOAL && asked.includes(g.id));
  const goals = specific.length ? specific : GOALS.filter((g) => g.id === DEFAULT_GOAL);
  return {
    id: goals.map((g) => g.id).join('+'),
    ids: goals.map((g) => g.id),
    name: goals.map((g) => g.name).join(' + '),
    blurb: goals.map((g) => g.blurb).join(' '),
    heavier: [...new Set(goals.flatMap((g) => g.heavier))],
    toggles: [...new Set(goals.flatMap((g) => g.toggles))],
  };
}

/** One press on a goal in a picker. There is always at least one goal chosen. */
export function toggleGoal(current: readonly GoalId[], id: GoalId): GoalId[] {
  if (id === DEFAULT_GOAL) return [DEFAULT_GOAL];
  const next = current.includes(id) ? current.filter((g) => g !== id) : [...current.filter((g) => g !== DEFAULT_GOAL), id];
  return next.length ? next : [DEFAULT_GOAL];
}

/** The weight each pillar carries for a goal. A heavier pillar counts double. */
export function weightsFor(goal: Pick<GoalDef, 'heavier' | 'toggles'>, pillars: PillarDef[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of pillars) {
    if (p.optional && !goal.toggles.includes(p.id)) continue;
    out[p.id] = goal.heavier.includes(p.id) ? 2 : 1;
  }
  return out;
}

/* ------------------------------------------------------------------- bands */

export type Band = 'Poor' | 'Fair' | 'Good' | 'Excellent';

export function band(score: number): Band {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

/**
 * A pillar's score: the share of its assessed criteria that passed, with a
 * partial counting half. Criteria that did not apply, or could not be assessed,
 * are left out of both sides of the fraction rather than counted as passes.
 */
export function passRate(verdicts: Verdict[]): number | null {
  const counted = verdicts.filter((v) => v === 'pass' || v === 'partial' || v === 'fail');
  if (!counted.length) return null;
  const earned = counted.reduce((a, v) => a + (v === 'pass' ? 1 : v === 'partial' ? 0.5 : 0), 0);
  return Math.round((earned / counted.length) * 100);
}
