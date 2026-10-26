import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { billingEnabled, packById, stripe } from '@/lib/billing';
import { db, users } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/checkout  { pack: 'standard' | 'ultimate' }
 *
 * Starts a Stripe Checkout session and answers with its URL. Nothing is granted
 * here: credits are added by the webhook, when Stripe says the money arrived.
 * A reader who closes the tab mid-payment has bought nothing, and a reader
 * whose card succeeds gets their credits even if they never come back to us.
 */
export async function POST(request: Request) {
  if (!billingEnabled()) {
    return Response.json({ error: 'Buying credits is not switched on yet.' }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email ?? undefined;
  if (!userId) return Response.json({ error: 'Sign in first.' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { pack?: unknown };
  const pack = typeof body.pack === 'string' ? packById(body.pack) : undefined;
  if (!pack) return Response.json({ error: 'That is not a pack we sell.' }, { status: 400 });

  const on = db();
  const origin = new URL(request.url).origin;

  // Reuse the customer, so a second purchase lands on the same record rather
  // than a stranger with the same email.
  let customerId: string | null = null;
  if (on) {
    const [row] = await on.select({ id: users.stripeCustomerId }).from(users).where(eq(users.id, userId)).limit(1);
    customerId = row?.id ?? null;
  }

  const checkout = await stripe().checkout.sessions.create({
    mode: 'payment',
    customer: customerId ?? undefined,
    customer_email: customerId ? undefined : email,
    client_reference_id: userId,
    // The webhook reads these rather than trusting whatever comes back to us.
    metadata: { userId, packId: pack.id, credits: String(pack.credits) },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: pack.currency,
          unit_amount: pack.amount,
          product_data: {
            name: `Audix — ${pack.credits} audit credits`,
            description: pack.summary,
          },
        },
      },
    ],
    success_url: `${origin}/account?bought=${pack.credits}`,
    cancel_url: `${origin}/account?cancelled=1`,
  });

  if (!checkout.url) return Response.json({ error: 'Stripe did not return a checkout page.' }, { status: 502 });
  return Response.json({ url: checkout.url });
}
