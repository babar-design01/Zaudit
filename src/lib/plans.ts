/**
 * What each plan costs and allows, and the one place that decides it. The pricing
 * page, the account page and the amount sent to Stripe all read this, so the price
 * shown and the price charged cannot drift apart.
 */

/** Free audits an address gets without an account. */
export const FREE_BEFORE_LOGIN = 1;
/** Free audits a new account starts with. */
export const FREE_AFTER_LOGIN = 2;
/** Free audits one network can run in a day without an account, however many addresses it types. */
export const FREE_PER_NETWORK_PER_DAY = 3;

export type PlanId = 'pro' | 'agency' | 'max';

export type Plan = {
  id: PlanId;
  name: string;
  /** In the smallest currency unit, as Stripe counts. */
  amount: number;
  currency: 'usd';
  /** What a month's payment tops the account up to. */
  auditsPerMonth: number;
  summary: string;
};

export const PLANS: Plan[] = [
  { id: 'pro', name: 'Pro', amount: 500, currency: 'usd', auditsPerMonth: 5, summary: 'For freelancers checking a site now and then' },
  { id: 'agency', name: 'Agency', amount: 990, currency: 'usd', auditsPerMonth: 15, summary: 'For teams and agencies auditing client sites' },
  { id: 'max', name: 'Max', amount: 1990, currency: 'usd', auditsPerMonth: 40, summary: 'For auditing every release across many sites' },
];

export const planById = (id: unknown): Plan | undefined => PLANS.find((p) => p.id === id);

export const priceOf = (plan: Plan): string => `$${(plan.amount / 100).toFixed(plan.amount % 100 === 0 ? 0 : 2)}`;
