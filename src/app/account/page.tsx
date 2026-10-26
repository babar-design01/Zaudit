import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { BuyButton } from '@/components/account/BuyButton';
import { Button, Card, Container, Heading, Row, Section, Spacer, Stack, Text } from '@/components/ui';
import { PACKS, billingEnabled, priceOf } from '@/lib/billing';
import { balance, history, runsFor } from '@/lib/credits';
import { accountsEnabled } from '@/lib/db';
import { color, hairline, radius, t } from '@/design/tokens';

export const dynamic = 'force-dynamic';

const REASON: Record<string, string> = {
  welcome: 'First audit, on the house',
  purchase: 'Credits bought',
  audit: 'Audit run',
  refund: 'Credit returned',
  adjustment: 'Adjustment',
};

const when = (d: Date) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * The account: what is left, what it was spent on, and where to get more.
 *
 * The statement is the ledger itself rather than a summary of it, because the
 * question people actually arrive with is "what happened to my credits", and a
 * balance alone cannot answer it.
 */
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ bought?: string; cancelled?: string }> }) {
  if (!accountsEnabled()) redirect('/');
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect('/signin?callbackUrl=/account');

  const { bought, cancelled } = await searchParams;
  const [left, entries, runs] = await Promise.all([balance(user.id), history(user.id), runsFor(user.id)]);

  return (
    <Section style={{ background: color.muted, minHeight: '100vh' }}>
      <Container style={{ padding: '56px 32px', maxWidth: 880 }}>
        <Stack gap={28}>
          <Row gap={12} align="center">
            <Link href="/" style={{ font: t(500, 13, 20), color: color.mutedFg }}>
              ← Zaudit
            </Link>
            <Spacer />
            <Text variant="bodyXs" tone="muted">
              {user.email}
            </Text>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </Row>

          {bought && (
            <div style={{ padding: '14px 16px', borderRadius: radius.md, background: color.accent, border: hairline(color.primary) }}>
              <Text variant="labelSm">{bought} credits added. Thank you.</Text>
            </div>
          )}
          {cancelled && (
            <div style={{ padding: '14px 16px', borderRadius: radius.md, background: color.card, border: hairline() }}>
              <Text variant="bodySm" tone="muted">
                Checkout was cancelled — nothing was charged.
              </Text>
            </div>
          )}

          {/* balance */}
          <Card radius={radius.lg} pad={28} gap={10}>
            <Text variant="monoXs" tone="muted" uppercase style={{ letterSpacing: '0.1em' }}>
              Credits
            </Text>
            <Row gap={16} align="baseline" wrap>
              <span style={{ font: t(600, 56, 56), letterSpacing: '-0.04em', color: left > 0 ? color.fg : color.destructive }}>
                {left}
              </span>
              <Text variant="bodySm" tone="muted" wrap="pretty">
                {left === 0
                  ? 'No credits left. One credit is one audit — a run that cannot be scored gives its credit back.'
                  : `One credit is one audit. ${left === 1 ? 'This is your last one.' : ''}`}
              </Text>
            </Row>
            <Row gap={10} wrap style={{ marginTop: 8 }}>
              <Button variant={left > 0 ? 'outline' : 'primary'} size="sm">
                <Link href="/#hero" style={{ color: 'inherit' }}>
                  Run an audit
                </Link>
              </Button>
            </Row>
          </Card>

          {/* packs */}
          <Stack gap={14}>
            <Heading level={2} variant="cardTitle">
              Top up
            </Heading>
            {billingEnabled() ? (
              <Row gap={16} wrap align="stretch">
                {PACKS.map((p) => (
                  <Card key={p.id} radius={radius.md} pad={22} gap={10} style={{ flex: '1 1 260px' }}>
                    <Text variant="labelLg">{p.name}</Text>
                    <Row gap={8} align="baseline">
                      <span style={{ font: t(600, 36, 40), letterSpacing: '-0.03em' }}>{priceOf(p)}</span>
                      <Text variant="bodyXs" tone="muted">
                        {p.credits} credits
                      </Text>
                    </Row>
                    <Text variant="bodyXs" tone="muted" wrap="pretty">
                      {p.summary}
                    </Text>
                    <BuyButton pack={p.id} label={`Buy ${p.credits} credits`} />
                  </Card>
                ))}
              </Row>
            ) : (
              <Card radius={radius.md} pad={20}>
                <Text variant="bodySm" tone="muted" wrap="pretty">
                  Buying credits is not switched on in this deployment yet. Email hello@zaudit.com and we will add
                  them to your account by hand.
                </Text>
              </Card>
            )}
          </Stack>

          {/* statement */}
          <Stack gap={14}>
            <Heading level={2} variant="cardTitle">
              Statement
            </Heading>
            <Card radius={radius.md} pad={0}>
              {entries.length === 0 ? (
                <div style={{ padding: 20 }}>
                  <Text variant="bodySm" tone="muted">
                    Nothing yet.
                  </Text>
                </div>
              ) : (
                entries.map((e, i) => (
                  <Row
                    key={e.id}
                    gap={12}
                    align="center"
                    style={{ padding: '14px 20px', borderTop: i === 0 ? 'none' : hairline() }}
                  >
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text variant="labelSm">{REASON[e.reason] ?? e.reason}</Text>
                      <Text variant="monoXs" tone="muted">
                        {when(e.createdAt)}
                        {e.runId ? ` · run ${e.runId}` : ''}
                      </Text>
                    </Stack>
                    <Spacer />
                    {e.runId && e.reason === 'audit' && (
                      <Link href={`/report/${e.runId}`} style={{ font: t(600, 13, 20), color: color.primary }}>
                        Report
                      </Link>
                    )}
                    <span
                      style={{
                        font: t(500, 15, 22, 'mono'),
                        color: e.delta > 0 ? color.primary : color.mutedFg,
                        minWidth: 44,
                        textAlign: 'right',
                      }}
                    >
                      {e.delta > 0 ? `+${e.delta}` : e.delta}
                    </span>
                  </Row>
                ))
              )}
            </Card>
          </Stack>

          {/* runs */}
          {runs.length > 0 && (
            <Stack gap={14}>
              <Heading level={2} variant="cardTitle">
                Your audits
              </Heading>
              <Card radius={radius.md} pad={0}>
                {runs.map((r, i) => (
                  <Row key={r.id} gap={12} align="center" style={{ padding: '14px 20px', borderTop: i === 0 ? 'none' : hairline() }}>
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text variant="labelSm">{r.host}</Text>
                      <Text variant="monoXs" tone="muted">
                        {when(r.createdAt)} · {r.goal} · {r.findings ?? 0} findings
                      </Text>
                    </Stack>
                    <Spacer />
                    <Text variant="mono" tone="muted">
                      {r.overall == null ? 'not scored' : `${r.overall}/100`}
                    </Text>
                    <Link href={`/report/${r.id}`} style={{ font: t(600, 13, 20), color: color.primary }}>
                      Open
                    </Link>
                  </Row>
                ))}
              </Card>
            </Stack>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
