'use client';

import { useState } from 'react';
import { Button, Container, Row, Spacer, Stack, Text } from '@/components/ui';
import { color, hairline, t } from '@/design/tokens';
import { reportMarkdown } from '@/lib/report/markdown';
import type { AuditResult } from '@/lib/audit/types';

/**
 * Taking the report away.
 *
 * Print is the PDF route — the browser's own export, driven by the print rules
 * in `globals.css`, which open every collapsed section and drop the page
 * furniture. Markdown is for a ticket or a document; JSON is the whole result,
 * evidence and all, for anyone who wants to diff two runs.
 */
export function ExportBar({ result }: { result: AuditResult }) {
  const [copied, setCopied] = useState(false);

  const download = (name: string, body: string, type: string) => {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const host = (() => {
    try {
      return new URL(result.finalUrl).hostname.replace(/^www\./, '');
    } catch {
      return 'report';
    }
  })();
  const stamp = new Date(result.fetchedAt).toISOString().slice(0, 10);
  const base = `ux-audit-${host}-${stamp}`;

  return (
    <div
      data-print-hide
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: color.bg,
        borderBottom: hairline(),
      }}
    >
      <Container style={{ padding: '12px 32px' }}>
        <Row gap={10} wrap align="center">
          <Stack gap={1}>
            <Text font={t(600, 14, 20)}>UX audit · {host}</Text>
            <Text variant="monoXs" tone="muted">
              {result.overall == null ? 'not scored' : `${result.overall}/100 ${result.band}`} · {result.goal.name}
            </Text>
          </Stack>
          <Spacer />
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print or save as PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => download(`${base}.md`, reportMarkdown(result), 'text/markdown')}>
            Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => download(`${base}.json`, JSON.stringify(result, null, 2), 'application/json')}>
            JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconStart={copied ? 'IconCircleCheck' : undefined}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* clipboard refused; the address bar still has it */
              }
            }}
          >
            {copied ? 'Link copied' : 'Copy link'}
          </Button>
        </Row>
      </Container>
    </div>
  );
}
