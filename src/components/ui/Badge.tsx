import type { CSSProperties, ReactNode } from 'react';

const VARIANTS = {
  default: { background: 'var(--primary)', color: 'var(--primary-fg)' },
  secondary: { background: 'var(--secondary)', color: 'var(--secondary-fg)' },
  outline: {
    background: 'transparent',
    color: 'var(--fg)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
  },
  destructive: { background: 'var(--destructive)', color: '#fff' },
} as const;

/** Ports the design system's `Badge`. */
export function Badge({
  variant = 'default',
  children,
  style,
}: {
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        fontSize: 12,
        lineHeight: 1.5,
        letterSpacing: '0.015em',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
