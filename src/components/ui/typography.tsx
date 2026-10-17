import type { CSSProperties, ElementType, ReactNode } from 'react';
import { color, measure, staticColor, text, tracking, type TextStyle } from '@/design/tokens';

/**
 * Where a piece of text sits on the page decides its colour, so tone is a role
 * rather than a colour: `inverse` is the ink used on the blue CTA band, `dim` the
 * translucent white beside it.
 */
export type TextTone =
  | 'fg'
  | 'muted'
  | 'primary'
  | 'accent'
  | 'destructive'
  | 'inverse'
  | 'onPrimary'
  | 'inverseDim';

const TONES: Record<TextTone, string> = {
  fg: color.fg,
  muted: color.mutedFg,
  primary: color.primary,
  accent: color.accentFg,
  destructive: color.destructive,
  inverse: staticColor.white,
  /** Body copy on the blue CTA band. */
  onPrimary: staticColor.onPrimary,
  /** The dimmer white the journey cards use for their supporting lines. */
  inverseDim: staticColor.onPrimaryDim,
};

export type MeasureName = keyof typeof measure;

type TypeProps = {
  /** A step from the ramp. Omit and pass `font` for a one-off. */
  variant?: TextStyle;
  /** Escape hatch for a step the ramp does not name — compose it with `t()`. */
  font?: string;
  tone?: TextTone;
  /** Overrides `tone` when the colour is computed, as the journey cards' is. */
  colorValue?: string;
  track?: keyof typeof tracking;
  /** Caps the line length. Named measures come from the design. */
  width?: MeasureName | number;
  /** `pretty` for paragraphs, `balance` for short centred headlines. */
  wrap?: 'pretty' | 'balance' | 'nowrap';
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
  italic?: boolean;
  as?: ElementType;
  children?: ReactNode;
  style?: CSSProperties;
};

function typeStyle({
  variant,
  font,
  tone,
  colorValue,
  track,
  width,
  wrap,
  align,
  uppercase,
  italic,
}: TypeProps): CSSProperties {
  const w = typeof width === 'number' ? width : width ? measure[width] : undefined;
  return {
    ...(variant || font ? { font: font ?? text[variant as TextStyle] } : null),
    ...(colorValue || tone ? { color: colorValue ?? TONES[tone as TextTone] } : null),
    ...(track ? { letterSpacing: tracking[track] } : null),
    ...(w != null ? { maxWidth: w } : null),
    ...(wrap === 'nowrap' ? { whiteSpace: 'nowrap' } : wrap ? { textWrap: wrap } : null),
    ...(align ? { textAlign: align } : null),
    ...(uppercase ? { textTransform: 'uppercase' } : null),
    ...(italic ? { fontStyle: 'italic' } : null),
  };
}

/**
 * Any run of text. Renders a `span` by default — pass `as="p"` for a paragraph,
 * which also drops the browser's default margin the way every section did by hand.
 */
export function Text({ as: Tag = 'span', children, style, ...rest }: TypeProps) {
  const isBlock = Tag === 'p' || Tag === 'div';
  return (
    <Tag style={{ ...(isBlock ? { margin: 0 } : null), ...typeStyle(rest), ...style }}>
      {children}
    </Tag>
  );
}

/**
 * A heading. `level` sets the tag — and so the document outline, which the audit
 * engine's own `dom-heading-skips` check would flag on this page if it drifted —
 * while `variant` sets the size, independently.
 */
export function Heading({
  level = 2,
  variant = 'sectionTitle',
  track = 'display',
  children,
  style,
  ...rest
}: TypeProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const Tag = `h${level}` as ElementType;
  return (
    <Tag style={{ margin: 0, ...typeStyle({ variant, track, ...rest }), ...style }}>{children}</Tag>
  );
}

/**
 * The uppercase kicker above a section heading. The design uses two treatments:
 * an accent-filled pill, and plain primary-blue text.
 */
export function Eyebrow({
  variant = 'pill',
  children,
  style,
}: {
  variant?: 'pill' | 'plain';
  children: ReactNode;
  style?: CSSProperties;
}) {
  if (variant === 'plain') {
    return (
      <span
        style={{
          font: text.eyebrowPlain,
          letterSpacing: tracking.eyebrow,
          textTransform: 'uppercase',
          color: color.primary,
          ...style,
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '5px 14px',
        background: color.accent,
        color: color.accentFg,
        borderRadius: 999,
        font: text.eyebrow,
        letterSpacing: tracking.eyebrowWide,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Text filled with the brand gradient. Needs a painted `color: transparent`, so
 * it is a component rather than a token — and it is `aria-hidden`-safe only
 * because the text stays real text underneath.
 */
export function GradientText({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        background: color.gradient,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * The section header block: kicker, headline, then a lead paragraph — the same
 * three-part opening on nine of the twelve sections, centred on two of them.
 */
export function SectionHeader({
  eyebrow,
  eyebrowVariant = 'pill',
  title,
  titleVariant = 'sectionTitle',
  level = 2,
  lead,
  align = 'start',
  width = 'section',
  children,
  style,
}: {
  eyebrow?: ReactNode;
  eyebrowVariant?: 'pill' | 'plain';
  title: ReactNode;
  titleVariant?: TextStyle;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  lead?: ReactNode;
  align?: 'start' | 'center';
  width?: MeasureName | number;
  /** Anything that follows the lead — a CTA row, usually. */
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const centred = align === 'center';
  const w = typeof width === 'number' ? width : measure[width];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: w,
        ...(centred ? { alignItems: 'center', margin: '0 auto', textAlign: 'center' } : null),
        ...style,
      }}
    >
      {eyebrow && (
        <Eyebrow
          variant={eyebrowVariant}
          style={centred ? undefined : { alignSelf: 'flex-start' }}
        >
          {eyebrow}
        </Eyebrow>
      )}
      <Heading level={level} variant={titleVariant} wrap="pretty">
        {title}
      </Heading>
      {lead && (
        <Text as="p" variant="lead" tone="muted" wrap="pretty">
          {lead}
        </Text>
      )}
      {children}
    </div>
  );
}
