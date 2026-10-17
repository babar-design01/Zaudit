/**
 * ZEEUXSNIFF AUDIT ENGINE — CORE CONTRACT v1.0, as types.
 *
 * Everything the engine is allowed to say about a page has a shape here, and the
 * shapes carry the contract's guarantees rather than trusting code to remember
 * them: a finding cannot exist without evidence, a check that did not run
 * cannot report a pass, and the model layer can only annotate what the measured
 * layers produced.
 */

/* ----------------------------------------------------------------- layers */

/**
 * L1 produces measured facts (axe-core, Playwright DOM queries, computed
 * styles). L2 computes signals over those facts. An L3 rule is one whose
 * verdict turns on reading wording or intent: L1/L2 still find the candidate and
 * its evidence, but only the model's review can confirm it. The model never
 * creates a finding of its own.
 */
export type Layer = 'L1' | 'L2' | 'L3';

/* ------------------------------------------------------------- page types */

export const PAGE_TYPES = [
  'landing',
  'pricing',
  'checkout',
  'signup',
  'login',
  'product_detail',
  'listing',
  'dashboard',
  'settings',
  'blog_article',
  'docs',
  'contact',
  'onboarding',
  'empty_state',
  'error_page',
  'unknown',
] as const;

export type PageType = (typeof PAGE_TYPES)[number];

export type PageTypeResult = {
  type: PageType;
  /** 0–1. Below the classifier's threshold the page is treated as `unknown`. */
  confidence: number;
  /** Who decided: the model, the measured signals, or neither. */
  source: 'llm' | 'signals' | 'none';
  /** The measured facts the decision rests on, in words. */
  signals: string[];
  /** What the signals alone suggested, when the model overrode them. */
  signalsGuess?: { type: PageType; confidence: number };
};

/* --------------------------------------------------------------- severity */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

/** Points deducted, once per root cause, at the severity of its worst instance. */
export const SEVERITY_POINTS: Record<SeverityLevel, number> = {
  critical: 8,
  high: 5,
  medium: 2,
  low: 0.5,
};

export const SEVERITY_ORDER: SeverityLevel[] = ['critical', 'high', 'medium', 'low'];

export function worse(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  return SEVERITY_ORDER.indexOf(a) <= SEVERITY_ORDER.indexOf(b) ? a : b;
}

/** Effort is its own axis. It is never folded into severity. */
export type Effort = 'trivial' | 'small' | 'medium' | 'large';

/* ------------------------------------------------------------- confidence */

/** Findings below their rule's floor go to human review and deduct nothing. */
export const DEFAULT_CONFIDENCE_FLOOR = 0.75;

/* ---------------------------------------------------------------- viewport */

/**
 * The captured viewport. Nothing outside it is ever flagged: a finding whose
 * evidence box does not land in this rectangle is discarded, not deferred.
 */
export const VIEWPORT = { width: 1440, height: 900 } as const;

/* ------------------------------------------------------------------- rules */

export type RuleDef = {
  id: string;
  family: string;
  name: string;
  layer: Layer;
  signal: string;
  threshold: string;
  /** `'all'`, or the page types this rule is allowed to evaluate on. */
  pageTypes: PageType[] | 'all';
  severityBase: SeverityLevel;
  confidenceFloor: number;
  effort: Effort;
  /** Conditions under which the rule must stay silent, in the catalog's words. */
  doNotFireWhen: string[];
  /** Evidence fields the catalog requires beyond the contract's five. */
  evidenceFields: string[];
  whyItMatters: string;
  /** The fix, with `{placeholders}` filled from the evidence. */
  fix: string;
  /** Subjective rules need `signalsRequired` (default 2) independent signals before they may fire. */
  subjective?: boolean;
  signalsRequired?: number;
};

export type Family = {
  id: string;
  prefix: string;
  name: string;
  /** The most points this family can cost the page. */
  weight: number;
  rules: RuleDef[];
};

/* ---------------------------------------------------------------- evidence */

/** [x, y, width, height] in CSS pixels on the viewport screenshot. */
export type BBox = [number, number, number, number];

export type EvidenceValue = string | number | boolean | null | string[] | number[];

/**
 * The contract's evidence record. Every field is required; a finding assembled
 * without one of them is discarded rather than shown with a gap.
 */
