'use client';

import Link from 'next/link';
import { Card, Container, Divider, Grid, Heading, Meter, Row, Section, Spacer, Stack, Text } from '@/components/ui';
import { SEVERITY_SCALE, SeverityTag } from '@/components/ui/SeverityTag';
import { color, hairline, radius, t, tracking } from '@/design/tokens';
import { SEVERITY_NAME } from '@/lib/audit/framework';
import type { AuditResult } from '@/lib/audit/types';

/**
 * The result on the homepage: enough to know where the page stands, and a way
 * into the report itself. Every row is a link to the finding it names, so
 * clicking one lands on it rather than at the top of a long document.
 */
export function AuditSummary({ result }: { result: AuditResult }) {
  const href = `/report/${result.id}`;
  return (
    <Section id="results" style={{ borderTop: hairline() }}>
      <Container>
        <Stack gap={20}>
          <Row justify="between" align="end" gap={16} wrap>
            <Stack gap={4}>
              <Text variant="chip" tone="muted" uppercase style={{ letterSpacing: tracking.eyebrow }}>
                Audit result
              </Text>
              <Heading level={2} variant="sectionTitle">
                {result.finalUrl}
              </Heading>
            </Stack>
            <Link href={href} style={{ textDecoration: 'none' }}>
              <Text font={t(600, 14, 20)} colorValue={color.primary}>
                Open the full report →
              </Text>
            </Link>
          </Row>

          <Grid columns="minmax(260px, 0.8fr) minmax(0, 1.4fr)" gap={20}>
            <Card radius={radius.lg} pad={22} gap={14}>
              <Stack gap={6}>
                <Text variant="chip" tone="muted" uppercase style={{ letterSpacing: tracking.eyebrow }}>
                  {result.goal.name}
                </Text>
                {result.overall == null ? (
                  <Stack gap={4}>
                    <Text variant="cardTitle">Not scored</Text>
                    <Text variant="bodyXs" tone="muted" wrap="pretty">
                      Too little could be measured for a score to mean anything.
                    </Text>
                  </Stack>
                ) : (
                  <>
                    <Row gap={8} align="baseline">
                      <Text variant="metricLg" style={{ letterSpacing: -1 }}>
                        {result.overall}
                      </Text>
                      <Text tone="muted" style={{ fontSize: 17 }}>
                        / 100
                      </Text>
                      <Spacer />
                      <Text variant="labelSm" tone="muted">
                        {result.band}
                      </Text>
                    </Row>
                    <Meter value={result.overall} label={`Overall score ${result.overall} of 100`} />
                  </>
                )}
              </Stack>
              <Divider />
              <Stack gap={8}>
                {result.pillars.map((p) => (
                  <Row key={p.id} gap={10} align="center">
                    <Text variant="bodyXs" style={{ flex: 1, minWidth: 0 }}>
                      {p.name}
                    </Text>
                    <Text variant="monoXs" tone="muted">
                      {p.score ?? '—'}
                    </Text>
                  </Row>
                ))}
              </Stack>
              <Text variant="fine" tone="muted" wrap="pretty">
                {result.coverage.assessed} of {result.coverage.total} criteria judged
                {result.reviewerTasks.length ? `, ${result.reviewerTasks.length} left for a reviewer` : ''}.
              </Text>
            </Card>

            <Stack gap={12}>
              <Text variant="labelStrong">
                {result.findings.length} finding{result.findings.length === 1 ? '' : 's'} — the ones worth doing first
              </Text>
              <Card radius={radius.md} pad={6}>
                <Stack gap={0}>
                  {result.priorities.map((p, i) => (
                    <Link
                      key={p.findingId}
                      href={`${href}#${p.criterionId}`}
                      style={{
                        display: 'block',
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: '12px 14px',
                        borderTop: i === 0 ? 'none' : hairline(),
                        borderRadius: radius.sm,
                      }}
                    >
                      <Row gap={10} align="start">
                        <Text variant="mono" tone="muted" style={{ width: 20 }}>
                          {i + 1}
                        </Text>
                        <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                          <Row gap={8} wrap align="center">
                            <SeverityTag severity={SEVERITY_SCALE[p.severity]}>{SEVERITY_NAME[p.severity]}</SeverityTag>
                            <Text variant="labelSm">{p.problem}</Text>
                          </Row>
                          <Text variant="bodyXs" tone="muted" wrap="pretty">
                            {p.observed}
                          </Text>
                        </Stack>
                        <Text variant="monoXs" tone="muted">
                          {p.criterionId}
                        </Text>
                      </Row>
                    </Link>
                  ))}
                  {!result.priorities.length && (
                    <Text variant="bodySm" tone="muted" style={{ padding: '12px 14px' }}>
                      Nothing failed among the criteria that could be measured. The report lists what still needs a reviewer.
                    </Text>
                  )}
                </Stack>
              </Card>
              <Link href={href} style={{ textDecoration: 'none' }}>
                <Text variant="bodySm" colorValue={color.primary}>
                  Read every finding, the evidence behind it and the fixes →
                </Text>
              </Link>
            </Stack>
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
