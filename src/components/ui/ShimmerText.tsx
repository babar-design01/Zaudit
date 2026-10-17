'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { color, text } from '@/design/tokens';

/**
 * Text with a highlight travelling along it — the "still working" treatment.
 *
 * The gradient is three times the width of the box so there is something to
 * slide; it is clipped to the glyphs, which is why the fill has to be painted
 * transparent. Reduced-motion readers get the text at rest, from the global
 * rule in `globals.css`.
 */
export function ShimmerText({
  children,
  font = text.labelStrong,
  style,
}: {
  children: React.ReactNode;
  font?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        font,
        backgroundImage: `linear-gradient(100deg, ${color.mutedFg} 20%, ${color.fg} 40%, ${color.fg} 60%, ${color.mutedFg} 80%)`,
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        animation: 'hp-shimmer 2.4s linear infinite',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Cycles through `lines`, one at a time, pausing `interval` on each.
 *
 * The list is reset whenever `resetKey` changes, so moving to a new audit stage
 * starts that stage's copy from the top rather than mid-rotation. The live
 * region is polite: a screen reader hears each line once it settles, and is not
 * interrupted mid-sentence by the next one.
 */
export function RotatingLines({
  lines,
  resetKey,
  interval = 2400,
  font = text.caption,
  style,
}: {
  lines: string[];
  resetKey?: string | number;
  interval?: number;
  font?: string;
  style?: CSSProperties;
}) {
  const [i, setI] = useState(0);

  useEffect(() => setI(0), [resetKey]);

  useEffect(() => {
    if (lines.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), interval);
    return () => clearInterval(id);
  }, [lines.length, interval, resetKey]);

  const line = lines[i] ?? lines[0] ?? '';

  return (
    <span
      aria-live="polite"
      style={{
        display: 'block',
        minHeight: 18,
        font,
        color: color.mutedFg,
        ...style,
      }}
    >
      {/* keyed so React remounts the span and the entry animation runs again */}
      <span key={`${resetKey}-${i}`} style={{ display: 'inline-block', animation: 'hp-line-in 320ms ease both' }}>
        {line}
      </span>
    </span>
  );
}
