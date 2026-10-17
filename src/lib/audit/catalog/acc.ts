import type { Family, RuleDef } from '../contract';

/**
 * FAMILY: ACCESSIBILITY  |  weight: 25  |  prefix: ACC
 *
 * Transcribed from the rule catalog. `whyItMatters` and `fix` are the catalog's
 * own words; the engine fills the `{placeholders}` from evidence and changes
 * nothing else. How each rule is measured lives in `rules/acc.ts`.
 */

const F = 'ACC';

const rules: RuleDef[] = [
  {
    id: 'ACC-001',
    family: F,
    name: 'Body text contrast below minimum',
    layer: 'L1',
    signal: 'computed contrast ratio of text node vs its effective background',
    threshold: 'ratio < 4.5 for text < 24px (or < 19px bold)',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.95,
    effort: 'trivial',
    doNotFireWhen: [
      'text is disabled state (aria-disabled or :disabled)',
      'text is part of a logo or brand wordmark',
      'text is decorative and aria-hidden="true"',
      'background is an image AND the text sits on a scrim already passing',
    ],
    evidenceFields: ['selector', 'screenshot_bbox', 'observed_ratio', 'foreground_hex', 'background_hex'],
    whyItMatters:
      'Low-contrast text is unreadable in sunlight, on low-end screens, and for the ~8% of users with reduced color vision. It is also the single most common legal accessibility complaint.',
    fix:
      'Darken {foreground_hex} to {suggested_hex} (nearest value on the brand ramp reaching 4.5:1 against {background_hex}), or lighten the background. Do not fix by increasing font-weight alone.',
  },
  {
    id: 'ACC-002',
    family: F,
    name: 'Large text contrast below minimum',
    layer: 'L1',
    signal: 'computed contrast ratio for text >= 24px, or >= 19px bold',
    threshold: 'ratio < 3.0',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.95,
    effort: 'trivial',
    doNotFireWhen: ['element is a logo/wordmark', 'text is aria-hidden decorative'],
    evidenceFields: ['selector', 'screenshot_bbox', 'observed_ratio', 'font_size', 'font_weight'],
    whyItMatters:
      "Headlines carry the page's primary message. If they fail contrast, the value proposition is lost before the user reads a word.",
    fix: 'Adjust {foreground_hex} to reach >= 3.0 against {background_hex}.',
  },
  {
    id: 'ACC-003',
    family: F,
    name: 'UI component boundary contrast below minimum',
    layer: 'L1',
    signal:
      'contrast of input borders, toggle tracks, checkbox outlines, icon-only controls vs adjacent background',
    threshold: 'ratio < 3.0',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.85,
    effort: 'trivial',
    doNotFireWhen: [
      'component has a filled background that itself passes 3:1',
      'component is in a disabled state',
    ],
    evidenceFields: ['selector', 'screenshot_bbox', 'observed_ratio', 'component_role'],
    whyItMatters:
      'If users cannot see where a field begins, they cannot tell the form is interactive. Borderless inputs are the most common cause.',
    fix: 'Set border color to {suggested_hex} (>= 3:1) or add a 1px inner stroke.',
  },
  {
    id: 'ACC-004',
    family: F,
    name: 'Input missing programmatic label',
    layer: 'L1',
    signal: 'form control with no <label for>, aria-label, aria-labelledby, or title',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'critical',
    confidenceFloor: 0.95,
    effort: 'trivial',
    doNotFireWhen: [
      'input is type="hidden"',
      'field is a honeypot (aria-hidden, visually hidden, tabindex=-1)',
      'control is wrapped by a <label> element',
    ],
    evidenceFields: ['selector', 'screenshot_bbox', 'input_type', 'placeholder_text'],
    whyItMatters:
      'Screen reader users hear an unlabelled field as "edit text" with no indication of what to type. The form becomes uncompletable.',
    fix:
      'Add <label for="{id}">{visible_text}</label>. If the design uses placeholder-only fields, convert to a floating or top-aligned label. Placeholder text is NOT a label — it disappears on focus.',
  },
  {
    id: 'ACC-005',
    family: F,
    name: 'Focus indicator suppressed',
    layer: 'L1',
    signal:
      'interactive element with outline:none / outline:0 and no replacement :focus-visible style (no box-shadow, border, or bg change)',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'critical',
    confidenceFloor: 0.9,
    effort: 'small',
    doNotFireWhen: [
      'element defines a :focus-visible rule with a visible delta',
      'element is not keyboard reachable by design and has tabindex="-1"',
    ],
    evidenceFields: ['selector', 'screenshot_bbox', 'computed_focus_styles'],
    whyItMatters:
      'Keyboard and switch users lose their place entirely. They cannot tell which control will activate on Enter.',
    fix:
      'Replace with:\n:focus-visible { outline: 2px solid {focus_color}; outline-offset: 2px; }\nNever ship outline:none without a replacement.',
  },
  {
    id: 'ACC-006',
    family: F,
    name: 'Focus indicator contrast insufficient',
    layer: 'L1',
    signal: 'contrast of focus ring vs both the component and the page background',
    threshold: 'ratio < 3.0 against either',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.85,
    effort: 'trivial',
    doNotFireWhen: ['focus style uses a 2px+ double-tone ring where one tone passes'],
    evidenceFields: ['selector', 'screenshot_bbox', 'ring_color', 'observed_ratio'],
    whyItMatters: 'A focus ring that cannot be seen is the same as no focus ring.',
    fix:
      'Change ring color to {suggested_hex}, or add a 1px white inner ring so it survives on both light and dark surfaces.',
  },
  {
    id: 'ACC-007',
    family: F,
    name: 'DOM order does not match visual order',
    layer: 'L2',
    signal:
      'tab sequence compared against visual reading order derived from bounding box positions (top-to-bottom, then start-to-end)',
    threshold: '>= 2 consecutive tab stops out of visual sequence',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.8,
    effort: 'medium',
    doNotFireWhen: [
      'reordering is caused by an open modal or drawer (expected)',
      'layout is a CSS grid with an intentional, documented order',
    ],
    evidenceFields: ['tab_sequence_array', 'visual_sequence_array', 'screenshot_bbox'],
    whyItMatters:
      'Keyboard users jump around the page unpredictably, which makes multi-step flows feel broken.',
    fix:
      'Reorder the DOM to match the visual layout. Use CSS order/grid placement for the visual arrangement instead of reordering markup.',
  },
  {
    id: 'ACC-008',
    family: F,
    name: 'Informative image missing alt text',
    layer: 'L1',
    signal: '<img> or role="img" carrying information, with missing or empty alt',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.8,
    effort: 'trivial',
    doNotFireWhen: [
      'image is decorative (alt="" AND no adjacent text dependency)',
      'image is a CSS background with no semantic role',
      'adjacent caption already conveys the same information',
    ],
    evidenceFields: ['selector', 'screenshot_bbox', 'image_src', 'surrounding_text'],
    whyItMatters:
      'Product images, charts and diagrams become invisible. On e-commerce this directly blocks purchase decisions.',
    fix:
      'Add alt describing the image\'s PURPOSE in context, not its appearance.\nProduct: "{product_name}, {key_visual_attribute}".\nChart: state the takeaway, not "chart".',
  },
  {
    id: 'ACC-009',
    family: F,
    name: 'Decorative image announced to screen readers',
    layer: 'L1',
    signal: 'decorative image with non-empty alt, or filename-as-alt',
    threshold: 'alt matches filename pattern, or duplicates adjacent text',
    pageTypes: 'all',
    severityBase: 'low',
    confidenceFloor: 0.8,
    effort: 'trivial',
    doNotFireWhen: ['image carries information not present in adjacent text'],
    evidenceFields: ['selector', 'alt_value', 'adjacent_text'],
    whyItMatters:
      'Screen reader users hear "hero-bg-final-v3-dot-png" between every sentence, which makes the page exhausting to listen to.',
    fix: 'Set alt="" and add role="presentation" for purely decorative images.',
  },
  {
    id: 'ACC-010',
    family: F,
    name: 'Heading level skipped',
    layer: 'L1',
    signal: 'heading sequence where a level jumps by more than one (h2 -> h4)',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.95,
    effort: 'trivial',
    doNotFireWhen: [
      'the skip occurs inside an isolated landmark (aside, footer) with its own heading root',
    ],
    evidenceFields: ['heading_map', 'selector', 'screenshot_bbox'],
    whyItMatters:
      'Screen reader users navigate by heading level. A broken outline makes the page impossible to skim.',
    fix:
      'Change {selector} from h{observed} to h{expected}. Style with CSS, not by choosing a different heading level.',
  },
  {
    id: 'ACC-011',
    family: F,
    name: 'Missing or duplicate h1',
    layer: 'L1',
    signal: 'count of h1 elements in main landmark',
    threshold: 'count != 1',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.9,
    effort: 'trivial',
    doNotFireWhen: [
      'page uses multiple <section> elements each with their own heading root under HTML5 outline (still warn at low severity)',
    ],
    evidenceFields: ['h1_count', 'h1_values', 'screenshot_bbox'],
    whyItMatters:
      'The h1 is the page\'s answer to "where am I". Missing it also weakens search ranking.',
    fix: "Promote {selector} to h1 with text matching the page's primary purpose.",
  },
  {
    id: 'ACC-012',
    family: F,
    name: 'Target size below minimum',
    layer: 'L1',
    signal: 'computed width/height of interactive element including padding',
    threshold: 'FAIL below 24x24 CSS px (WCAG 2.2 minimum); WARN below 44x44 CSS px (recommended)',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.9,
    effort: 'small',
    doNotFireWhen: [
      'target is an inline link inside a sentence of body text',
      'an equivalent larger control exists on the same page',
      'spacing around the target gives >= 24px of exclusive tap area',
    ],
    evidenceFields: ['selector', 'screenshot_bbox', 'computed_w', 'computed_h'],
    whyItMatters:
      'Small targets cause mis-taps, and mis-taps on destructive or commercial actions cause abandonment.',
    fix: 'Increase to min 44x44 via padding (not margin), keeping the visual icon size unchanged.',
  },
  {
    id: 'ACC-013',
    family: F,
    name: 'Information conveyed by color alone',
    layer: 'L2',
    signal:
      'status/validation/legend elements differing only in color with no icon, text label, shape or pattern delta',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.75,
    effort: 'small',
    doNotFireWhen: [
      'a text label or icon accompanies the color',
      'color is redundant decoration for already-labelled content',
    ],
    evidenceFields: ['selector_group', 'screenshot_bbox', 'color_values', 'text_content'],
    whyItMatters:
      'Red/green states are indistinguishable for color-blind users. On forms this means they cannot tell which field failed.',
    fix:
      'Add an icon and text label alongside the color. Error states get an icon plus the message; charts get direct labels or patterns.',
    subjective: true,
  },
  {
    id: 'ACC-014',
    family: F,
    name: 'Missing or incorrect lang attribute',
    layer: 'L1',
    signal: '<html lang> absent, empty, or not a valid BCP-47 tag',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.98,
    effort: 'trivial',
    doNotFireWhen: [],
    evidenceFields: ['html_attributes'],
    whyItMatters:
      'Screen readers pronounce the page in the wrong language, rendering it unintelligible.',
    fix:
      'Add lang="{detected_language}" to the <html> element. Mark inline foreign-language passages with their own lang attribute.',
  },
  {
    id: 'ACC-015',
    family: F,
    name: 'Non-descriptive page title',
    layer: 'L1',
    signal:
      '<title> missing, generic ("Home", "Untitled", "React App"), duplicated across audited pages, or > 60 chars',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.85,
    effort: 'trivial',
    doNotFireWhen: [],
    evidenceFields: ['title_value', 'duplicate_urls'],
    whyItMatters:
      'The title is what users read in tab strips, bookmarks and search results. Generic titles lose the click.',
    fix: 'Use the pattern "{Page purpose} | {Brand}", unique per page, under 60 chars.',
  },
  {
    id: 'ACC-016',
    family: F,
    name: 'Non-descriptive link text',
    layer: 'L2',
    signal:
      'link text matching [click here, read more, learn more, here, this, more, link, >>], or link text = raw URL',
    threshold: '>= 2 occurrences, or any occurrence where 2+ such links differ in destination',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.8,
    effort: 'trivial',
    doNotFireWhen: [
      'link has an aria-label giving a descriptive name',
      'link is inside a card where the heading is the accessible name',
    ],
    evidenceFields: ['selector', 'link_text', 'href', 'screenshot_bbox'],
    whyItMatters:
      'Screen reader users pull up a list of links out of context. Five links named "learn more" are five dead ends.',
    fix: 'Rewrite to name the destination, e.g. "Read the pricing breakdown".',
  },
  {
    id: 'ACC-017',
    family: F,
    name: 'Reduced-motion preference ignored',
    layer: 'L1',
    signal:
      'animations/transitions > 300ms or transform-based motion present with no @media (prefers-reduced-motion: reduce) block',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.85,
    effort: 'small',
    doNotFireWhen: ['all motion is under 200ms opacity-only'],
    evidenceFields: ['selector', 'animation_properties', 'stylesheet_ref'],
    whyItMatters:
      'Parallax and large motion trigger nausea and migraine for users with vestibular disorders. They leave and do not return.',
    fix:
      '@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: 0.01ms !important;\n    transition-duration: 0.01ms !important;\n    scroll-behavior: auto !important;\n  }\n}',
  },
  {
    id: 'ACC-018',
    family: F,
    name: 'Autoplaying media without control',
    layer: 'L1',
    signal: 'video/audio with autoplay, duration > 5s, and no visible pause/stop control',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.9,
    effort: 'small',
    doNotFireWhen: ['media is muted, loops under 5s, and is purely decorative background'],
    evidenceFields: ['selector', 'media_src', 'duration', 'has_controls'],
    whyItMatters:
      'Unstoppable motion or sound competes with screen readers and makes the page unusable for users with attention or cognitive conditions.',
    fix:
      'Add a visible pause control within the first tab stop, or set the media to play only on user activation.',
  },
  {
    id: 'ACC-019',
    family: F,
    name: 'Flashing content',
    layer: 'L2',
    signal: 'frame-differenced luminance change frequency in captured animation',
    threshold: '> 3 flashes per second over an area > 25% of viewport',
    pageTypes: 'all',
    severityBase: 'critical',
    confidenceFloor: 0.7,
    effort: 'medium',
    doNotFireWhen: ['flashing area below 341 x 256 px threshold'],
    evidenceFields: ['screenshot_sequence', 'flash_rate', 'affected_area_pct'],
    whyItMatters:
      'This can induce seizures. It is the one accessibility failure that can cause physical harm.',
    fix: 'Reduce the flash rate below 3Hz or remove the effect entirely.',
  },
  {
    id: 'ACC-020',
    family: F,
    name: 'Keyboard trap',
    layer: 'L1',
    signal: 'tab sequence that cannot exit an element or overlay using Tab / Shift+Tab / Escape',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'critical',
    confidenceFloor: 0.9,
    effort: 'medium',
    doNotFireWhen: [
      'trap is an intentional modal focus trap that releases on Escape AND has a visible close control in the loop',
    ],
    evidenceFields: ['selector', 'tab_sequence_array', 'escape_behavior'],
    whyItMatters:
      'The keyboard user is stuck. Their only remaining option is to close the tab.',
    fix: 'Ensure every overlay releases focus on Escape and includes a reachable close button inside the focus loop.',
  },
  {
    id: 'ACC-021',
    family: F,
    name: 'Skip link missing',
    layer: 'L1',
    signal: 'no skip-to-content link as the first focusable element, where nav contains >= 5 links',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'low',
    confidenceFloor: 0.85,
    effort: 'trivial',
    doNotFireWhen: [
      'nav has fewer than 5 links',
      'page uses landmark navigation with a main landmark present',
    ],
    evidenceFields: ['first_focusable_element', 'nav_link_count'],
    whyItMatters: 'Keyboard users tab through the entire navigation on every single page load.',
    fix:
      'Add as the first element in <body>:\n<a href="#main" class="skip-link">Skip to content</a>\nVisible on :focus, positioned off-screen otherwise.',
  },
  {
    id: 'ACC-022',
    family: F,
    name: 'Icon-only control without accessible name',
    layer: 'L1',
    signal:
      'button/link whose only child is an svg/icon font, with no aria-label, title, or visually hidden text',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.9,
    effort: 'trivial',
    doNotFireWhen: [
      'control has aria-label or aria-labelledby',
      'icon has a <title> element referenced correctly',
    ],
    evidenceFields: ['selector', 'screenshot_bbox', 'icon_ref'],
    whyItMatters:
      'Hamburger menus, close buttons and search icons announce as "button" with no meaning, blocking the primary navigation.',
    fix: 'Add aria-label="{action}" to the control, not to the svg.',
  },
  {
    id: 'ACC-023',
    family: F,
    name: 'Landmark regions missing',
    layer: 'L1',
    signal: 'absence of <main>, or absence of <nav> where a nav pattern exists',
    threshold: '<main> missing',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.9,
    effort: 'trivial',
    doNotFireWhen: ['role="main" is applied to an equivalent container'],
    evidenceFields: ['landmark_map'],
    whyItMatters:
      'Screen reader users navigate by landmark. Without them, every page must be read linearly from the top.',
    fix:
      'Wrap primary content in <main id="main">, navigation in <nav>, and use <header>/<footer> for their regions.',
  },
  {
    id: 'ACC-024',
    family: F,
    name: 'Zoom disabled',
    layer: 'L1',
    signal: 'viewport meta containing user-scalable=no or maximum-scale < 2',
    threshold: 'any occurrence',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.98,
    effort: 'trivial',
    doNotFireWhen: [],
    evidenceFields: ['viewport_meta_content'],
    whyItMatters:
      'Low-vision users cannot enlarge the page at all. This is a common and easily avoided failure.',
    fix:
      'Use <meta name="viewport" content="width=device-width, initial-scale=1"> and remove user-scalable and maximum-scale entirely.',
  },
];

export const ACCESSIBILITY: Family = {
  id: F,
  prefix: F,
  name: 'Accessibility',
  weight: 25,
  rules,
};
