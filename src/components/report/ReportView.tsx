'use client';

import { useEffect, useState } from 'react';
import { ReportDocument } from '@/components/report/ReportDocument';
import { ExportBar } from '@/components/report/ExportBar';
import { FixContact } from '@/components/report/FixContact';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Button, Container, Row, Section, Stack, Text } from '@/components/ui';
import type { AuditResult } from '@/lib/audit/types';

/** Where the browser keeps its own copy of a report, so a reload survives a restart. */
export const reportKey = (id: string) => `zaudit:report:${id}`;

export function rememberReport(result: AuditResult): void {
  try {
    sessionStorage.setItem(reportKey(result.id), JSON.stringify(result));
  } catch {
    /* private mode, or no room: the server copy still answers */
  }
}

type State = { status: 'loading' } | { status: 'ready'; result: AuditResult } | { status: 'gone'; message: string };

/**
 * One report, on its own page.
 *
 * It loads from whatever is closest: the copy this browser kept when the audit
 * ran, then the server's. A report that is on neither is gone rather than
 * half-drawn, and says so with the way to produce a fresh one.
 */
export function ReportView({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  // Printing is how this becomes a PDF, and a PDF with half the evidence folded
  // away is not the report. Everything the reader collapsed opens for the print
  // and closes again afterwards — including when they print with Ctrl+P.
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(document.querySelectorAll<HTMLDetailsElement>('details:not([open])'));
      for (const d of opened) d.open = true;
    };
    const after = () => {
      for (const d of opened) d.open = false;
      opened = [];
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  useEffect(() => {
    let live = true;
    const local = (() => {
      try {
        const raw = sessionStorage.getItem(reportKey(id));
        return raw ? (JSON.parse(raw) as AuditResult) : null;
      } catch {
        return null;
      }
    })();
    if (local) setState({ status: 'ready', result: local });

    fetch(`/api/audit/${id}`)
      .then(async (res) => {
        if (!live) return;
        if (!res.ok) {
          if (!local) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            setState({ status: 'gone', message: body.error ?? 'That report could not be found.' });
          }
          return;
        }
        const result = (await res.json()) as AuditResult;
        setState({ status: 'ready', result });
        rememberReport(result);
      })
      .catch(() => {
        if (live && !local) setState({ status: 'gone', message: 'That report could not be loaded.' });
      });

    return () => {
      live = false;
    };
  }, [id]);

  // A link from the summary carries the criterion in the hash, but the report
  // arrives after the browser has already looked for it, so the jump is ours.
  const ready = state.status === 'ready';
  useEffect(() => {
    if (!ready) return;
    const id = decodeURIComponent(window.location.hash.replace('#', ''));
    if (!id) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  if (state.status === 'loading') {
    return (
      <Section>
        <Container>
          <Text variant="bodySm" tone="muted">
            Opening the report…
          </Text>
        </Container>
      </Section>
    );
  }

  if (state.status === 'gone') {
    return (
      <Section>
        <Container>
          <Stack gap={14} style={{ maxWidth: 560 }}>
            <Text variant="cardTitle">This report is no longer here</Text>
            <Text variant="bodySm" tone="muted" wrap="pretty">
              {state.message} Reports are kept for a short while on the server and for the length of a browser session, so a link
              opened days later, or on another device, will not find one.
            </Text>
            <Row gap={8}>
              <Button variant="primary" iconEnd="IconArrowUpRight" onClick={() => window.location.assign('/')}>
                Run a new audit
              </Button>
            </Row>
          </Stack>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <ExportBar result={state.result} />
      <ReportDocument result={state.result} />
      <FixContact result={state.result} />
      <SiteFooter />
    </>
  );
}
