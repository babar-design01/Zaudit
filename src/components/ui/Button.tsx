'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { IconName } from './Icon';
import { color, radius as r, staticColor, text, tracking } from '@/design/tokens';

/**
 * The two button styles, and nothing else.
 *
 * The brand book allows a primary (ink fill, white label) and a secondary
 * (ghost fill, 1px inset outline, ink label), each in a normal and a small
 * size, each inverting on a dark or colour band. Labels are uppercase with
 * 0.1em tracking, corners are 2px — square on purpose — and **no button
 * carries an icon**.
 *
 * Hover, press and focus live in `globals.css` against `[data-cta]`, because an
 * inline style cannot express a state.
 */

const SIZES = {
  /** The label the brand book calls `button`: 14px, padding 16 × 24. */
  default: { font: text.button, padding: '16px 24px' },
  /** Nav and toolbars: the design file draws them at 14px with padding 11 × 20. */
  sm: { font: text.button, padding: '11px 20px' },
} as const;

type Tone = 'primary' | 'secondary';

export type ButtonProps = {
  variant?: Tone | LegacyVariant;
  size?: keyof typeof SIZES | LegacySize;
  disabled?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  fullWidth?: boolean;
  /** Set when the label alone does not say what the button does. */
  ariaLabel?: string;
  /** On a dark or colour band the primary inverts to a white fill. */
  onColour?: boolean;
  /** @deprecated The brand book puts no icons in buttons. Ignored. */
  iconStart?: IconName;
  /** @deprecated The brand book puts no icons in buttons. Ignored. */
  iconEnd?: IconName;
  /** @deprecated Corners are fixed at 2px. Ignored. */
  radius?: number | string;
  /** @deprecated Elevation comes from the variant. Ignored. */
  elevation?: string;
};

/* The old API had six variants and six sizes. They map onto the two that
   remain, so a section that has not been ported yet still renders a button
   the brand book would recognise. */
type LegacyVariant = 'outline' | 'ghost' | 'destructive' | 'ink' | 'onPrimary';
type LegacySize = 'lg' | 'pill' | 'cta' | 'xl';

const toneOf = (v: Tone | LegacyVariant): Tone =>
  v === 'secondary' || v === 'outline' || v === 'ghost' ? 'secondary' : 'primary';

const sizeOf = (s: keyof typeof SIZES | LegacySize): keyof typeof SIZES => (s === 'sm' ? 'sm' : 'default');

export function Button({
  variant = 'primary',
  size = 'default',
  disabled,
  children,
  style,
  onClick,
  type = 'button',
  className,
  fullWidth,
  ariaLabel,
  onColour,
}: ButtonProps) {
  const tone = toneOf(variant);
  const s = SIZES[sizeOf(size)];

  const skin: CSSProperties =
    tone === 'primary'
      ? onColour
        ? { background: staticColor.white, color: staticColor.ink }
        : { background: color.action, color: color.onAction }
      : onColour
        ? {
            background: 'rgba(255, 255, 255, 0.18)',
            color: staticColor.ink,
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.55)',
          }
        : {
            background: color.actionGhost,
            color: color.ink,
            boxShadow: `inset 0 0 0 1px ${color.actionOutline}`,
          };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
      data-cta={tone}
      data-on={onColour ? 'colour' : undefined}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        padding: s.padding,
        borderRadius: r.button,
        border: 'none',
        font: s.font,
        letterSpacing: tracking.button,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...(fullWidth ? { width: '100%' } : null),
        ...skin,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** The same two styles as a link, for actions that navigate. */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'default',
  children,
  style,
  fullWidth,
  onColour,
  ariaLabel,
}: Omit<ButtonProps, 'onClick' | 'type' | 'disabled'> & { href: string }) {
  const tone = toneOf(variant);
  const s = SIZES[sizeOf(size)];

  const skin: CSSProperties =
    tone === 'primary'
      ? onColour
        ? { background: staticColor.white, color: staticColor.ink }
        : { background: color.action, color: color.onAction }
      : onColour
        ? {
            background: 'rgba(255, 255, 255, 0.18)',
            color: staticColor.ink,
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.55)',
          }
        : {
            background: color.actionGhost,
            color: color.ink,
            boxShadow: `inset 0 0 0 1px ${color.actionOutline}`,
          };

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      data-cta={tone}
      data-on={onColour ? 'colour' : undefined}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: s.padding,
        borderRadius: r.button,
        font: s.font,
        letterSpacing: tracking.button,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...(fullWidth ? { width: '100%' } : null),
        ...skin,
        ...style,
      }}
    >
      {children}
    </a>
  );
}
