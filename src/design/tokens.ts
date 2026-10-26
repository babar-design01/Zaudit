/**
 * Audix design tokens.
 *
 * The typed source of truth for the values the site is built from, transcribed
 * from `design-system/tokens.json` in the approved handoff. Colour, radius and
 * shadow resolve through CSS custom properties so both themes keep working;
 * spacing and type are literals, because the design pins them.
 *
 * Two rules from the brand book are encoded here rather than left to memory:
 * **nothing is rounder than 8px** (buttons are 2px, square on purpose), and
 * **blue is never a button fill** — the primary action is ink.
 */

/* ------------------------------------------------------------------ colour */

/** Themable colour roles. Values are `var(--…)` so `[data-theme]` still swaps them. */
export const color = {
  bg: 'var(--bg)',
  /** Quiet band behind grouped content. */
  bgSubtle: 'var(--bg-subtle)',
  /** Ground of the glow field. Never under body text without the glows above it. */
  bgMist: 'var(--bg-mist)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  /** Control outlines: inputs and toggles at rest. */
  borderStrong: 'var(--border-strong)',
  ink: 'var(--ink)',
  inkSecondary: 'var(--ink-secondary)',
  inkMuted: 'var(--ink-muted)',
  /** Primary button fill. One per view region. */
  action: 'var(--action)',
  onAction: 'var(--on-action)',
  actionOutline: 'var(--action-outline)',
  actionGhost: 'var(--action-ghost)',
  /** The single accent: eyebrows, figures, links, focus. Never a button fill. */
  blue: 'var(--blue)',
  blueTint: 'var(--blue-tint)',
  focus: 'var(--focus)',
  critical: 'var(--critical)',
  major: 'var(--major)',
  onCritical: 'var(--on-critical)',

  /* The glow field's four blobs. Decorative only. */
  glowCyan: 'var(--glow-cyan)',
  glowBlue: 'var(--glow-blue)',
  glowPeriwinkle: 'var(--glow-periwinkle)',
  glowWhite: 'var(--glow-white)',

  /* ---- legacy names, kept while the sections are ported one at a time ---- */
  /** @deprecated use `surface` */
  card: 'var(--surface)',
  /** @deprecated use `surface` */
  popover: 'var(--surface)',
  /** @deprecated use `bgSubtle` */
  muted: 'var(--bg-subtle)',
  /** @deprecated use `ink` */
  fg: 'var(--ink)',
  /** @deprecated use `inkMuted` */
  mutedFg: 'var(--ink-muted)',
  /** @deprecated use `borderStrong` */
  input: 'var(--border-strong)',
  /** @deprecated `blue` is the accent; `action` is the button fill */
  primary: 'var(--blue)',
  /** @deprecated use `onAction` */
  primaryFg: 'var(--on-action)',
  /** @deprecated use `blueTint` */
  accent: 'var(--blue-tint)',
  accentFg: 'var(--accent-fg)',
  /** @deprecated use `bgSubtle` */
  secondary: 'var(--bg-subtle)',
  /** @deprecated use `ink` */
  secondaryFg: 'var(--ink)',
  /** @deprecated use `critical` */
  destructive: 'var(--critical)',
  /** @deprecated use `onCritical` */
  destructiveFg: 'var(--on-critical)',
  ring: 'var(--focus)',
  /** The 100deg blue → violet gradient. The hero's URL frame, and nothing else. */
  gradient: 'var(--grad)',
} as const;

/**
 * Colours the design states as literals rather than theme roles: the ink the
 * logo is drawn in, the white it inverts to on dark, and the copy that sits on
 * a colour band.
 */
export const staticColor = {
  white: '#FFFFFF',
  ink: '#0A0B0D',
  /** Copy and rules over a colour or ink field. */
  onInk: 'rgba(255, 255, 255, 0.82)',
  onInkDim: 'rgba(255, 255, 255, 0.72)',
  onInkLine: 'rgba(255, 255, 255, 0.18)',
  /** @deprecated use `onInk` */
  onPrimary: 'rgba(255, 255, 255, 0.82)',
  /** @deprecated use `onInkDim` */
  onPrimaryDim: 'rgba(255, 255, 255, 0.72)',
  /** @deprecated use `onInkLine` */
  onPrimaryLine: 'rgba(255, 255, 255, 0.18)',
} as const;

/** Blend a theme colour toward another. Wraps the `color-mix` the sections use. */
export function mix(from: string, percent: number, into: string = 'transparent'): string {
  return `color-mix(in oklab, ${from} ${percent}%, ${into})`;
}

/* ----------------------------------------------------------------- spacing */

/**
 * The spacing scale, in pixels. `space-1` through `space-40` from the handoff,
 * with the in-between values the layouts actually use kept alongside them.
 */
export const SPACE = [
  0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 44, 48, 56, 64, 80, 88, 96, 104,
  128, 160,
] as const;

