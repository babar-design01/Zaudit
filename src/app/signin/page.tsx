import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';
import { Button, Card, Container, FieldLabel, Heading, Section, Stack, Text } from '@/components/ui';
import { accountsEnabled } from '@/lib/db';
import { color, hairline, radius, t } from '@/design/tokens';

export const dynamic = 'force-dynamic';

/**
 * Sign in, by emailed link.
 *
 * One field, one button, and a page that says plainly what will happen next —
 * the link arrives in an inbox, and the reader has to go and get it. That trip
 * is the whole cost of having no password, so the copy here is about making it
 * predictable rather than about selling an account.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; callbackUrl?: string }>;
}) {
  const { sent, error, callbackUrl } = await searchParams;
  if (!accountsEnabled()) redirect('/');
  const session = await auth();
  if (session?.user) redirect('/account');

  const mailed = sent === '1';

  return (
    <Section style={{ background: color.muted, minHeight: '100vh' }}>
      <Container style={{ padding: '96px 32px', maxWidth: 520 }}>
        <Stack gap={24}>
          <Link href="/" style={{ font: t(500, 13, 20), color: color.mutedFg }}>
            ← Back to Zaudit
          </Link>

          <Card radius={radius.lg} pad={28} gap={18}>
            {mailed ? (
              <Stack gap={12}>
                <Heading level={1} variant="cardTitle">
                  Check your inbox
                </Heading>
                <Text variant="bodySm" tone="muted" wrap="pretty">
                  We sent you a link. It signs you in on this device and expires in fifteen minutes — if it has
                  been longer than that, ask for another one.
                </Text>
                <Text variant="fine" tone="muted" wrap="pretty">
                  Nothing arrived? Check the spam folder, then try again: a typo in an address looks exactly like
                  a mail that has not landed yet.
                </Text>
                <Link href="/signin" style={{ font: t(600, 14, 20), color: color.primary, marginTop: 4 }}>
                  Use a different address
                </Link>
              </Stack>
            ) : (
              <Stack gap={18}>
                <Stack gap={8}>
                  <Heading level={1} variant="cardTitle">
                    Sign in to Zaudit
                  </Heading>
                  <Text variant="bodySm" tone="muted" wrap="pretty">
                    No password. We email you a link, you click it, you are in. New accounts start with one free
                    audit.
                  </Text>
                </Stack>

                {error && (
                  <div style={{ padding: '12px 14px', borderRadius: radius.sm, background: color.accent, border: hairline(color.primary) }}>
                    <Text variant="bodyXs" wrap="pretty">
                      That link did not work — it may have been used already, or expired. Ask for a new one.
                    </Text>
                  </div>
                )}

                <form
                  action={async (formData: FormData) => {
                    'use server';
                    const email = String(formData.get('email') || '').trim();
                    if (!email) return;
                    await signIn('resend', { email, redirectTo: callbackUrl || '/account' });
                  }}
                >
                  <Stack gap={10}>
                    <Stack gap={5}>
                      <FieldLabel>Your email</FieldLabel>
                      <input
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        placeholder="you@company.com"
                        aria-label="Your email"
                        style={{
                          width: '100%',
                          font: t(400, 15, 22),
                          color: color.fg,
                          background: color.card,
                          border: hairline(color.input),
                          borderRadius: radius.sm,
                          padding: '12px 14px',
                          outline: 'none',
                        }}
                      />
                    </Stack>
                    <Button variant="primary" size="lg" type="submit" iconEnd="IconArrowUpRight">
                      Email me a link
                    </Button>
                  </Stack>
                </form>

                <Text variant="fine" tone="muted" wrap="pretty">
                  We use your address to sign you in and to send the report you ask for. Nothing else.
                </Text>
              </Stack>
            )}
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
