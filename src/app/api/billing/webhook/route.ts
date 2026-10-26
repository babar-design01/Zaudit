import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { billingEnabled, stripe } from '@/lib/billing';
import { grant } from '@/lib/credits';
import { db, users } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/webhook — Stripe telling us money arrived.
 *
 * This is the only place credits are bought. The signature is checked against
 * the raw body before anything is read, the amount comes from the event rather
 * than from the browser, and the grant is keyed on the event id, so Stripe's
 * own retries — which are guaranteed, not hypothetical — cannot pay twice.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!billingEnabled() || !secret) return new Response('billing off', { status: 503 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('unsigned', { status: 400 });

  // The raw bytes, not the parsed body: the signature covers exactly what was
  // sent, and JSON.parse would not give it back unchanged.
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    return new Response(`bad signature: ${err instanceof Error ? err.message : 'unknown'}`, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    // Everything else is someone else's problem, but a 200 stops Stripe retrying.
    return Response.json({ ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') return Response.json({ ignored: 'unpaid' });

  const userId = session.metadata?.userId || session.client_reference_id;
  const credits = Number(session.metadata?.credits);
  if (!userId || !Number.isInteger(credits) || credits <= 0) {
    // Nothing we can act on, and retrying will not improve it.
    return Response.json({ ignored: 'no account on the session' });
  }

  await grant(userId, credits, 'purchase', {
    ref: event.id,
    note: `${credits} credits — ${(session.amount_total ?? 0) / 100} ${(session.currency ?? 'usd').toUpperCase()}`,
  });

  // Remember the customer so the next purchase reuses it.
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const on = db();
  if (on && customerId) {
    await on.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
  }

  return Response.json({ granted: credits });
}
