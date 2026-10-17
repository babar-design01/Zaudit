'use client';

import type { CSSProperties } from 'react';
import {
  ArrowLink,
  Badge,
  Button,
  Card,
  Container,
  CountPill,
  Eyebrow,
  FieldLabel,
  Heading,
  MaterialSymbol,
  Meter,
  Row,
  Section,
  Spacer,
  Stack,
  Text,
} from '@/components/ui';
import { SEVERITY_DOTS, SEVERITY_SCALE } from '@/components/ui/SeverityTag';
import { SEVERITY_NAME } from '@/lib/audit/framework';
import { color, motion, radius, shadow, t, text } from '@/design/tokens';
import type { AuditState } from '@/hooks/useAudit';

/** The result panel the hero keeps once the dialog is closed. */
const STATE_CARD: CSSProperties = {
  marginTop: 16,
  width: '100%',
  maxWidth: 620,
  textAlign: 'left',
};

export function Hero({
  state,
  setUrl,
  start,
  reset,
}: {
  state: AuditState;
  setUrl: (url: string) => void;
  start: () => void;
  reset: () => void;
}) {
  const { stage, url, result } = state;

  const provenance = result?.provenance ?? '';

  const severityCounts = result
    ? ([4, 3, 2, 1] as const).map((n) => ({
        label: SEVERITY_NAME[n],
        n: result.counts[n],
        dot: SEVERITY_DOTS[SEVERITY_SCALE[n]],
      }))
    : [];

  return (
    <Section>
      <Container
        style={{
          padding: '96px 32px 104px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          textAlign: 'center',
        }}
      >
        <Eyebrow>AI-POWERED UX AUDIT</Eyebrow>

        <Heading level={1} variant="display" width="hero" wrap="pretty">
          Find what’s hurting your user experience.
        </Heading>

        <Text as="p" variant="leadHero" tone="muted" width="heroLead" wrap="pretty">
          Analyze your website for usability, UI, accessibility, and conversion issues. Get
          evidence-backed findings that show what’s wrong, why it matters, and what to improve next.
        </Text>

        {/* core widget: the URL bar */}
        <Stack align="center" gap={12} style={{ marginTop: 20, width: '100%', maxWidth: 620 }}>
          <label htmlFor="hero-url" style={{ font: text.label, color: color.fg }}>
            Enter your website URL
          </label>

          {/* the gradient frame is a 2px padded wrapper, not a border */}
          <div
            style={{
              width: '100%',
              padding: 2,
              borderRadius: 999,
              background: color.gradient,
              boxShadow: shadow.md,
            }}
          >
            <Row
              gap={8}
              style={{
                background: color.card,
                borderRadius: 999,
                padding: '8px 8px 8px 24px',
              }}
            >
              <MaterialSymbol name="language" style={{ fontSize: 20, color: color.mutedFg }} />
              <input
                id="hero-url"
                type="text"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') start();
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: color.fg,
                  font: t(400, 16, 24),
                }}
              />
              <Button variant="primary" size="lg" iconEnd="IconArrowUpRight" onClick={start}>
                {stage === 'running' ? 'Analyzing…' : 'Run Free UX Audit'}
              </Button>
            </Row>
          </div>

          <Text variant="caption" tone="muted">
            No credit card required · Get your first findings before signup
          </Text>

          <ArrowLink href="#sample" style={{ marginTop: 4 }}>
            View Sample Audit
          </ArrowLink>
        </Stack>

        {/* Running and error live in the dialog; the hero keeps the result. */}
        {stage === 'done' && result && (
          <Card
            radius={radius.lg}
            elevation="sm"
            pad={24}
            gap={18}
            style={{ ...STATE_CARD, animation: motion.riseSlow }}
          >
            <Row align="start" justify="between" gap={16}>
              <Stack gap={4}>
                <FieldLabel>{result.goal.name}</FieldLabel>
                <Text variant="metricLg" style={{ letterSpacing: -1 }}>
                  {result.overall ?? '—'}
                  <Text tone="muted" style={{ fontSize: 17 }}>
                    {' '}
                    / 100
                  </Text>
                </Text>
                <Text variant="mono" tone="muted">
                  {result.finalUrl}
                </Text>
              </Stack>
              <Badge variant="secondary">{result.band ?? 'Not scored'}</Badge>
            </Row>

            <Meter value={result.overall ?? 0} label={`Overall score: ${result.overall ?? 0} out of 100`} />

            <Stack gap={10}>
              <Text variant="labelStrong">
                {result.findings.length} finding{result.findings.length === 1 ? '' : 's'} detected
              </Text>
              <Row gap={6} wrap>
                {severityCounts.map((s) => (
                  <CountPill key={s.label} dot={s.dot}>
                    {s.n} {s.label}
                  </CountPill>
                ))}
              </Row>
            </Stack>

            <Row gap={8}>
              {result.findings.length > 0 && (
                <ArrowLink href="#results" tone="primary" style={{ gap: 6 }}>
                  Read the findings
                </ArrowLink>
              )}
              {result.coverage.assessed < result.coverage.total / 2 && (
                <Button variant="outline" size="sm" onClick={start}>
                  Run it again
                </Button>
              )}
              <Spacer />
              <button
                type="button"
                onClick={reset}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  font: t(500, 13, 20),
                  color: color.mutedFg,
                }}
              >
                New audit
              </button>
            </Row>

            <Text variant="fine" tone="muted" wrap="pretty">
              {result.coverage.assessed} of {result.coverage.total} criteria judged
              {result.reviewerTasks.length ? `, ${result.reviewerTasks.length} left for a reviewer` : ''}.
            </Text>

            <Text variant="monoXs" tone="muted">
              {provenance}
            </Text>
          </Card>
        )}
      </Container>
    </Section>
  );
}
