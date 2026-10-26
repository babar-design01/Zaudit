import { CHECKS, CRITERIA, CRITERIA_BY_CHECK, check as checkOf } from './catalog';
import {
  DEFAULT_CONFIDENCE_FLOOR,
  VIEWPORT,
  worse,
  type BBox,
  type ContractFinding,
  type Evidence,
  type Instance,
  type PageTypeResult,
  type RuleDef,
  type RuleOutcome,
  type SeverityLevel,
} from './contract';
import type { CriterionDef, Platform, Severity, Verdict } from './framework';
import { ACC_EVALUATORS, type RuleContext } from './rules/acc';
import { MOBILE_EVALUATORS } from './rules/mobile';
import { TECH_EVALUATORS } from './rules/tech';
import { UI_EVALUATORS } from './rules/ui';
import { UX_EVALUATORS } from './rules/ux';

/**
 * Measurements become criterion verdicts here, with the evidence rules enforced
 * mechanically along the way:
 *
 *  - a check runs only if the page type allows it;
 *  - evidence missing any required field is discarded, never downgraded;
 *  - nothing whose box falls outside the first screen is flagged;
 *  - a subjective check needs its independent signals;
 *  - two checks describing one defect on one element keep the more severe;
 *  - instances below the check's confidence floor go to human review;
 *  - a criterion with nothing measured is "not assessed", never a pass.
 */

const EVALUATORS: Record<string, (ctx: RuleContext) => RuleOutcome> = {
  ...ACC_EVALUATORS,
  ...UX_EVALUATORS,
  ...UI_EVALUATORS,
  ...TECH_EVALUATORS,
  ...MOBILE_EVALUATORS,
};

export const SCREENSHOT_REF = 'viewport@1440x900';

/** Nielsen's 0–4 scale, from the engine's internal severity. */
export const NIELSEN: Record<SeverityLevel, Severity> = { critical: 4, high: 3, medium: 2, low: 1 };

export type CheckReport = {
  id: string;
  name: string;
  status: RuleOutcome['status'];
  /** How many things the check looked at, when it ran. */
  checked: number | null;
  note: string | null;
  criteria: string[];
};

export type CriterionReport = {
  id: string;
  pillar: string;
  name: string;
  passCondition: string;
  standard: string;
  method: CriterionDef['method'];
  verdict: Verdict;
  /** The worst severity among confirmed failures, on Nielsen's scale. */
  severity: Severity | null;
  /** One line a reader can act on: what was measured and what came of it. */
  note: string;
  findings: string[];
  /** What the check saw when the criterion passed. */
  evidence: Evidence[];
  reviewerTask: string | null;
  checks: CheckReport[];
};

export type Evaluation = {
  checks: CheckReport[];
  criteria: CriterionReport[];
  findings: ContractFinding[];
  passes: { ruleId: string; criterionId: string; checked: number; note: string; evidence: Evidence }[];
  discarded: { ruleId: string; reason: string }[];
};

/* ------------------------------------------------------------- evidence */

function validBox(b: BBox | undefined): boolean {
  if (!b || b.length !== 4 || b.some((n) => typeof n !== 'number' || !Number.isFinite(n))) return false;
  const [x, y, w, h] = b;
  return w > 0 && h > 0 && x >= 0 && y >= 0 && x + w <= VIEWPORT.width + 1 && y + h <= VIEWPORT.height + 1;
}

/** Why an instance breaks the evidence contract, or null if it does not. */
function evidenceProblem(rule: RuleDef, e: Instance['evidence']): string | null {
  if (!e.selector?.trim()) return 'no selector';
  if (!validBox(e.bbox)) return 'no bounding box inside the first screen';
  if (!e.observed?.trim()) return 'no observed value';
  if (!e.expected?.trim()) return 'no expected value';
  for (const field of rule.evidenceFields) {
    if (field === 'selector' || field === 'screenshot_bbox') continue;
    if (!(field in e.fields) || e.fields[field] === undefined) return `missing ${field}`;
  }
  return null;
}

