import type { ComponentPropsWithRef, CSSProperties, ElementType, ReactNode, Ref } from 'react';
import { color, hairline, layout, radius, shadow, type Space } from '@/design/tokens';

/** Spacing in pixels. Values on the design's scale autocomplete; others still work. */
export type Gap = Space;

/* ------------------------------------------------------------------ shells */

export type SectionTone = 'default' | 'muted' | 'primary';

const SECTION_TONES: Record<SectionTone, CSSProperties> = {
  /** Sits on the page background. */
  default: {},
  /** The alternating grey band — every other section on the page. */
  muted: { background: color.muted },
  /** The closing CTA: primary blue, with the design's 64px pinstripe overlay. */
  primary: {
    background: color.primary,
    backgroundImage:
      'repeating-linear-gradient(90deg, transparent 0px, transparent 63px, rgba(255, 255, 255, 0.07) 63px, rgba(255, 255, 255, 0.07) 64px)',
  },
};

/**
 * A page section: the optional grey/blue field, and the hairline that separates
 * it from the next one. Sixteen places declared that border by hand before this.
 *
 * `Section` is only the band — put a `Container` inside it for the measure.
 */
export function Section({
  id,
  tone = 'default',
  divided = true,
  clip = false,
  children,
  style,
}: {
  id?: string;
  tone?: SectionTone;
  /** The 1px rule closing the section. The CTA band is the only one without it. */
  divided?: boolean;
  /** Clips overflowing children, as the marquee and the sticky panels need. */
  clip?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      id={id}
      style={{
        ...(divided ? { borderBottom: hairline() } : null),
        ...(clip ? { overflow: 'hidden' } : null),
        ...SECTION_TONES[tone],
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/** Every section shares this measure — 1152px wide, 32px gutters. */
export function Container({
  children,
  padY,
  style,
}: {
  children: ReactNode;
  /** Vertical padding. The gutter stays at the design's 32px either side. */
  padY?: Gap;
  style?: CSSProperties;
}) {
  const y = padY;
  return (
    <div
      style={{
        maxWidth: layout.container,
        margin: '0 auto',
        padding: y == null ? `0 ${layout.gutter}px` : `${y}px ${layout.gutter}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ flex and grid */

type FlexAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type FlexJustify = 'start' | 'center' | 'end' | 'between';

const ALIGN: Record<FlexAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  baseline: 'baseline',
  stretch: 'stretch',
};

const JUSTIFY: Record<FlexJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
};

/**
 * Anything not named here reaches the element, so `as="nav"` can carry an
 * `aria-label` and `as="a"` an `href` without the component knowing about them.
 */
type DomRest = Omit<ComponentPropsWithRef<'div'>, 'style' | 'children' | 'ref'> & {
  ref?: Ref<HTMLDivElement>;
};

export type StackProps = {
  gap?: Gap;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: boolean;
  as?: ElementType;
  children?: ReactNode;
  style?: CSSProperties;
} & DomRest;

/** A vertical flex column. The single most repeated layout on the page. */
export function Stack({
  gap,
  align,
  justify,
  as: Tag = 'div',
  children,
  style,
  ...rest
}: StackProps) {
  return (
    <Tag
      {...rest}
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...(gap != null ? { gap } : null),
        ...(align ? { alignItems: ALIGN[align] } : null),
        ...(justify ? { justifyContent: JUSTIFY[justify] } : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/** A horizontal flex row. */
export function Row({
  gap,
  align = 'center',
  justify,
  wrap,
  as: Tag = 'div',
  children,
  style,
  ...rest
}: StackProps) {
  return (
    <Tag
      {...rest}
      style={{
        display: 'flex',
        flexDirection: 'row',
        ...(gap != null ? { gap } : null),
        alignItems: ALIGN[align],
        ...(justify ? { justifyContent: JUSTIFY[justify] } : null),
        ...(wrap ? { flexWrap: 'wrap' } : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * An equal-column grid. `minmax(0, 1fr)` rather than `1fr` so long words and
 * `<pre>` snippets cannot force a column wider than its share.
 */
export function Grid({
  columns,
  gap,
  align,
  as: Tag = 'div',
  children,
  style,
  ...rest
}: {
  columns: number | string;
  gap?: Gap;
  align?: FlexAlign;
  as?: ElementType;
  children?: ReactNode;
  style?: CSSProperties;
} & DomRest) {
  return (
    <Tag
      {...rest}
      style={{
        display: 'grid',
        gridTemplateColumns:
          typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns,
        ...(gap != null ? { gap } : null),
        ...(align ? { alignItems: ALIGN[align] } : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Pushes what follows to the far end of a flex container — the trick every card
 * uses to pin its link to the bottom regardless of how long the copy runs.
 */
export function Spacer({ min }: { min?: number }) {
  return <div style={{ flex: 1, ...(min != null ? { minHeight: min } : null) }} />;
}

/** A hairline rule. Vertical ones are the separators between metadata chips. */
export function Divider({
  orientation = 'horizontal',
  length = 12,
  tone = color.border,
  style,
}: {
  orientation?: 'horizontal' | 'vertical';
  /** Height of a vertical rule. Horizontal ones fill their container. */
  length?: number;
  tone?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={
        orientation === 'vertical'
          ? { width: 1, height: length, background: tone, flexShrink: 0, ...style }
          : { display: 'block', height: 1, background: tone, ...style }
      }
    />
  );
}

/* ---------------------------------------------------------------- surfaces */

export type CardTone = 'card' | 'muted' | 'primary' | 'bare';

const CARD_TONES: Record<CardTone, CSSProperties> = {
  card: { background: color.card, color: color.fg },
  muted: { background: color.muted, color: color.fg },
  /** The emphasised journey step: blue field, white ink. */
  primary: { background: color.primary, color: '#FFFFFF' },
  bare: {},
};

/**
 * The bordered surface the page is mostly built from — fifteen of them before
 * this component existed, each restating the same four declarations.
 *
 * `border` accepts a colour so the emphasised journey card can pass its
 * translucent white rule without dropping out of the component.
 */
export function Card({
  tone = 'card',
  pad,
  stack,
  gap,
  radius: r = radius.lg,
  elevation = 'xs',
  border = true,
  clip = false,
  as: Tag = 'div',
  children,
  style,
  ...rest
}: {
  tone?: CardTone;
  /** Uniform padding, or a `[y, x]` pair. */
  pad?: Gap | [Gap, Gap];
  /** When set, the card is a flex column with this gap. Implies `stack`. */
  gap?: Gap;
  /** A flex column with no gap — for cards that space their own children. */
  stack?: boolean;
  radius?: string | number;
  elevation?: keyof typeof shadow;
  /** `true` for the standard hairline, a colour string for a custom rule, `false` for none. */
  border?: boolean | string;
  clip?: boolean;
  as?: ElementType;
  children?: ReactNode;
  style?: CSSProperties;
  /* Anything else — `ref`, `role`, `aria-*`, `tabIndex`, handlers — reaches the
     element, so a card can be a dialog, a link or a labelled region. */
} & DomRest) {
  const padding = Array.isArray(pad)
    ? `${pad[0]}px ${pad[1]}px`
    : pad != null
      ? pad
      : undefined;

  return (
    <Tag
      {...rest}
      style={{
        ...CARD_TONES[tone],
        ...(border ? { border: hairline(typeof border === 'string' ? border : undefined) } : null),
        borderRadius: r,
        boxShadow: shadow[elevation],
        ...(padding != null ? { padding } : null),
        ...(gap != null || stack
          ? { display: 'flex', flexDirection: 'column', ...(gap != null ? { gap } : null) }
          : null),
        ...(clip ? { overflow: 'hidden' } : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
