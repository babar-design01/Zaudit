import type { CSSProperties } from 'react';

/**
 * The page the proof card's finding is about, drawn rather than captured: the
 * handoff left this slot for a screenshot that was never supplied. It shows what
 * the finding says, two buttons of equal weight, with the design's own annotation
 * marks, and is labelled as an example so it does not read as a real customer.
 */

const button: CSSProperties = {
  flex: '1 1 124px',
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  background: '#E7E8EA',
  color: 'var(--ink)',
  font: '500 14px/20px var(--font-sans)',
  borderRadius: 6,
};

const bar = (width: string | number, height = 10, background = '#E7E8EA'): CSSProperties => ({ display: 'block', width, height, borderRadius: 3, background });

export function ProofCapture() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 7 }}>
      {/* browser frame */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F3F3F3', borderBottom: '1px solid var(--border)' }}>
        <span style={{ display: 'flex', gap: 5 }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#D9DBDF' }} />
          ))}
        </span>
        <span style={{ flex: 1, minWidth: 0, padding: '3px 10px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 4, font: '400 12px/16px var(--font-sans)', color: 'var(--ink-muted)' }}>
          yourproduct.com
        </span>
        <span style={{ flex: 'none', font: '500 12px/16px var(--font-sans)', color: 'var(--ink-muted)' }}>Example page</span>
      </div>

      {/* the page */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 28, padding: 'clamp(16px, 3vw, 28px)', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ font: '700 15px/20px var(--font-sans)', color: 'var(--ink)' }}>Your product</span>
          <span style={{ display: 'flex', gap: 12 }}>
            <span style={bar(40)} />
            <span style={bar(40)} />
            <span style={bar(40)} />
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ font: '700 clamp(24px, 2.6vw, 34px)/1.15 var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--ink)', textWrap: 'balance' }}>Plan every project in one place</span>
          <span style={{ font: '400 15px/22px var(--font-sans)', color: 'var(--ink-secondary)', maxWidth: 400 }}>Tasks, files and deadlines your whole team can see.</span>
        </div>

        {/* the finding: two actions that look the same, marked */}
        <div style={{ position: 'relative', alignSelf: 'flex-start', width: 'min(calc(100% - 20px), 320px)', margin: '4px 10px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={button}>Start free trial</span>
            <span style={button}>Learn more</span>
          </div>
          <span style={{ position: 'absolute', inset: -9, border: '1.5px dashed var(--critical)', borderRadius: 8 }} />
          <span style={{ position: 'absolute', left: -22, top: -22, width: '26px', height: '26px', borderRadius: '8px', background: 'var(--critical)', color: '#FFFFFF', font: '500 13px/26px var(--font-sans)', textAlign: 'center' }}>1</span>
        </div>

        <span style={{ marginTop: -8, font: '500 13px/18px var(--font-sans)', color: 'var(--critical)' }}>Same size, colour and weight, so neither reads as the next step.</span>

        {/* the rest of the page, kept quiet so the mark is what the eye lands on */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, border: '1px solid var(--border)', borderRadius: 6 }}>
              <span style={bar(28, 28, '#F3F3F3')} />
              <span style={bar('70%')} />
              <span style={bar('100%', 8, '#F3F3F3')} />
              <span style={bar('85%', 8, '#F3F3F3')} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
