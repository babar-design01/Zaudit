import type { CSSProperties, ReactNode } from 'react';
import { color, mix, radius, t } from '@/design/tokens';
import type { Severity, SeverityLabel } from '@/lib/audit/types';

/**
 * Severity is the one piece of product vocabulary the design gives its own
 * colour scale, so the mapping lives here rather than in the two sections that
 * render it.
 *
 * Only Critical earns the destructive red outright. High borrows a fifth of it
 * for its rule, and Medium and Low stay neutral — the scale is deliberately
 * quiet, so that a page with one Critical finding reads as one problem rather
 * than a wall of red.
 */
/** Nielsen's 0–4 scale, mapped onto the four labels the design gives a colour. */
export const SEVERITY_SCALE: Record<Severity, SeverityLabel> = { 4: 'Critical', 3: 'High', 2: 'Medium', 1: 'Low', 0: 'Low' };

export const SEVERITY_COLORS: Record<SeverityLabel, { fg: string; bg: string; line: string }> = {
  Critical: {
    fg: color.destructive,
    bg: mix(color.destructive, 10, color.card),
    line: mix(color.destructive, 35, color.border),
  },
  High: {
    fg: color.fg,
    bg: color.muted,
    line: mix(color.destructive, 20, color.border),
  },
  Medium: { fg: color.mutedFg, bg: color.card, line: color.border },
  Low: { fg: color.mutedFg, bg: color.card, line: color.border },
};

/** The dot used in the hero's severity counts — the same scale, reduced to a swatch. */
export const SEVERITY_DOTS: Record<SeverityLabel, string> = {
  Critical: color.destructive,
  High: mix(color.destructive, 55, color.muted),
  Medium: color.mutedFg,
  Low: color.border,
};

/** The outlined tag naming a finding's severity. */
export function SeverityTag({
  severity,
  children,
  style,
}: {
  severity: SeverityLabel;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const c = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.Medium;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        borderRadius: radius.full,
        whiteSpace: 'nowrap',
        font: t(500, 12, 18),
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.line}`,
        ...style,
      }}
    >
      {children ?? severity}
    </span>
  );
}
