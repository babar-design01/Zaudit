import { PLANS, priceOf, type Plan } from './plans';

/*
 * Paid plans are requested, not bought: "Get Pro" opens /contact?plan=pro with
 * the plan chosen, the request is emailed with "Plan request: Pro" as its
 * subject, and the plan is switched on by hand after a reply. No checkout.
 *
 * The URL uses the names people see (starter, pro, agency). Those differ from
 * the plan ids Stripe and the database record ('pro' is shown as Starter), so
 * the two are mapped here and nowhere else.
 */

export type PlanChoice = 'starter' | 'pro' | 'agency' | 'unsure';

/** The form's Plan select, in order. */
export const PLAN_CHOICES: { value: PlanChoice; label: string }[] = [
  ...PLANS.map((p) => ({ value: p.name.toLowerCase() as PlanChoice, label: p.name })),
  { value: 'unsure', label: 'Not sure yet' },
];

/** `?plan=` to a choice. Anything unknown, missing or repeated chooses nothing. */
export function planFromParam(value: unknown): PlanChoice | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  return PLAN_CHOICES.some((c) => c.value === v) ? (v as PlanChoice) : null;
}

/** The paid plan behind a choice, or nothing for "Not sure yet". */
export function paidPlan(choice: PlanChoice | null): Plan | null {
  if (!choice || choice === 'unsure') return null;
  return PLANS.find((p) => p.name.toLowerCase() === choice) ?? null;
}

/** Where each pricing card's button goes. */
export const planRequestHref = (plan: Plan) => `/contact?plan=${plan.name.toLowerCase()}`;

/** The label a choice is shown and emailed under. */
export const planLabel = (choice: PlanChoice) => PLAN_CHOICES.find((c) => c.value === choice)?.label ?? choice;

/** "Hi, I'd like to start the Pro plan." */
export const planMessage = (choice: PlanChoice | null) => {
  const plan = paidPlan(choice);
  return plan ? `Hi, I'd like to start the ${plan.name} plan.` : '';
};

/** "Pro · $9.90 a month · 15 audits a month", for the summary above the form. */
export const planSummary = (plan: Plan) => ({ name: plan.name, price: `${priceOf(plan)} a month`, audits: `${plan.auditsPerMonth} audits a month`, summary: plan.summary });
