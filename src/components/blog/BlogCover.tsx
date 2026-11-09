import type { CSSProperties } from 'react';
import type { Cover, CoverBars } from '@/content/blog';
import { NEW_MOTIFS } from '@/content/posts';

/**
 * An article's cover: the brand's glow field, still, with a small picture of
 * the finding the article is about drawn in the product's own annotated style.
 * No photographs, so every cover is on-brand and nothing needs licensing.
 *
 * Decorative: the article's title says what it is about, so the cover is
 * hidden from assistive tech.
 */

/** Where the four glows sit; each cover takes a different arrangement. */
const LAYOUTS: Record<Cover, [string, string, string, string]> = {
  coverage: ['left:-12%;top:-30%', 'right:-14%;top:-10%', 'right:10%;bottom:-40%', 'left:18%;bottom:-36%'],
  browser: ['right:-10%;top:-34%', 'left:-16%;top:-6%', 'left:12%;bottom:-42%', 'right:16%;bottom:-34%'],
  conversion: ['left:20%;top:-40%', 'left:-18%;bottom:-30%', 'right:-12%;top:-8%', 'right:22%;bottom:-38%'],
  lawsuits: ['right:18%;top:-38%', 'right:-16%;bottom:-24%', 'left:-10%;top:-20%', 'left:14%;bottom:-40%'],
  wcag22: ['left:-8%;top:-36%', 'right:-18%;top:4%', 'left:22%;bottom:-44%', 'right:8%;bottom:-30%'],
  contrast: ['right:6%;top:-42%', 'left:-20%;top:10%', 'right:-14%;bottom:-28%', 'left:26%;bottom:-40%'],
  targets: ['left:30%;top:-44%', 'right:-20%;top:-12%', 'left:-14%;bottom:-26%', 'right:20%;bottom:-42%'],
  layoutshift: ['right:-6%;top:-40%', 'left:-14%;top:-24%', 'right:24%;bottom:-44%', 'left:4%;bottom:-30%'],
  heuristics: ['left:-16%;top:-14%', 'right:14%;top:-44%', 'right:-12%;bottom:-32%', 'left:20%;bottom:-38%'],
  zeeframes: ['right:-14%;top:-26%', 'left:12%;top:-42%', 'left:-18%;bottom:-24%', 'right:18%;bottom:-40%'],
};

const toStyle = (s: string): CSSProperties =>
  Object.fromEntries(s.split(';').map((kv) => kv.split(':') as [string, string]));

const card: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 0 0 6px rgba(255, 255, 255, 0.5), 0 12px 28px rgba(20, 40, 90, 0.1)',
};
const tiny: CSSProperties = { font: '600 10px/14px var(--font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase' };

/** The three layers of the coverage map, with roughly the share of rules in each. */
const LAYERS = [
  { label: 'Measured', how: 'Auto', share: 38, fill: 'var(--blue)', dashed: false },
  { label: 'Interaction-tested', how: 'Browser', share: 29, fill: '#7F8CFF', dashed: false },
  { label: 'Human review', how: 'You', share: 33, fill: '#EEF1F7', dashed: true },
];

