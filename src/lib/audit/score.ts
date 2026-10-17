import { PILLARS } from './catalog';
import type { ContractFinding } from './contract';
import { band, passRate, weightsFor, type Band, type GoalDef, type PillarDef, type Severity, type Verdict } from './framework';
import type { CriterionReport } from './evaluate';

/**
 * Scoring, in the framework's order: a criterion is pass, partial or fail; a
 * pillar is the weighted pass rate of its criteria; the overall score is the
 * pillar scores under the goal's weights.
 *
 * Criteria that did not apply, or could not be assessed, are left out of the
 * fraction rather than counted either way — a score should say how much of what
 * was judged passed, not how much of the audit ran.
 */

export type PillarScore = {
  id: string;
  name: string;
  question: string;
  standards: string[];
  optional: boolean;
  weight: number;
  /** Null when nothing in this pillar could be assessed. */
  score: number | null;
  band: Band | null;
  counts: Record<Verdict, number>;
  /** The worst severity confirmed in this pillar, on Nielsen's scale. */
  worst: Severity | null;
  criteria: CriterionReport[];
};

export type Priority = {
  findingId: string;
  criterionId: string;
  criterionName: string;
  /** The fault, as the measurement names it. */
  problem: string;
  pillar: string;
  pillarName: string;
  severity: Severity;
  /** How many places the same failure appears. */
  instances: number;
  weight: number;
  /** severity × instances × goal weight — what ranks it. */
  rank: number;
  effort: ContractFinding['effort'];
  observed: string;
  fix: string;
};

export type Scoring = {
  overall: number | null;
  band: Band | null;
  pillars: PillarScore[];
  priorities: Priority[];
  /** How much of the audit could be judged at all. */
  coverage: { assessed: number; total: number; byMethod: Record<string, { assessed: number; total: number }> };
};

export function score(criteria: CriterionReport[], findings: ContractFinding[], goal: GoalDef): Scoring {
  const weights = weightsFor(goal, PILLARS as PillarDef[]);
  const confirmed = findings.filter((f) => f.status === 'confirmed');

  const pillars: PillarScore[] = [];
  for (const p of PILLARS) {
    if (!(p.id in weights)) continue;
    const own = criteria.filter((c) => c.pillar === p.id);
    if (!own.length) continue;
    const counts: Record<Verdict, number> = { pass: 0, partial: 0, fail: 0, not_applicable: 0, not_assessed: 0 };
    for (const c of own) counts[c.verdict] += 1;
    const sev = own.map((c) => c.severity).filter((s): s is Severity => s != null);
    const s = passRate(own.map((c) => c.verdict));
    pillars.push({
      id: p.id,
      name: p.name,
      question: p.question,
      standards: p.standards,
      optional: !!p.optional,
      weight: weights[p.id],
      score: s,
      band: s == null ? null : band(s),
      counts,
      worst: sev.length ? (Math.max(...sev) as Severity) : null,
      criteria: own,
    });
  }

  const scored = pillars.filter((p) => p.score != null);
  const totalWeight = scored.reduce((a, p) => a + p.weight, 0);
  const overall = totalWeight ? Math.round(scored.reduce((a, p) => a + p.score! * p.weight, 0) / totalWeight) : null;

  /* The five fixes worth doing first: severity × how often × what the goal weights. */
  const byPillar = new Map(pillars.map((p) => [p.id, p]));
  const priorities: Priority[] = confirmed
    .map((f) => {
      const p = byPillar.get(f.pillar);
      const weight = p?.weight ?? 1;
      const instances = f.evidence.length;
      return {
        findingId: f.id,
        criterionId: f.criterionId,
        criterionName: f.criterionName,
        problem: f.checkName,
        pillar: f.pillar,
        pillarName: p?.name ?? f.pillar,
        severity: f.nielsen,
        instances,
        weight,
        rank: f.nielsen * Math.min(instances, 10) * weight,
        effort: f.effort,
        observed: f.evidence[0]?.observed ?? '',
        fix: f.fix,
      };
    })
    .sort((a, b) => b.rank - a.rank || b.severity - a.severity)
    .slice(0, 5);

  const byMethod: Scoring['coverage']['byMethod'] = {};
  for (const c of criteria) {
    // Criteria that do not apply to this page are out of both sides of the count.
    if (c.verdict === 'not_applicable') continue;
    const m = (byMethod[c.method] ??= { assessed: 0, total: 0 });
    m.total += 1;
    if (c.verdict === 'pass' || c.verdict === 'partial' || c.verdict === 'fail') m.assessed += 1;
  }
  const assessed = criteria.filter((c) => c.verdict === 'pass' || c.verdict === 'partial' || c.verdict === 'fail').length;

  return {
    overall,
    band: overall == null ? null : band(overall),
    pillars,
    priorities,
    coverage: { assessed, total: criteria.filter((c) => c.verdict !== 'not_applicable').length, byMethod },
  };
}