export type SpaceValue = (typeof SPACE)[number];

/** A spacing value. On-scale values autocomplete; anything else still compiles. */
export type Space = SpaceValue | (number & {});

/* ------------------------------------------------------- radius and shadow */

/**
 * Corners are 8px at most. The one exception is a status dot, which may be
 * round because it carries no content.
 */
export const radius = {
  /** Buttons, tabs, severity tags. Square on purpose. */
  button: 2,
  /** Badges, chips, small tags. */
  sm: 4,
  /** Inputs, toggles, small controls, inner tiles. */
  md: 6,
  /** The maximum: cards, panels, dialogs, accordion items, icon wells. */
  lg: 8,
  /** A 6px status dot, and decorative blobs. Nothing with content. */
  full: 9999,
  /** @deprecated use `lg` — kept while sections are ported */
  plate: 8,
} as const;

export const shadow = {
  none: 'none',
  /** Raised panels: the paid plans, the active step card. */
  raise: 'var(--shadow-raise)',
  /** Cards on hover, with a 6px lift. */
  hover: 'var(--shadow-hover)',
  /** Product mocks floating over a colour panel. */
  float: 'var(--shadow-float)',
  /** @deprecated use `raise` */
  xs: 'var(--shadow-raise)',
  /** @deprecated use `raise` */
  sm: 'var(--shadow-raise)',
  /** @deprecated use `hover` */
  md: 'var(--shadow-hover)',
  /** @deprecated use `float` */
  lg: 'var(--shadow-float)',
  /** A 1px inset rule that takes no part in layout. */
  hairline: 'inset 0 0 0 1px var(--border)',
  hairlineRaised: 'inset 0 0 0 1px var(--border), var(--shadow-raise)',
} as const;

/* -------------------------------------------------------------- typography */

/** One family. The brand book allows no second typeface. */
export const font = {
  sans: 'var(--font-sans)',
  /** @deprecated Audix is one typeface; kept so unported files still compile. */
  mono: 'var(--font-sans)',
  /** @deprecated Audix is one typeface; kept so unported files still compile. */
  serif: 'var(--font-sans)',
} as const;

export type FontFamily = keyof typeof font;

/**
 * Compose a `font` shorthand from parts.
 *
 *   t(400, 15, 24)      -> '400 15px/24px var(--font-sans)'
 *   t(800, 70, 1.04)    -> '800 70px/1.04 var(--font-sans)'
 *
 * A unitless line-height at or below 3 is passed through as a ratio.
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
 * The type ramp from `tokens.json`, named by the job each step does. Headings
 * are 800 with tight tracking; body is 400; labels are 600 uppercase with
 * tracking, which `tracking` below supplies.
 */
