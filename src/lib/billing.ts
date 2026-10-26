import Stripe from 'stripe';

/**
 * What a credit costs, and the one place that decides it.
 *
 * The packs are defined here rather than as products in a Stripe dashboard, so
 * the price on the pricing page and the price at the till come from the same
 * line of code. Stripe is told the amount at checkout; nothing has to be kept
 * in step by hand.
 */

export type Pack = {
  id: 'standard' | 'ultimate';
  name: string;
  credits: number;
  /** In the smallest currency unit, as Stripe counts. */
  amount: number;
  currency: 'usd';
  summary: string;
};

export const PACKS: Pack[] = [
  {
    id: 'standard',
    name: 'Standard',
    credits: 20,
    amount: 1000,
    currency: 'usd',
    summary: 'For designers and product teams auditing regularly.',
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    credits: 100,
    amount: 3000,
    currency: 'usd',
    summary: 'For agencies auditing client experiences at scale.',
  },
];

export const packById = (id: string): Pack | undefined => PACKS.find((p) => p.id === id);

export const priceOf = (p: Pack): string => `$${(p.amount / 100).toFixed(p.amount % 100 === 0 ? 0 : 2)}`;

/** Billing is on only when there is a key to charge with. */
export function billingEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured');
  client ??= new Stripe(key, { maxNetworkRetries: 2 });
  return client;
}