/* ---------------------------------------------------------------- fixes */

/** Fills the check's `{placeholders}`. Anything unmeasured stays as written. */
export function renderFix(template: string, vars: Record<string, string> = {}): string {
  const body = template.replace(/\{([a-z_]+)\}/gi, (whole, key: string) => (vars[key] != null ? vars[key] : whole));
  return vars._note ? `${body}\n\n${vars._note}` : body;
}

/* ------------------------------------------------------------ findings */

function cluster(
  rule: RuleDef,
  criterion: CriterionDef,
  instances: Instance[],
  status: ContractFinding['status'],
  nextId: () => number,
  evidenceSeq: { n: number },
): ContractFinding[] {
  const groups = new Map<string, Instance[]>();
  for (const inst of instances) {
    const g = groups.get(inst.rootCause) ?? [];
    g.push(inst);
    groups.set(inst.rootCause, g);
  }
  return [...groups.entries()].map(([rootCause, group]) => {
    const severity = group.reduce<SeverityLevel>((s, i) => worse(s, i.severity ?? rule.severityBase), 'low');
    const lead = group.find((i) => (i.severity ?? rule.severityBase) === severity) ?? group[0];
    const confidence = Math.max(...group.map((i) => i.confidence));
    const floor = rule.confidenceFloor ?? DEFAULT_CONFIDENCE_FLOOR;
    const evidence: Evidence[] = group.map((i) => {
      evidenceSeq.n += 1;
      return {
        ...i.evidence,
        evidenceId: `EV-${criterion.id}-${String(evidenceSeq.n).padStart(2, '0')}`,
        screenshotRef: i.evidence.documentLevel ? 'the page' : SCREENSHOT_REF,
      };
    });
    return {
      id: `${criterion.id}#${nextId()}`,
      ruleId: rule.id,
      checkName: rule.name,
      criterionId: criterion.id,
      criterionName: criterion.name,
      passCondition: criterion.passCondition,
      standard: criterion.standard,
      pillar: criterion.pillar,
      family: rule.family,
      familyName: criterion.pillar,
      name: criterion.name,
      layer: rule.layer,
      severity,
      nielsen: NIELSEN[severity],
      confidence: Math.round(confidence * 100) / 100,
      confidenceFloor: floor,
      effort: rule.effort,
      rootCauseId: `${criterion.id}:${rootCause}`,
      status,
      reviewReason:
        status === 'needs_human_review'
          ? `Confidence ${confidence.toFixed(2)} is below this check's floor of ${floor}.`
          : null,
      evidence,
      rationale: criterion.why,
      fix: renderFix(rule.fix, lead.fixVars),
      deduction: 0,
      severityNote: null,
    };
  });
}

/* ------------------------------------------------------------ evaluate */

export type EvaluateContext = RuleContext & { platforms: Platform[] };