/** A small page: a heading bar, two text lines and a button. */
function MiniPage({ live }: { live: boolean }) {
  const line = (w: string) => <span style={{ display: 'block', width: w, height: '5px', borderRadius: '2px', background: '#E3E6EC' }} />;
  return (
    <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', padding: '9px', height: '68px', boxSizing: 'border-box', border: '1px solid #E3E6EC', borderRadius: '6px', background: live ? '#FFFFFF' : '#F6F7F9' }}>
      <span style={{ display: 'block', width: '70%', height: '7px', borderRadius: '2px', background: live ? '#3A3D44' : '#C9CDD4' }} />
      {line('90%')}
      {line('60%')}
      <span
        style={{
          marginTop: 'auto',
          alignSelf: 'flex-start',
          width: '40px',
          height: '12px',
          borderRadius: '2px',
          background: live ? 'var(--blue)' : '#C9CDD4',
          outline: live ? '2px solid #7F8CFF' : 'none',
          outlineOffset: '2px',
        }}
      />
      {live && (
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: 'absolute', left: '44px', bottom: '3px' }}>
          <path d="M5 3l14 8-6 1.5L10 19z" fill="#16181D" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/** A few labelled bars, longest set in brand blue: the figure an article turns on. */
const BARS: Partial<Record<Cover, CoverBars>> = {
  ...NEW_MOTIFS,
  conversion: {
    title: 'Conversion rate',
    chip: '41k pages',
    rows: [
      { label: 'Grade 5–7', value: '11.1%', share: 100, strong: true },
      { label: 'Median', value: '6.6%', share: 59 },
      { label: 'Professional', value: '5.3%', share: 48 },
    ],
  },
  lawsuits: {
    title: 'ADA web suits · 2025',
    chip: '3 counts',
    rows: [
      { label: 'Seyfarth', value: '3,117', share: 61 },
      { label: 'EcomBack', value: '3,948', share: 77 },
      { label: 'UsableNet', value: '5,114', share: 100, strong: true },
    ],
  },
};

function Motif({ cover }: { cover: Cover }) {
  const bars = BARS[cover];
  if (bars) {
    return (
      <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', width: '232px' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ ...tiny, color: '#3A3D44' }}>{bars.title}</span>
          <span style={{ ...tiny, color: 'var(--accent-fg)', background: '#E8F0FE', padding: '2px 6px', borderRadius: '2px', whiteSpace: 'nowrap' }}>{bars.chip}</span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {bars.rows.map((r) => (
            <span key={r.label} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 38px', alignItems: 'center', gap: '8px', font: '500 10px/14px var(--font-sans)', color: '#3A3D44' }}>
              {r.label}
              <span style={{ height: '8px', borderRadius: '3px', background: '#EEF1F7' }}>
                <span style={{ display: 'block', height: '100%', width: `${r.share}%`, borderRadius: '3px', background: r.strong ? 'var(--blue)' : '#A9B3FF' }} />
              </span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#16181D' }}>{r.value}</span>
            </span>
          ))}
        </span>
      </div>
    );
  }

  if (cover === 'browser') {
    // A screenshot beside the same page live: only the live one has focus, hover and a score.
    const panes = [
      { label: 'Screenshot', found: '14%', live: false },
      { label: 'Real browser', found: 'Live', live: true },
    ];
    return (
      <div style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', width: '232px' }}>
        <span style={{ ...tiny, color: '#3A3D44' }}>Same page · two views</span>
        <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {panes.map((p) => (
            <span key={p.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <MiniPage live={p.live} />
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', font: '500 10px/14px var(--font-sans)', color: '#3A3D44', whiteSpace: 'nowrap' }}>
                {p.label}
                <span style={{ ...tiny, color: p.live ? 'var(--accent-fg)' : '#6B7080', background: p.live ? '#E8F0FE' : '#F1F2F4', padding: '2px 6px', borderRadius: '2px' }}>{p.found}</span>
              </span>
            </span>
          ))}
        </span>
      </div>
    );
  }

  // 'coverage': one bar split into the three layers, and a legend.
  return (
    <div style={{ ...card, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', width: '250px' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ ...tiny, color: '#3A3D44' }}>Coverage · 120+ rules</span>
        <span style={{ ...tiny, color: 'var(--accent-fg)', background: '#E8F0FE', padding: '2px 6px', borderRadius: '2px' }}>≈ ⅔ auto</span>
      </span>
      <span style={{ display: 'flex', gap: '2px', height: '10px' }}>
        {LAYERS.map((l) => (
          <span key={l.label} style={{ width: `${l.share}%`, borderRadius: '3px', background: l.fill, border: l.dashed ? '1.5px dashed #B8BCC4' : 0, boxSizing: 'border-box' }} />
        ))}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {LAYERS.map((l) => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', font: '500 11px/14px var(--font-sans)', color: '#3A3D44' }}>
            <span style={{ flexShrink: 0, width: '8px', height: '8px', borderRadius: '2px', background: l.fill, border: l.dashed ? '1.5px dashed #B8BCC4' : 0, boxSizing: 'border-box' }} />
            {l.label}
            <span style={{ ...tiny, marginLeft: 'auto', color: '#6B7080' }}>{l.how}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

export function BlogCover({ cover, style }: { cover: Cover; style?: CSSProperties }) {
  const [a, b, c, d] = LAYOUTS[cover].map(toStyle);
  const blob: CSSProperties = { position: 'absolute', width: '75%', height: '110%', borderRadius: '50%', pointerEvents: 'none' };
  return (
    <div
      aria-hidden="true"
      data-blog-cover
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
    >
      <span style={{ ...blob, ...a, background: 'var(--glow-cyan)', filter: 'blur(60px)', opacity: 0.8 }} />
      <span style={{ ...blob, ...b, background: 'var(--glow-blue)', filter: 'blur(70px)', opacity: 0.6 }} />
      <span style={{ ...blob, ...c, background: 'var(--glow-periwinkle)', filter: 'blur(60px)', opacity: 0.65 }} />
      <span style={{ ...blob, ...d, background: 'var(--glow-white)', filter: 'blur(50px)', opacity: 0.85 }} />
      <div data-blog-motif style={{ position: 'relative' }}>
        <Motif cover={cover} />
      </div>
    </div>
  );
}
