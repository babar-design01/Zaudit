'use client';

/** Opens the browser's print dialog. Hidden on paper itself. */
export function PrintButton({ label = 'Print this checklist' }: { label?: string }) {
  return (
    <button
      type="button"
      data-print-hide
      data-cta="primary"
      onClick={() => window.print()}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '52px', background: 'var(--ink)', color: '#FFFFFF', border: 'none', cursor: 'pointer', font: '600 14px/20px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px', borderRadius: '2px' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />
      </svg>
      {label}
    </button>
  );
}