export function evaluate(ctx: EvaluateContext): Evaluation {
  const outcomes = new Map<string, RuleOutcome>();
  const discarded: Evaluation['discarded'] = [];

  /* ---- run every check once ------------------------------------------- */
  for (const rule of CHECKS) {
    const allowed = rule.pageTypes === 'all' || rule.pageTypes.includes(ctx.pageType.type);
    if (!allowed) {
      outcomes.set(rule.id, {
        ruleId: rule.id,
        status: 'not_applicable',
        reason:
          ctx.pageType.type === 'unknown'
            ? 'The page type could not be determined, so only measurements that apply to every page were run.'
            : `This measurement applies to ${(rule.pageTypes as string[]).join(', ')} pages; this page is ${ctx.pageType.type}.`,
      });
      continue;
    }
    const evaluator = EVALUATORS[rule.id];
    if (!evaluator) {
      outcomes.set(rule.id, { ruleId: rule.id, status: 'not_evaluated', reason: 'No measurement is implemented for this check yet.' });
      continue;
    }
    let outcome: RuleOutcome;
    try {
      outcome = evaluator(ctx);
    } catch (err) {
      outcome = { ruleId: rule.id, status: 'not_evaluated', reason: `The measurement failed: ${err instanceof Error ? err.message : String(err)}` };
    }

    if (outcome.status === 'fail') {
      const kept: Instance[] = [];
      for (const inst of outcome.instances) {
        const problem = evidenceProblem(rule, inst.evidence);
        if (problem) {
          discarded.push({ ruleId: rule.id, reason: problem });
          continue;
        }
        const need = rule.signalsRequired ?? 2;
        if (rule.subjective && (inst.signals?.length ?? 0) < need) {
          discarded.push({ ruleId: rule.id, reason: `fewer than ${need} independent signals` });
          continue;
        }
        kept.push(inst);
      }
      outcome = kept.length
        ? { ...outcome, instances: kept }
        : {
            ruleId: rule.id,
            status: 'not_evaluated',
            reason: `The measurement matched, but none of its ${outcome.instances.length} occurrence(s) carried complete evidence, so nothing is reported.`,
          };
    }
    outcomes.set(rule.id, outcome);
  }

  /* ---- one defect, one finding: keep the more severe ------------------- */
  const byDefect = new Map<string, { ruleId: string; inst: Instance }>();
  for (const o of outcomes.values()) {
    if (o.status !== 'fail') continue;
    for (const inst of o.instances) {
      if (!inst.defect) continue;
      const sev = inst.severity ?? checkOf(o.ruleId).severityBase;
      const held = byDefect.get(inst.defect);
      if (!held || worse(sev, held.inst.severity ?? checkOf(held.ruleId).severityBase) === sev) {
        byDefect.set(inst.defect, { ruleId: o.ruleId, inst });
      }
    }
  }

  /* ---- roll the checks up into criteria -------------------------------- */
  const findings: ContractFinding[] = [];
  const passes: Evaluation['passes'] = [];
  const criteria: CriterionReport[] = [];
  const evidenceSeq = { n: 0 };

  for (const criterion of CRITERIA) {
    if (!criterion.appliesTo.some((p) => ctx.platforms.includes(p))) continue;
    const reports: CheckReport[] = [];
    const ownFindings: ContractFinding[] = [];
    let worstSeverity: SeverityLevel | null = null;
    let anyPass = false;
    let anyFail = false;
    let anyReview = false;
    const notes: string[] = [];

    for (const id of criterion.checks) {
      const o = outcomes.get(id);
      if (!o) continue;
      const rule = checkOf(id);
      reports.push({
        id,
        name: rule.name,
        status: o.status,
        checked: o.status === 'fail' || o.status === 'pass' ? o.checked : null,
        note: o.status === 'pass' ? o.note : o.status === 'fail' ? o.note ?? null : o.reason,
        criteria: (CRITERIA_BY_CHECK.get(id) ?? []).map((c) => c.id),
      });

      if (o.status === 'pass') {
        anyPass = true;
        notes.push(o.note);
        if (o.evidence && !evidenceProblem({ ...rule, evidenceFields: [] }, o.evidence)) {
          passes.push({
            ruleId: id,
            criterionId: criterion.id,
            checked: o.checked,
            note: o.note,
            evidence: { ...o.evidence, evidenceId: `EV-${criterion.id}-PASS-${id}`, screenshotRef: o.evidence.documentLevel ? 'the page' : SCREENSHOT_REF },
          });
        }
      } else if (o.status === 'fail') {
        const instances = o.instances.filter((i) => !i.defect || byDefect.get(i.defect)?.inst === i);
        if (!instances.length) continue;
        const floor = rule.confidenceFloor ?? DEFAULT_CONFIDENCE_FLOOR;
        let seq = 0;
        const next = () => (seq += 1);
        const confirmed = cluster(rule, criterion, instances.filter((i) => i.confidence >= floor), 'confirmed', next, evidenceSeq);
        const review = cluster(rule, criterion, instances.filter((i) => i.confidence < floor), 'needs_human_review', next, evidenceSeq);
        ownFindings.push(...confirmed, ...review);
        if (confirmed.length) {
          anyFail = true;
          for (const f of confirmed) worstSeverity = worstSeverity ? worse(worstSeverity, f.severity) : f.severity;
          notes.push(confirmed[0].evidence[0].observed);
        }
        if (review.length) anyReview = true;
      } else if (o.status === 'not_evaluated') {
        notes.push(o.reason);
      }
    }

    findings.push(...ownFindings);

    /* the verdict */
    let verdict: Verdict;
    if (anyFail && anyPass && (worstSeverity === 'low' || worstSeverity === 'medium')) verdict = 'partial';
    else if (anyFail) verdict = 'fail';
    else if (anyPass) verdict = 'pass';
    else if (reports.length && reports.every((r) => r.status === 'not_applicable')) verdict = 'not_applicable';
    else verdict = 'not_assessed';

    const note = (() => {
      if (verdict === 'fail' || verdict === 'partial') return notes[0] ?? 'The measurement found a failure.';
      if (verdict === 'pass') return notes.filter(Boolean)[0] ?? 'Measured, with nothing to report.';
      if (verdict === 'not_applicable') return reports.find((r) => r.status === 'not_applicable')?.note ?? 'This criterion does not apply to this page.';
      if (!criterion.checks.length) return 'This criterion needs someone to work the product; it cannot be measured from one page load.';
      if (anyReview) return 'A possible failure was measured but is not certain enough to report as one. It is listed for review.';
      return reports.find((r) => r.status === 'not_evaluated')?.note ?? 'Nothing could be measured for this criterion.';
    })();

    criteria.push({
      id: criterion.id,
      pillar: criterion.pillar,
      name: criterion.name,
      passCondition: criterion.passCondition,
      standard: criterion.standard,
      method: criterion.method,
      verdict,
      severity: worstSeverity ? NIELSEN[worstSeverity] : null,
      note,
      findings: ownFindings.map((f) => f.id),
      evidence: passes.filter((p) => p.criterionId === criterion.id).map((p) => p.evidence),
      reviewerTask: criterion.reviewerTask ?? null,
      checks: reports,
    });
  }

  const checks: CheckReport[] = [...outcomes.values()].map((o) => {
    const rule = checkOf(o.ruleId);
    return {
      id: o.ruleId,
      name: rule.name,
      status: o.status,
      checked: o.status === 'fail' || o.status === 'pass' ? o.checked : null,
      note: o.status === 'pass' ? o.note : o.status === 'fail' ? o.note ?? null : o.reason,
      criteria: (CRITERIA_BY_CHECK.get(o.ruleId) ?? []).map((c) => c.id),
    };
  });

  return { checks, criteria, findings, passes, discarded };
}

