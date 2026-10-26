'use client';

import { useEffect, useState } from 'react';
import { Contact } from '@/components/report/Contact';
import { ReportBar } from '@/components/report/ReportBar';
import { ReportDocument } from '@/components/report/ReportDocument';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { ButtonLink } from '@/components/ui';
import type { AuditResult } from '@/lib/audit/types';
import { color, layout, t, tracking } from '@/design/tokens';

/** Where the browser keeps its own copy of a report, so a reload survives a restart. */
export const reportKey = (id: string) => `audix:report:${id}`;

export function rememberReport(result: AuditResult): void {
  try {
    sessionStorage.setItem(reportKey(result.id), JSON.stringify(result));
  } catch {
    /* private mode, or no room: the server copy still answers */
  }
}

type State = { status: 'loading' } | { status: 'ready'; result: AuditResult } | { status: 'gone'; message: string };

/**
 * One report, on its own page: nav, the report bar, the cover and the issue
 * slides, the contact panel, the footer — `design/Report.dc.html` in order.
 *
 * It loads from whatever is closest: a copy handed in by the server (the
 * sample), the copy this browser kept when the audit ran, then the server's.
 * A report on none of them is gone rather than half-drawn.
 */
export function ReportView({ id, initial = null }: { id: string; initial?: AuditResult | null }) {
  const [state, setState] = useState<State>(initial ? { status: 'ready', result: initial } : { status: 'loading' });

  useEffect(() => {
    if (initial) return;
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
  }, [id, initial]);

  // A link carrying an anchor (#contact, a finding) arrives before the report
  // does, so the jump is ours to make once it has rendered.
  const ready = state.status === 'ready';
  useEffect(() => {
    if (!ready) return;
    const target = decodeURIComponent(window.location.hash.replace('#', ''));
    if (!target) return;
    const frame = requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  return (
    <div style={{ minHeight: '100vh', background: color.bg, color: color.ink }}>
      <div data-print-hide>
        <SiteNav current={id === 'sample' ? 'sample' : undefined} />
      </div>

      {state.status === 'ready' ? (
        <>
          <ReportBar />
          <main id="main">
            <ReportDocument result={state.result} />
          </main>
          <div data-print-hide>
            <Contact result={state.result} />
          </div>
        </>
      ) : (
        <section style={{ background: color.surface }}>
          <div style={{ maxWidth: layout.frame, margin: '0 auto', padding: `96px ${layout.gutter}`, display: 'flex', flexDirection: 'column', gap: 16, minHeight: '50vh' }}>
            {state.status === 'loading' ? (
              <p style={{ margin: 0, font: t(400, 15, 24), color: color.inkMuted }}>Opening the report…</p>
            ) : (
              <>
                <span style={{ font: t(600, 11, 16), letterSpacing: tracking.eyebrow, textTransform: 'uppercase', color: color.accentFg }}>Report</span>
                <h1 style={{ margin: 0, font: t(800, 'clamp(32px, 3.4vw, 48px)', 1.08), letterSpacing: tracking.tight }}>This report is no longer here</h1>
                <p style={{ margin: 0, maxWidth: 560, font: t(400, 17, 28), color: color.inkSecondary }}>
                  {state.message} Reports are kept for a short while on the server and for the length of a browser session, so a link
                  opened days later, or on another device, may not find one.
                </p>
                <div>
                  <ButtonLink href="/?audit=1">Run a new audit</ButtonLink>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <div data-print-hide>
        <SiteFooter />
      </div>
    </div>
  );
}
