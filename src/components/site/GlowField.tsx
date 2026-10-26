import type { CSSProperties, ReactNode } from 'react';
import { color } from '@/design/tokens';

/**
 * The glow field.
 *
 * A mist ground with four large blurred blobs — cyan top-left, blue right,
 * periwinkle low right, white low centre — drifting on 12 to 19 second loops.
 * It appears behind the customer-stories band, the closing statement, the
 * report's score card and the dialog backdrop, and nowhere else: the brand book
 * is explicit that the glows are decoration and never sit under body text
 * without a light of their own above them.
 *
 * The blobs are `aria-hidden` and animate only where motion is welcome; the
 * keyframes live in `globals.css` against `[data-blob]`.
 */
export function GlowField({
  children,
  style,
  tint,
}: {
  children?: ReactNode;
  style?: CSSProperties;
  /** A dark veil over the field, as the dialog backdrop uses at 28%. */
  tint?: number;
}) {
  const blob: CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: color.bgMist, ...style }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        <span data-blob="a" style={{ ...blob, left: '-8%', top: '-30%', width: 620, height: 620, background: color.glowCyan, opacity: 0.75 }} />
        <span data-blob="b" style={{ ...blob, right: '-10%', top: '-18%', width: 680, height: 680, background: color.glowBlue, opacity: 0.55, filter: 'blur(100px)' }} />
        <span data-blob="c" style={{ ...blob, right: '6%', bottom: '-34%', width: 560, height: 560, background: color.glowPeriwinkle, opacity: 0.6, filter: 'blur(90px)' }} />
        <span data-blob="d" style={{ ...blob, left: '26%', bottom: '-28%', width: 640, height: 640, background: color.glowWhite, opacity: 0.85, filter: 'blur(70px)' }} />
        {tint ? <span style={{ position: 'absolute', inset: 0, background: `rgba(10, 11, 13, ${tint})` }} /> : null}
      </div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}
