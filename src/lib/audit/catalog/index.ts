import type { RuleDef } from '../contract';
import type { CriterionDef, PillarDef } from '../framework';
import { ACCESSIBILITY } from './acc';
import { MOBILE_CHECKS } from './mobile';
import { CRITERIA, PILLARS } from './pillars';
import { TECH_CHECKS } from './tech';
import { UI_QUALITY } from './ui';
import { USABILITY } from './ux';

/**
 * Two layers, deliberately separate.
 *
 * **Criteria** are the audit's language: what is being judged, the standard it
 * comes from, and what counts as a pass. They are what the report quotes.
 *
 * **Checks** are the engine's: one measurement each, with the evidence it must
 * produce, how certain it has to be, and the fix to print. A criterion names the
 * checks that decide it, and a check can serve more than one criterion.
 */

export { CRITERIA, PILLARS };

export const CHECKS: RuleDef[] = [...ACCESSIBILITY.rules, ...USABILITY.rules, ...UI_QUALITY.rules, ...TECH_CHECKS, ...MOBILE_CHECKS];

const checksById = new Map<string, RuleDef>(CHECKS.map((c) => [c.id, c]));
const criteriaById = new Map<string, CriterionDef>(CRITERIA.map((c) => [c.id, c]));
const pillarsById = new Map<string, PillarDef>(PILLARS.map((p) => [p.id, p]));

export function check(id: string): RuleDef {
  const c = checksById.get(id);
  if (!c) throw new Error(`Unknown check ${id}`);
  return c;
}

export function criterion(id: string): CriterionDef {
  const c = criteriaById.get(id);
  if (!c) throw new Error(`Unknown criterion ${id}`);
  return c;
}

export function pillar(id: string): PillarDef {
  const p = pillarsById.get(id);
  if (!p) throw new Error(`Unknown pillar ${id}`);
  return p;
}

/** Which criteria a check feeds, so a measurement can be traced to the judgement it serves. */
export const CRITERIA_BY_CHECK = new Map<string, CriterionDef[]>();
for (const c of CRITERIA) {
  for (const id of c.checks) {
    CRITERIA_BY_CHECK.set(id, [...(CRITERIA_BY_CHECK.get(id) ?? []), c]);
  }
}

/** Checks no criterion uses, and criteria naming a check that does not exist: wiring mistakes, caught by the tests. */
export const ORPHAN_CHECKS = CHECKS.filter((c) => !CRITERIA_BY_CHECK.has(c.id)).map((c) => c.id);
export const MISSING_CHECKS = CRITERIA.flatMap((c) => c.checks.filter((id) => !checksById.has(id)));