export const text = {
  /* Display — closing statements and headlines. */
  /** Closing statements on the glow field. Two lines at most. */
  display: t(500, 'clamp(40px, 5vw, 72px)', 1.1),
  /** Hero headline, once per page. */
  h1: t(800, 'clamp(40px, 4.8vw, 70px)', 1.04),
  /** Section headline. */
  h2: t(800, 'clamp(30px, 3.1vw, 44px)', 1.08),
  /** Figures in story cards and reports, in blue. */
  stat: t(600, 'clamp(32px, 2.9vw, 42px)', 1),

  /* Text. */
  /** Card and step titles. */
  h3: t(700, 20, 28),
  /** Customer quotes. */
  quote: t(500, 'clamp(19px, 1.7vw, 24px)', 1.45),
  /** Lead paragraphs under display and h1. */
  bodyLg: t(400, 18, 30),
  /** Card descriptions, answers. */
  body: t(400, 15, 24),
  /** Plan descriptions, list items, footer links. */
  small: t(400, 14, 22),

  /* Labels — uppercase, with tracking. */
  /** Section eyebrow above h2. */
  eyebrow: t(600, 11, 16),
  /** Every button label. */
  button: t(600, 14, 20),
  /** Nav and toolbar buttons. */
  buttonSm: t(600, 12, 16),
  /** Badges and severity tags. */
  badge: t(700, 10, 14),

  /* ---- legacy names, kept while the sections are ported ---- */
  /** @deprecated use `display` */
  displayCta: t(500, 'clamp(36px, 4.4vw, 64px)', 1.1),
  /** @deprecated use `stat` */
  displayNumeral: t(600, 'clamp(56px, 8vw, 110px)', 1),
  /** @deprecated use `h2` */
  sectionTitle: t(800, 'clamp(30px, 3.1vw, 44px)', 1.08),
  /** @deprecated use `h2` */
  sectionTitleLoose: t(800, 'clamp(30px, 3.1vw, 44px)', 1.14),
  /** @deprecated use `h2` */
  sectionTitleFaq: t(800, 'clamp(28px, 2.9vw, 40px)', 1.1),
  /** @deprecated use `h2` */
  resultTitle: t(800, 'clamp(26px, 2.4vw, 34px)', 1.1),
  /** @deprecated use `h3` */
  cardTitleLg: t(700, 'clamp(22px, 2vw, 28px)', 1.2),
  /** @deprecated use `h3` */
  cardTitle: t(700, 'clamp(20px, 1.8vw, 24px)', 1.25),
  /** @deprecated use `stat` */
  price: t(800, 42, 1),
  /** @deprecated use `quote` */
  quoteBrand: t(700, 18, 26),
  /** @deprecated use `h3` */
  quoteName: t(700, 16, 22),
  /** @deprecated use `h3` */
  audienceTitle: t(700, 20, 28),
  /** @deprecated use `bodyLg` */
  leadHero: t(400, 17, 29),
  /** @deprecated use `bodyLg` */
  leadCta: t(400, 17, 28),
  /** @deprecated use `bodyLg` */
  lead: t(400, 16, 28),
  /** @deprecated use `small` */
  bodySm: t(400, 14, 22),
  /** @deprecated use `small` */
  bodyXs: t(400, 13, 20),
  /** @deprecated use `small` */
  caption: t(400, 13, 18),
  /** @deprecated use `small` */
  fine: t(400, 12, 18),
  /** @deprecated use `badge` */
  micro: t(400, 11, 16),
  /** @deprecated use `small` */
  label: t(500, 14, 20),
  /** @deprecated use `h3` */
  labelStrong: t(600, 14, 20),
  /** @deprecated use `h3` */
  labelXl: t(700, 19, 26),
  /** @deprecated use `h3` */
  labelLg: t(700, 16, 22),
  /** @deprecated use `h3` */
  labelMd: t(600, 15, 22),
  /** @deprecated use `h3` */
  labelSm: t(600, 13, 20),
  /** @deprecated use `badge` */
  chip: t(600, 12, 16),
  /** @deprecated use `eyebrow` */
  eyebrowPlain: t(600, 13, 18),
  /** @deprecated Audix has no mono face */
  mono: t(500, 12, 16),
  /** @deprecated Audix has no mono face */
  monoXs: t(500, 11, 16),
  /** @deprecated Audix has no mono face */
  monoLabel: t(600, 13, 18),
  /** @deprecated use `stat` */
  metricLg: t(600, 40, 1),
  /** @deprecated use `stat` */
  metric: t(600, 28, 1),
} as const;

export type TextStyle = keyof typeof text;

/** Letter-spacing steps the design pairs with the ramp. */
export const tracking = {
  /** Display and h1. */
  display: '-0.035em',
  /** h2 and stat. */
  tight: '-0.03em',
  /** h3 and quote. */
  snug: '-0.02em',
  none: '0',
  /** Eyebrows. */
  eyebrow: '0.06em',
  /** Badges and severity tags. */
  badge: '0.08em',
  /** Every button label. */
  button: '0.1em',
  /** @deprecated use `button` */
  wide: '0.1em',
  /** @deprecated use `button` */
  eyebrowWide: '0.1em',
} as const;

/* ------------------------------------------------------------------ layout */

export const layout = {
  /** Section container max width. */
  frame: 1440,
  /** Content width inside the frame, at 1440 with 80px margins. */
  content: 1280,
  /** The side margin, which shrinks to 16px on a phone. */
  gutter: 'clamp(16px, 5.56vw, 80px)',
  /** Sticky header height, which in-page anchors have to clear. */
  navHeight: 72,
  /** @deprecated use `frame` with `gutter` */
  container: 1440,
} as const;

/** Section vertical rhythm. */
export const band = {
  /** Every ordinary section. */
  section: 80,
  /** Hero and story band. */
  tall: 96,
  /** The glow field. */
  glow: 160,
} as const;

/** The reading measures the design caps text at. */
export const measure = {
  hero: 820,
  heroLead: 560,
  /** The section intro's heading column. */
  heading: 680,
  /** The section intro's description column. */
  description: 440,
  section: 720,
  sectionNarrow: 620,
  card: 400,
  prose: 460,
} as const;

/* ------------------------------------------------------------------ motion */

export const motion = {
  fast: '.2s ease',
  /** The house curve: everything that moves uses it. */
  ease: 'cubic-bezier(.2,.7,.2,1)',
  rise: 'ax-up .9s cubic-bezier(.2,.7,.2,1) both',
  riseSlow: 'ax-up 1.1s cubic-bezier(.2,.7,.2,1) both',
  spin: 'ax-spin 700ms linear infinite',
  marquee: 'ax-marquee 55s linear infinite',
} as const;

/** A 1px border in a themed colour — the most repeated declaration on the page. */
export function hairline(c: string = color.border): string {
  return `1px solid ${c}`;
}