/* ---------------------------------------------------------------- L3 */

/**
 * A criterion marked `assisted` is measured in code and judged by reading. With
 * no model review, its failures are held for a person: the finding stays, with
 * its evidence, and the criterion reports "not assessed" rather than failing.
 */
export function holdAssisted(evaluation: Evaluation, reviewed: boolean): Evaluation {
  if (reviewed) return evaluation;
  const assisted = new Set(CRITERIA.filter((c) => c.method === 'assisted').map((c) => c.id));
  const findings = evaluation.findings.map((f) =>
    assisted.has(f.criterionId) && f.status === 'confirmed'
      ? {
          ...f,
          status: 'needs_human_review' as const,
          reviewReason: 'This criterion is judged by reading the wording and the context. No model review ran, so it is held for a person rather than counted as a failure.',
        }
      : f,
  );
  const held = new Set(findings.filter((f) => f.status === 'needs_human_review').map((f) => f.criterionId));
  const criteria = evaluation.criteria.map((c) =>
    assisted.has(c.id) && held.has(c.id) && (c.verdict === 'fail' || c.verdict === 'partial')
      ? {
          ...c,
          verdict: 'not_assessed' as const,
          severity: null,
          note: `Measured, and a possible failure was found — ${c.note} It needs a reviewer, or a model review, to confirm.`,
        }
      : c,
  );
  return { ...evaluation, findings, criteria };
}
