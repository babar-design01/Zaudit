/**
 * Zaudit design tokens.
 *
 * The single typed source of truth for the values the homepage is built from.
 * Every number and string here already existed in `globals.css` or in a section's
 * inline styles — nothing is rounded, merged or "cleaned up". The design file is
 * still the authority; this module only gives those values names and types so
 * they stop being retyped by hand in twelve places.
 *
 * Colour, radius and shadow resolve through CSS custom properties so both themes
 * keep working. Spacing and type are literals, because the design pins them.
 */

/* ------------------------------------------------------------------ colour */

/** Themable colour roles. Values are `var(--…)` so `[data-theme]` still swaps them. */
export const color = {
  bg: 'var(--bg)',
  card: 'var(--card)',
  popover: 'var(--popover)',
  muted: 'var(--muted)',
  fg: 'var(--fg)',
  mutedFg: 'var(--muted-fg)',
  border: 'var(--border)',
  input: 'var(--input)',
  primary: 'var(--primary)',
  primaryFg: 'var(--primary-fg)',
  accent: 'var(--accent)',
  accentFg: 'var(--accent-fg)',
  secondary: 'var(--secondary)',
  secondaryFg: 'var(--secondary-fg)',
  destructive: 'var(--destructive)',
  destructiveFg: 'var(--destructive-fg)',
  ring: 'var(--ring)',
  /** The 100deg blue -> violet gradient. Used as a fill, a 2px frame and clipped text. */
  gradient: 'var(--grad)',
} as const;

/**
 * Colours the design states as literals rather than theme roles: the ink used on
 * the primary-blue CTA band, and the white it sits against. These do not flip
 * with the theme in the design, so they are not theme roles here either.
 */
export const staticColor = {
  white: '#FFFFFF',
  ink: '#16181D',
  /** Copy and rules over a primary-blue field. */
  onPrimary: 'rgba(255, 255, 255, 0.82)',
  onPrimaryDim: 'rgba(255, 255, 255, 0.75)',
  onPrimaryLine: 'rgba(255, 255, 255, 0.24)',
} as const;

/** Blend a theme colour toward another. Wraps the `color-mix` the sections already use. */
export function mix(from: string, percent: number, into: string = 'transparent'): string {
  return `color-mix(in oklab, ${from} ${percent}%, ${into})`;
}

/* ----------------------------------------------------------------- spacing */

/**
 * The spacing steps the design actually uses — in pixels, not step indices.
 * Mostly a 2px grid that thins out as it grows; the values from 24 up are the
 * section rhythm.
 *
 * These are the literal pixel values so that `gap={20}` means twenty pixels and
 * nothing has to be decoded. `Space` gives autocomplete over the scale while
 * still admitting an off-scale number, because the design has a few.
 */
export const SPACE = [
  0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 44, 48, 56, 64, 80, 88, 96, 104,
  128,
] as const;

export type SpaceValue = (typeof SPACE)[number];

/** A spacing value. On-scale values autocomplete; anything else still compiles. */
export type Space = SpaceValue | (number & {});

/* ------------------------------------------------------- radius and shadow */

export const radius = {
  sm: 'var(--radius-sm)', // 12
  md: 'var(--radius-md)', // 16
  lg: 'var(--radius-lg)', // 24
  full: 'var(--radius-full)', // 9999
  /** 10px — the testimonial portrait plate. The one radius outside the scale. */
  plate: 10,
} as const;

export const shadow = {
  none: 'none',
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  /** A 1px inset rule that takes no part in layout, as the outline Button/Badge use. */
  hairline: 'inset 0 0 0 1px var(--border)',
  hairlineRaised: 'inset 0 0 0 1px var(--border), var(--shadow-xs)',
} as const;

/* -------------------------------------------------------------- typography */

export const font = {
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  serif: 'var(--font-serif)',
} as const;

export type FontFamily = keyof typeof font;

/**
 * Compose a `font` shorthand from parts.
 *
 * The design carries near-duplicate steps — 13/18, 13/19, 13/20 and 13/21 all
 * appear. Those are transcribed as they are rather than snapped to a scale, so
 * `t()` exists to express one without inventing a ramp entry for it:
 *
 *   t(400, 13, 19)           -> '400 13px/19px var(--font-sans)'
 *   t(400, 26, 34, 'serif')  -> '400 26px/34px var(--font-serif)'
 *
 * A unitless line-height at or below 3 is passed through as a ratio, which is how
 * the clamped serif headings express theirs.
 */
export function t(
  weight: number,
  size: number | string,
  lineHeight: number | string,
  family: FontFamily = 'sans',
): string {
  const s = typeof size === 'number' ? `${size}px` : size;
  const lh = typeof lineHeight === 'number' && lineHeight > 3 ? `${lineHeight}px` : lineHeight;
  return `${weight} ${s}/${lh} ${font[family]}`;
}

/**
 * The type ramp, named by the job each step does on the page. Every value is one
 * already in use; the count in a comment is how many places used it before the
 * ramp existed, which is why those are the named steps and one-offs go through `t()`.
 */
