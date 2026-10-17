'use client';

import { useMemo, useState } from 'react';
import { Button, Card, Container, FieldLabel, Grid, Heading, Input, Row, Section, Stack, Text } from '@/components/ui';
import { color, hairline, radius } from '@/design/tokens';
import { SEVERITY_NAME } from '@/lib/audit/framework';
import { fixRequestBody } from '@/lib/report/markdown';
import type { AuditResult } from '@/lib/audit/types';

const TEAM_EMAIL = 'hello@zaudit.com';

/**
 * Asking for the work.
 *
 * The message is composed from the report the reader is looking at — the five
 * fixes, the score, the link — so nobody has to retype any of it, and whoever
 * answers can see what was found before they reply. It opens the reader's own
 * mail client rather than posting anywhere: there is no inbox behind this site
 * yet, and a form that silently drops a message would be worse than no form.
 */
export function FixContact({ result }: { result: AuditResult }) {
  const [name, setName] = useState('');
  const [from, setFrom] = useState('');
  const [note, setNote] = useState('');

  const host = useMemo(() => {
    try {
      return new URL(result.finalUrl).hostname.replace(/^www\./, '');
    } catch {
      return result.finalUrl;
    }
  }, [result.finalUrl]);

  const worst = result.priorities[0];
  const confirmed = result.findings.length;

  const mailto = useMemo(() => {
    const subject = `Fixing ${confirmed} finding${confirmed === 1 ? '' : 's'} on ${host}`;
    const body = [note.trim(), note.trim() ? '' : '', fixRequestBody(result), '', name.trim() ? `— ${name.trim()}` : '']
      .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
      .join('\n');
    return `mailto:${TEAM_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${from.trim() ? `&cc=${encodeURIComponent(from.trim())}` : ''}`;
  }, [confirmed, host, name, note, from, result]);

  return (
    <Section data-print-hide style={{ borderTop: hairline(), background: color.muted }}>
      <Container>
        <Grid columns="minmax(0, 1fr) minmax(300px, 0.9fr)" gap={32}>
          <Stack gap={14}>
            <Heading level={2} variant="sectionTitle">
              Want these fixed?
            </Heading>
            <Text variant="bodySm" wrap="pretty">
              Send this report to the team and we will come back with what each fix takes — in hours, not a proposal. The message
              below is written from the report you are looking at, so there is nothing to retype.
            </Text>

            <Stack gap={8} style={{ padding: '14px 16px', background: color.card, border: hairline(), borderRadius: radius.md }}>
              <Text variant="labelSm">What goes in the message</Text>
              <Text variant="bodyXs" tone="muted" wrap="pretty">
                {host} · {result.overall == null ? 'not scored' : `${result.overall}/100`} · {confirmed} finding
                {confirmed === 1 ? '' : 's'}
                {worst ? `, worst of them ${SEVERITY_NAME[worst.severity].toLowerCase()}: ${worst.criterionName}` : ''} · a link back to
                this report.
              </Text>
            </Stack>

            <Text variant="fine" tone="muted" wrap="pretty">
              Prefer to do it yourself? Every finding above carries the exact change to make, and the report exports as PDF,
              Markdown or JSON from the bar at the top.
            </Text>
          </Stack>

          <Card radius={radius.lg} pad={22} gap={14}>
            <Stack gap={10}>
              <Stack gap={5}>
                <FieldLabel>Your name</FieldLabel>
                <Input value={name} onChange={setName} placeholder="Alex Mercer" ariaLabel="Your name" />
              </Stack>
              <Stack gap={5}>
                <FieldLabel>Your email</FieldLabel>
                <Input value={from} onChange={setFrom} placeholder="alex@example.com" ariaLabel="Your email" />
                <Text variant="fine" tone="muted">
                  Copied in, so the reply reaches you.
                </Text>
              </Stack>
              <Stack gap={5}>
                <FieldLabel>Anything we should know</FieldLabel>
                <Input value={note} onChange={setNote} placeholder="Deadline, who owns the code, what you have tried." ariaLabel="Anything we should know" />
              </Stack>
            </Stack>
            <Row gap={8} wrap>
              <Button variant="primary" iconEnd="IconArrowUpRight" onClick={() => window.location.assign(mailto)}>
                Send the report
              </Button>
              <Button variant="ghost" onClick={() => window.location.assign(`mailto:${TEAM_EMAIL}`)}>
                Just email us
              </Button>
            </Row>
            <Text variant="fine" tone="muted">
              Opens your mail app addressed to {TEAM_EMAIL}. Nothing is sent from this page.
            </Text>
          </Card>
        </Grid>
      </Container>
    </Section>
  );
}