export type Evidence = {
  evidenceId: string;
  /** A CSS selector or DOM path to the element. */
  selector: string;
  /** Which capture the box is drawn on. */
  screenshotRef: string;
  bbox: BBox;
  observed: string;
  expected: string;
  /**
   * The finding is about the document rather than an element on it — a missing
   * `lang`, a viewport tag that blocks zoom. Its box is the whole first screen.
   */
  documentLevel: boolean;
  /** The rule-specific fields the catalog asks for, by the catalog's names. */
  fields: Record<string, EvidenceValue>;
};

/* ----------------------------------------------------------- rule outcomes */

/**
 * One occurrence a rule measured. It becomes part of a finding only after the
 * evidence contract, the viewport limit and the confidence floor have all been
 * applied to it.
 */
export type Instance = {
  evidence: Omit<Evidence, 'evidenceId' | 'screenshotRef'>;
  confidence: number;
  /** Instances sharing a root cause become one finding, deducted once. */
  rootCause: string;
  /** Defaults to the rule's base; a rule's own downgrade clause can lower it. */
  severity?: SeverityLevel;
  /** Values for the fix template's `{placeholders}`. */
  fixVars?: Record<string, string>;
  /** Independent signals behind a subjective rule's instance. */
  signals?: string[];
  /** Two rules describing the same defect on the same element share this. */
  defect?: string;
};

export type RuleOutcome =
  | { ruleId: string; status: 'fail'; instances: Instance[]; checked: number; note?: string }
  | {
      ruleId: string;
      status: 'pass';
      checked: number;
      /** What was measured and found sound, in a sentence. */
      note: string;
      /** A representative element for the "what is working" section. */
      evidence: Omit<Evidence, 'evidenceId' | 'screenshotRef'> | null;
    }
  /** The check could not run. Never reported as a pass. */
  | { ruleId: string; status: 'not_evaluated'; reason: string }
  /** The check ran and had nothing to look at, or the page type excludes it. */
  | { ruleId: string; status: 'not_applicable'; reason: string };

/* ---------------------------------------------------------------- findings */

export type FindingStatus = 'confirmed' | 'needs_human_review';

export type ContractFinding = {
  /** Stable within one audit: `<criterion>#<n>`. */
  id: string;
  /** The measurement behind it, for tracing a finding back to what produced it. */
  ruleId: string;
  /** The measurement's headline: what is wrong, in the report's title line. */
  checkName: string;
  /** The criterion it fails — what the report quotes. */
  criterionId: string;
  criterionName: string;
  /** What the criterion asks for, so the failure can be argued from it. */
  passCondition: string;
  /** The standard the criterion comes from. */
  standard: string;
  pillar: string;
  family: string;
  familyName: string;
  name: string;
  layer: Layer;
  severity: SeverityLevel;
  /** The same severity on Nielsen's 0–4 scale, which the report uses. */
  nielsen: 0 | 1 | 2 | 3 | 4;
  /** 0–1. The strongest instance's confidence, after any model review. */
  confidence: number;
  confidenceFloor: number;
  effort: Effort;
  rootCauseId: string;
  status: FindingStatus;
  /** Why it is in review rather than confirmed. */
  reviewReason: string | null;
  /** Every instance of this root cause. Deduction happens once regardless. */
  evidence: Evidence[];
  rationale: string;
  fix: string;
  /** Points this finding took from its family, after the family cap. */
  deduction: number;
  /** When the model moved the severity off the rule's base, and why. */
  severityNote: string | null;
};

/* ---------------------------------------------------------------- scoring */

export type FamilyScore = {
  id: string;
  name: string;
  weight: number;
  /** Raw points lost before the cap. */
  deducted: number;
  /** Points actually lost — never more than the weight. */
  lost: number;
  score: number;
  rulesTotal: number;
  rulesFailed: number;
  rulesPassed: number;
  rulesNotEvaluated: number;
  rulesNotApplicable: number;
};

export type WorkingItem = {
  ruleId: string;
  evidenceId: string;
  text: string;
};

/* ---------------------------------------------------- model output limits */

/** The contract bans these outright in anything the model writes. */
export const BANNED_PHRASES = [
  'improve ux',
  'make it more intuitive',
  'enhance the user experience',
  'consider optimizing',
  'best practices suggest',
];
