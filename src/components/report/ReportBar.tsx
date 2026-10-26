'use client';

import { color, layout, radius, t, text, tracking } from '@/design/tokens';

/**
 * The report bar: **Back** on the left, **Save as PDF** on the right, and
 * nothing else — the nav's own button already starts a new audit.
 *
 * Save as PDF is the browser's print-to-PDF, driven by the print rules in
 * `globals.css`, which drop the page furniture and keep each issue on a sheet.
 */
export function ReportBar() {
  return (
    <div data-print-hide style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div
        style={{
          maxWidth: layout.frame,
          margin: '0 auto',
          padding: `14px ${layout.gutter}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <a
          href="/"
          data-cta="secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            font: t(600, 14, 20),
            color: color.ink,
            padding: '10px 14px 10px 10px',
            borderRadius: radius.button,
            boxShadow: `inset 0 0 0 1px ${color.border}`,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back
        </a>
        <button
          type="button"
          data-cta="secondary"
          onClick={() => window.print()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: color.actionGhost,
            color: color.ink,
            border: 'none',
            cursor: 'pointer',
            font: text.buttonSm,
            letterSpacing: tracking.button,
            textTransform: 'uppercase',
            padding: '13px 20px',
            borderRadius: radius.button,
            boxShadow: `inset 0 0 0 1px ${color.actionOutline}`,
          }}
        >
          Save as PDF
        </button>
      </div>
    </div>
  );
}
