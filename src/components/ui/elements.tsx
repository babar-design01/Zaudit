'use client';

import type { CSSProperties, ReactNode } from 'react';
import { IconBox } from './Icon';
import { MaterialSymbol } from './primitives';

import { color, hairline, radius, shadow, staticColor, t, text, tracking } from '@/design/tokens';

/* ------------------------------------------------------------- arrow links */

/**
 * The "and then this" link — text plus the up-right arrow. It appears eight
 * times across the page, sometimes as an `<a>` to an anchor and sometimes as a
 * `<button>` that scrolls to the hero, so it takes either.
 *
 * The hover colour comes from the `hp-link-primary` rule in `globals.css`,
 * because inline styles cannot express `:hover`.
 */
export function ArrowLink({
  children,
  href,
  onClick,
  size = 'md',
  tone = 'fg',
  underline = false,
  iconSize,
  className = 'hp-link-primary',
  style,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  /** `sm` is the 13px variant on the audience cards. */
  size?: 'sm' | 'md' | 'lg';
  tone?: 'fg' | 'primary';
  /** The anatomy card underlines its link; nothing else does. */
  underline?: boolean;
  iconSize?: 'w-3' | 'w-4';
  /** Which hover rule from `globals.css` applies. Pricing's link fades to muted. */
  className?: string;
  style?: CSSProperties;
}) {
  /* `lg` is the anatomy card's link, which the design sets a weight lighter
     than the 600 the inline links use. */
  const font = size === 'sm' ? text.labelSm : size === 'lg' ? t(500, 15, 22) : text.labelStrong;
  const icon = iconSize ?? (size === 'sm' ? 'w-3' : 'w-4');

  const shared: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'lg' ? 8 : 6,
    font,
    color: tone === 'primary' ? color.primary : color.fg,
    ...(underline ? { textDecoration: 'underline', textUnderlineOffset: 4 } : null),
    ...style,
  };

  const body = (
    <>
      {children}
      <IconBox name="IconArrowUpRight" size={icon} />
    </>
  );

  if (href) {
    return (
      <a className={className} href={href} style={shared}>
        {body}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        alignSelf: 'flex-start',
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        ...shared,
      }}
    >
      {body}
    </button>
  );
}

/* --------------------------------------------------------------- icon tiles */

/**
 * The glyph holder above a card title. Two treatments in the design:
 *
 *  - `outline` — a bordered square whose glyph is filled with the brand gradient.
 *  - `gradient` — a filled circle, white glyph, used for the numbered steps.
 */
export function IconTile({
  icon,
  variant = 'outline',
  size = 42,
  glyphSize,
  fill,
  style,
}: {
  /** A Material Symbols Rounded ligature name. */
  icon: string;
  variant?: 'outline' | 'gradient';
  size?: number;
  glyphSize?: number;
  /** Overrides the gradient on a `gradient` tile — each step card has its own. */
  fill?: string;
  style?: CSSProperties;
}) {
  const glyph = glyphSize ?? (variant === 'gradient' ? 26 : 22);

  if (variant === 'gradient') {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          background: fill ?? color.gradient,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: shadow.sm,
          ...style,
        }}
      >
        <MaterialSymbol name={icon} style={{ fontSize: glyph, color: staticColor.white }} />
      </span>
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        border: hairline(),
        borderRadius: radius.sm,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: color.card,
        ...style,
      }}
    >
      <MaterialSymbol
        name={icon}
        style={{
          fontSize: glyph,
          background: color.gradient,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      />
    </span>
  );
}

/* --------------------------------------------------------- dots and markers */

/**
 * A small round marker. `bullet` is the filled dot in a list, `ring` the hollow
 * coloured circle on an audience card, `dot` the severity swatch in a count pill.
 */
export function Dot({
  variant = 'dot',
  size,
  tone = color.fg,
  style,
}: {
  variant?: 'dot' | 'bullet' | 'ring';
  size?: number;
  tone?: string;
  style?: CSSProperties;
}) {
  const px = size ?? (variant === 'ring' ? 14 : variant === 'bullet' ? 5 : 6);
  return (
    <span
      aria-hidden
      style={{
        width: px,
        height: px,
        flexShrink: 0,
        borderRadius: 999,
        ...(variant === 'ring'
          ? { border: `4px solid ${tone}` }
          : { background: tone }),
        ...style,
      }}
    />
  );
}

/* ---------------------------------------------------------------- data bits */

/**
 * An outlined pill carrying a count — the severity breakdown under the hero
 * score. The dot is optional so the same shape can hold a plain tag.
 */
export function CountPill({
  dot,
  children,
  style,
}: {
  dot?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        border: hairline(),
        borderRadius: 999,
        font: text.chip,
        color: color.fg,
        ...style,
      }}
    >
      {dot && <Dot tone={dot} />}
      {children}
    </span>
  );
}

/**
 * A horizontal progress track. The hero score fills it with the brand gradient;
 * the category cards fill it with foreground ink.
 */
export function Meter({
  value,
  size = 6,
  fill = color.gradient,
  track = color.muted,
  label,
  smooth = false,
  indeterminate = false,
  style,
}: {
  /** 0–100. Clamped, so a stray score cannot overflow the track. */
  value: number;
  size?: number;
  fill?: string;
  track?: string;
  /** Announced to assistive tech, which a bare pair of divs would not be. */
  label?: string;
  /** Eases between values, so a bar driven by one-second ticks does not jump. */
  smooth?: boolean;
  /** Rides a sliver across the track for work with no measurable position. */
  indeterminate?: boolean;
  style?: CSSProperties;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      // An indeterminate bar reports no value, which is what tells a screen
      // reader it is busy rather than at zero.
      aria-valuenow={indeterminate ? undefined : pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{
        height: size,
        background: track,
        borderRadius: 999,
        overflow: 'hidden',
        ...style,
      }}
    >
      {indeterminate ? (
        <div
          style={{
            height: '100%',
            width: '25%',
            background: fill,
            borderRadius: 999,
            animation: 'hp-track-sweep 1.5s ease-in-out infinite',
          }}
        />
      ) : (
        <div
          style={{
            height: '100%',
            background: fill,
            borderRadius: 999,
            width: pct + '%',
            ...(smooth ? { transition: 'width 900ms cubic-bezier(0.22, 1, 0.36, 1)' } : null),
          }}
        />
      )}
    </div>
  );
}

/**
 * A row of metadata separated by hairline rules — category, confidence and
 * evidence under a finding's title.
 */
export function MetaRow({
  items,
  style,
}: {
  items: ReactNode[];
  style?: CSSProperties;
}) {
  const shown = items.filter(Boolean);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        font: text.mono,
        color: color.mutedFg,
        ...style,
      }}
    >
      {shown.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {i > 0 && (
            <span aria-hidden style={{ width: 1, height: 12, background: color.border }} />
          )}
          {item}
        </span>
      ))}
    </div>
  );
}

/** The uppercase micro-label above a figure, as over the hero's score. */
export function FieldLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        font: text.eyebrow,
        letterSpacing: tracking.eyebrowWide,
        textTransform: 'uppercase',
        color: color.mutedFg,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
