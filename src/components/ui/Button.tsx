'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { color, motion, radius as r, shadow, staticColor, text } from '@/design/tokens';

const SIZES = {
  sm: { height: 32, padding: '8px 12px', gap: 8, font: 14, weight: 500, lh: '20px' },
  default: { height: 36, padding: '8px 16px', gap: 8, font: 14, weight: 500, lh: '20px' },
  lg: { height: 40, padding: '8px 24px', gap: 8, font: 14, weight: 500, lh: '20px' },
  /** The action inside the FAQ's blue helper card. */
  pill: { height: 44, padding: '12px 20px', gap: 8, font: 14, weight: 500, lh: '20px' },
  /** The full-width action at the foot of a pricing card. */
  cta: { height: 52, padding: 0, gap: 10, font: 15, weight: 500, lh: '22px' },
  /** The closing CTA. Taller, and the one button the design does not set as a pill. */
  xl: { height: 54, padding: '16px 28px', gap: 10, font: 15, weight: 600, lh: '22px' },
} as const;

const VARIANTS = {
  primary: {
    background: color.primary,
    color: color.primaryFg,
    boxShadow: shadow.xs,
  },
  secondary: {
    background: color.secondary,
    color: color.secondaryFg,
    boxShadow: shadow.xs,
  },
  outline: {
    background: color.bg,
    color: color.fg,
    boxShadow: shadow.hairlineRaised,
  },
  ghost: { background: 'transparent', color: color.fg },
  destructive: {
    background: color.destructive,
    color: staticColor.white,
    boxShadow: shadow.xs,
  },
  /** Near-black on the blue CTA band, where a primary button would disappear. */
  ink: { background: staticColor.ink, color: staticColor.white },
  /** The inverse of `primary`, for use on a blue field: white plate, blue label. */
  onPrimary: { background: color.primaryFg, color: color.primary },
} as const;

export type ButtonProps = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  disabled?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  children?: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
  /** Carries the hover rules from `globals.css`, which inline styles cannot express. */
  className?: string;
  /** The design pins buttons to pills; the `xl` CTA is the exception, at 12px. */
  radius?: number | string;
  fullWidth?: boolean;
  /** Overrides the variant's shadow. The pricing CTA carries none. */
  elevation?: keyof typeof shadow;
  /** Set when the label alone does not say what the button does. */
  ariaLabel?: string;
};

/**
 * Ports the design system's `Button`. The prototype pinned every button to a pill
 * with a global `button { border-radius: 999px !important }`, so that radius is
 * the default here rather than being imposed on every button in the app — and
 * `radius` opens it back up for the one button the design shapes differently.
 */
export function Button({
  variant = 'primary',
  size = 'default',
  disabled,
  iconStart,
  iconEnd,
  children,
  style,
  onClick,
  type = 'button',
  className,
  radius = 999,
  fullWidth,
  elevation,
  ariaLabel,
}: ButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: s.gap,
        boxSizing: 'border-box',
        height: s.height,
        padding: s.padding,
        borderRadius: radius,
        border: 'none',
        fontFamily: 'var(--font-sans)',
        fontWeight: s.weight,
        fontSize: s.font,
        lineHeight: s.lh,
        whiteSpace: 'nowrap',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...(fullWidth ? { width: '100%' } : null),
        transition: `background-color ${motion.fast}, box-shadow ${motion.fast}, opacity ${motion.fast}`,
        ...v,
        ...(elevation ? { boxShadow: shadow[elevation] } : null),
        ...style,
      }}
    >
      {iconStart && <Icon name={iconStart} size={16} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={16} />}
    </button>
  );
}