export const text = {
  /* Serif — headlines. */
  /** Hero h1. */
  display: t(400, 'clamp(48px, 5vw, 74px)', 1.02, 'serif'),
  /** The closing CTA band. */
  displayCta: t(400, 'clamp(44px, 4.6vw, 64px)', 1.05, 'serif'),
  /** The oversized numeral in the proof section. */
  displayNumeral: t(400, 'clamp(84px, 12vw, 170px)', 1, 'serif'),
  /** The standard section h2. x6 */
  sectionTitle: t(400, 'clamp(34px, 3.4vw, 46px)', 1.05, 'serif'),
  /** Section h2 with room for two lines. */
  sectionTitleLoose: t(400, 'clamp(34px, 3.4vw, 46px)', 1.15, 'serif'),
  /** The FAQ heading, a half-step tighter. */
  sectionTitleFaq: t(400, 'clamp(34px, 3.2vw, 44px)', 1.12, 'serif'),
  /** The audited URL over the results. */
  resultTitle: t(400, 'clamp(30px, 3vw, 38px)', 1.08, 'serif'),
  /** The anatomy card's headline. */
  cardTitleLg: t(400, 'clamp(28px, 2.6vw, 36px)', 1.1, 'serif'),
  /** Each How-It-Works panel headline. */
  cardTitle: t(400, 'clamp(26px, 2.4vw, 34px)', 1.1, 'serif'),
  /** Pricing figure. */
  price: t(400, 54, 1, 'serif'),
  /** Pull quote / closing line. */
  quote: t(400, 26, 34, 'serif'),
  /** The brand line above a quote. */
  quoteBrand: t(400, 24, 30, 'serif'),
  /** Attribution name. */
  quoteName: t(400, 22, 28, 'serif'),
  /** Audience card title. */
  audienceTitle: t(400, 26, 1.15, 'serif'),

  /* Sans — body copy. */
  /** Hero subhead. */
  leadHero: t(400, 17, 29),
  /** CTA-band subhead. */
  leadCta: t(400, 17, 28),
  /** The standard section lead paragraph. x8 */
  lead: t(400, 16, 28),
  /** Long-form body. x5 */
  body: t(400, 15, 26),
  /** Compact body. x5 */
  bodySm: t(400, 14, 22),
  /** Tightest body. x5 */
  bodyXs: t(400, 13, 20),
  /** Supporting caption. x4 */
  caption: t(400, 13, 18),
  /** Fine print under a control. */
  fine: t(400, 12, 18),
  /** Smallest supporting line. */
  micro: t(400, 11, 16),

  /* Sans — labels and controls. */
  /** Control and list labels. x10 */
  label: t(500, 14, 20),
  /** Emphasised label / inline link. x6 */
  labelStrong: t(600, 14, 20),
  /** Dimension card title. */
  labelXl: t(600, 19, 24),
  /** Card subheading. */
  labelLg: t(600, 16, 22),
  /** Card subheading, serif-adjacent size. */
  labelMd: t(600, 15, 22),
  /** Small strong label. */
  labelSm: t(600, 13, 20),
  /** Metadata chip. x5 */
  chip: t(500, 12, 16),
  /** The uppercase eyebrow pill. x3 */
  eyebrow: t(600, 11, 16),
  /** The uppercase eyebrow set in primary rather than in a pill. */
  eyebrowPlain: t(600, 13, 18),

  /* Mono — measurements and provenance. */
  /** Evidence, timestamps, counts. x12 */
  mono: t(400, 12, 16, 'mono'),
  /** Provenance footers. x4 */
  monoXs: t(400, 11, 16, 'mono'),
  /** Step labels. */
  monoLabel: t(500, 13, 18, 'mono'),
  /** The 100-point score. */
  metricLg: t(500, 40, 1, 'mono'),
  /** A category score. */
  metric: t(500, 28, 1, 'mono'),
} as const;

export type TextStyle = keyof typeof text;

/** Letter-spacing steps the design pairs with the ramp. */
export const tracking = {
  display: '-0.01em',
  tight: '-0.2px',
  snug: '-0.1px',
  none: '0',
  wide: '0.015em',
  eyebrow: '0.06em',
  eyebrowWide: '0.08em',
} as const;

/* ------------------------------------------------------------------ layout */

export const layout = {
  /** Every section shares this measure. */
  container: 1152,
  /** Left and right gutter inside the container. */
  gutter: 32,
  /** Sticky header height, which in-page anchors have to clear. */
  navHeight: 56,
} as const;

/** The reading measures the design caps text at. */
export const measure = {
  hero: 820,
  heroLead: 560,
  section: 720,
  sectionNarrow: 620,
  card: 400,
  prose: 460,
} as const;

/* ------------------------------------------------------------------ motion */

export const motion = {
  fast: '.15s ease',
  rise: 'hp-rise 200ms ease both',
  riseSlow: 'hp-rise 240ms ease both',
  spin: 'hp-spin 700ms linear infinite',
  marquee: 'hp-marquee 55s linear infinite',
} as const;

/** A 1px border in a themed colour — the most repeated declaration on the page. */
export function hairline(c: string = color.border): string {
  return `1px solid ${c}`;
}
