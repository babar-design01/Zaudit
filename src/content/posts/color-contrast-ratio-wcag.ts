import type { CoverBars, Post } from '../blog';

/*
 * Ratios, definitions and exceptions checked against the WCAG 2.2
 * Recommendation and the Understanding documents for 1.4.3, 1.4.6 and 1.4.11
 * (read 9 Nov 2026). Prevalence figures are from the WebAIM Million 2026.
 * The worked colour pairs were computed with WCAG's relative luminance formula.
 * ProCurveUX rule names are quoted from lib/audit/catalog/acc.ts and ui.ts.
 */
export const post: Post = {
  slug: 'color-contrast-ratio-wcag',
  title: 'Colour contrast ratios: what WCAG requires and how to fix them',
  seoTitle: 'WCAG Color Contrast Ratio: 4.5:1, 3:1 and 7:1 Explained',
  description:
    'WCAG asks for 4.5:1 for body text, 3:1 for large text and controls, and 7:1 at AAA. How the ratio works, what is exempt, and brand-safe fixes.',
  date: '2026-11-09',
  category: 'Accessibility',
  tags: ['Colour contrast', 'WCAG 2.2', 'Accessibility'],
  author: 'muhammad-babar',
  cover: 'contrast',
  body: [
    {
      type: 'answer',
      text: 'At Level AA, WCAG asks for a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (1.4.3), and 3:1 for the parts of controls and graphics people need to see (1.4.11). Large text means at least 18pt (24px), or 14pt bold (about 18.66px). The stricter Level AAA asks for 7:1, or 4.5:1 for large text (1.4.6).',
    },
    {
      type: 'p',
      text: "Low contrast is the most common accessibility failure on the web. The WebAIM Million 2026 found low-contrast text on 83.9% of the top million home pages, up from 79.1% in 2025, with an average of 34 distinct instances per page (WebAIM, 2026). It is also one of the easiest failures to fix once you know the numbers. This post explains the ratios, how they are worked out, what is exempt, and how to fix a failing colour without throwing away your brand.",
    },

    { type: 'h2', text: 'The contrast ratios at a glance' },
    {
      type: 'table',
      caption: 'Minimum contrast ratios in WCAG 2.2. Source: W3C, WCAG 2.2',
      head: ['What', 'Level AA', 'Level AAA', 'Criterion'],
      rows: [
        ['Normal text and images of text', '4.5:1', '7:1', '1.4.3 (AA), 1.4.6 (AAA)'],
        ['Large text: 18pt (24px), or 14pt (about 18.66px) bold', '3:1', '4.5:1', '1.4.3 (AA), 1.4.6 (AAA)'],
        ['Visual parts of controls and their states: borders, checkmarks, focus rings', '3:1', 'No higher level', '1.4.11'],
        ['Parts of graphics needed to understand them: chart lines, meaningful icons', '3:1', 'No higher level', '1.4.11'],
        ['Logos, disabled controls, pure decoration', 'No requirement', 'No requirement', '1.4.3, 1.4.11 exceptions'],
      ],
    },

    { type: 'h2', text: 'How is the contrast ratio calculated?' },
    {
      type: 'p',
      text: 'The ratio compares the relative luminance of two colours, which is how bright each one is on a scale from 0 for black to 1 for white. The formula is `(L1 + 0.05) / (L2 + 0.05)`, where L1 is the lighter colour and L2 the darker. The result runs from 1:1, the same colour twice, to 21:1, black on white.',
    },
    {
      type: 'p',
      text: 'Relative luminance weights the red, green and blue channels differently, with green counting most: `L = 0.2126 R + 0.7152 G + 0.0722 B`, after each channel is converted from its 0 to 255 value to a linear one. You do not need to do this by hand. Any contrast checker, such as the free one from WebAIM, does it for you.',
    },
    {
      type: 'p',
      text: 'Two details catch people out. First, the thresholds are exact: W3C says computed values should not be rounded, so 4.499:1 does not meet 4.5:1. Grey `#777777` on white is 4.48:1 and fails for body text, while `#767676` is 4.54:1 and passes. Second, contrast is measured against the background the text sits on in normal use, and if you set a text colour you need to set a background colour too.',
    },

    { type: 'h2', text: 'What counts as large text?' },
    {
      type: 'p',
      text: 'WCAG defines large-scale text as at least 18 point, or at least 14 point bold. CSS sets 1pt equal to 1.333px, so 18pt is 24px and 14pt is about 18.66px. W3C rounds that second figure to roughly 18.5px in its Understanding page; if your bold text sits between the two, make it 19px to be safe.',
    },
    {
      type: 'p',
      text: 'The size that counts is the size the page is delivered at, not what someone gets by zooming. W3C also warns that very thin or unusual fonts are harder to read at lower contrast, so a light-weight display font at 24px can pass on paper and still be hard to read.',
    },
    {
      type: 'tip',
      label: 'In practice:',
      text: 'Headlines and hero text usually qualify for 3:1. Body copy, captions, form labels, placeholder text and button text at normal sizes need 4.5:1. W3C notes that placeholder text and text shown on hover or focus are covered too.',
    },

    { type: 'h2', text: 'Contrast for buttons, inputs, icons and charts (1.4.11)' },
    {
      type: 'p',
      text: 'Success criterion 1.4.11 Non-text Contrast, added in WCAG 2.1, asks for 3:1 against adjacent colours for two kinds of thing. The first is the visual information needed to identify a control and its state: an input border, a checkbox outline, the check inside it, a toggle track, a focus ring. The second is the parts of a graphic someone needs to understand it, such as the lines in a chart or an icon that carries meaning.',
    },
    {
      type: 'p',
      text: "A border is not always required. W3C's Understanding page says that if a control already has visible text or a contrasting icon that shows it is there, its outer boundary does not have to meet 3:1. Where nothing else marks the control, as with a text input on a white page, the border does. W3C's own passing example is a `#767676` border on white, and its focus-ring example is `#949494` on white at 3:1.",
    },
    {
      type: 'p',
      text: 'Colour contrast is separate from colour meaning. Under 1.4.1 Use of Color, colour must not be the only way you show information, so a red border on an invalid field also needs an icon or message.',
    },

    { type: 'h2', text: 'What is exempt from contrast rules?' },
    {
      type: 'list',
      items: [
        { lead: 'Logos and brand names.', text: 'Text in a logo or brand name has no contrast requirement. W3C still encourages a passing version where the logo is a link or control.' },
        { lead: 'Inactive controls.', text: 'Disabled buttons and fields have no requirement under 1.4.3 or 1.4.11. A grey "Submit" button that unlocks once the form is filled in is W3C\'s own example.' },
        { lead: 'Pure decoration.', text: 'Text that is purely decorative, or not visible to anyone, has no requirement.' },
        { lead: 'Text inside a picture.', text: 'Text that is part of a picture containing significant other visual content, such as a sign in a street photo, has no requirement.' },
        { lead: 'Browser defaults.', text: 'Under 1.4.11, controls whose look is set by the browser and not changed by you are exempt.' },
      ],
    },
    {
      type: 'p',
      text: 'These are narrower than they look. Light grey helper text, a pale footer and a "decorative" headline that carries the page\'s message are not exempt. Low-contrast text is one of the barriers commonly cited in [ADA website lawsuits](/blog/ada-website-lawsuit-statistics).',
    },
    {
      type: 'tip',
      text: 'This post is general information, not legal advice. Meeting the contrast ratios is one part of WCAG conformance, not a guarantee against claims.',
    },

    { type: 'h2', text: 'How to fix a failing colour without wrecking the brand' },
    {
      type: 'p',
      text: 'Most contrast failures come from one brand colour being used for everything. You rarely need a new palette. You need the same hue at a few lightness levels, each with a clear job.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        { lead: 'Keep the hue, change the lightness.', text: 'Darken the colour until it passes on your background. The brand still reads as the same colour; it is just deeper.' },
        { lead: 'Split the colour into roles.', text: 'A bright blue such as `#3B82F6` is 3.68:1 on white. That passes for large text, icons and input borders, but fails for body text and small button labels. `#2563EB` is 5.17:1 and passes for both. Use the bright one for big shapes and the deeper one for text and small buttons.' },
        { lead: 'Check orange and yellow first.', text: 'Bright oranges and yellows are high in luminance, so they struggle on white. Orange `#FF6B00` on white is 2.86:1, short of even 3:1, while a burnt orange such as `#C2410C` reaches 5.18:1.' },
        { lead: 'Flip the pairing.', text: 'If white text on your brand colour fails, try dark text on it. The ratio for a pair is the same whichever colour is on top, so the fix is often a darker label rather than a darker button.' },
        { lead: 'Protect text on images.', text: 'Put a dark overlay behind the text, or a solid panel. Then the text still passes when someone swaps the photo.' },
        { lead: 'Test every state.', text: 'Check hover, focus, visited, error and placeholder colours, not just the default. Dark mode needs its own check.' },
      ],
    },
    {
      type: 'p',
      text: 'Making text bold or bigger only helps if it crosses the large-text line. A 16px label made bold is still normal text and still needs 4.5:1.',
    },

    { type: 'h2', text: 'What ProCurveUX checks, and what needs a person' },
    {
      type: 'p',
      text: 'ProCurveUX measures the colours your page actually renders in a real browser, against the background each element really sits on. Its contrast checks are:',
    },
    {
      type: 'list',
      items: [
        { lead: '"Body text contrast below minimum"', text: 'for normal text under 4.5:1. It skips disabled text, logos and text hidden from assistive technology as decorative, as WCAG does.' },
        { lead: '"Large text contrast below minimum"', text: 'for large text under 3:1.' },
        { lead: '"UI component boundary contrast below minimum"', text: 'for input borders, toggle tracks, checkbox outlines and icon-only controls under 3:1.' },
        { lead: '"Focus indicator contrast insufficient"', text: 'for focus rings under 3:1 against the component or the page.' },
        { lead: '"Text over image without contrast protection"', text: 'for text on a photo with no overlay, where any sampled point falls under 4.5:1.' },
      ],
    },
    {
      type: 'p',
      text: 'Each finding gives the measured ratio, and body-text findings name both colours and suggest the nearest shade that passes. The [sample report](/report/sample) shows the format. A person still has to judge the edge cases: whether text is truly decorative, which parts of a chart or illustration someone needs to understand it, and whether colour is the only thing carrying a meaning. ProCurveUX has a check for that last one, "Information conveyed by color alone", but it is a judgement call worth confirming by eye. For the rest of the standard, see our [accessibility checklist](/accessibility-checklist) and [what changed in WCAG 2.2](/blog/wcag-2-2-new-success-criteria).',
    },

    { type: 'h2', text: 'Frequently asked questions' },
    {
      type: 'faq',
      items: [
        {
          q: 'What contrast ratio does WCAG require?',
          a: 'At Level AA, 4.5:1 for normal text, 3:1 for large text and 3:1 for user interface components and meaningful graphics. At Level AAA, 7:1 for normal text and 4.5:1 for large text.',
        },
        {
          q: 'What size is large text in pixels?',
          a: 'At least 24px (18pt), or at least about 18.66px (14pt) if bold. Anything smaller is normal text and needs 4.5:1 at AA.',
        },
        {
          q: 'Do disabled buttons need to meet contrast requirements?',
          a: 'No. Text and visuals that are part of an inactive control have no contrast requirement under 1.4.3 or 1.4.11. The button still needs to pass once it becomes active.',
        },
        {
          q: 'Does my logo need to meet contrast ratios?',
          a: 'No. Text that is part of a logo or brand name is exempt. W3C still encourages a passing version when the logo is a link.',
        },
        {
          q: 'Is 4.49:1 close enough to pass?',
          a: 'No. W3C says computed ratios should not be rounded, so anything under 4.5:1 fails for normal text, however close.',
        },
      ],
    },
  ],
  sources: [
    {
      title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
      publisher: 'W3C',
      note: '1.4.3, 1.4.6, 1.4.11 and the definitions of contrast ratio, relative luminance and large scale text',
      url: 'https://www.w3.org/TR/WCAG22/',
    },
    {
      title: 'Understanding SC 1.4.3 Contrast (Minimum)',
      publisher: 'W3C Web Accessibility Initiative',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
    },
    {
      title: 'Understanding SC 1.4.6 Contrast (Enhanced)',
      publisher: 'W3C Web Accessibility Initiative',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html',
    },
    {
      title: 'Understanding SC 1.4.11 Non-text Contrast',
      publisher: 'W3C Web Accessibility Initiative',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',
    },
    {
      title: 'The WebAIM Million: The 2026 report on the accessibility of the top 1,000,000 home pages',
      publisher: 'WebAIM',
      note: 'February 2026 data',
      url: 'https://webaim.org/projects/million/',
    },
    {
      title: 'Contrast Checker',
      publisher: 'WebAIM',
      note: 'free tool for checking a colour pair',
      url: 'https://webaim.org/resources/contrastchecker/',
    },
  ],
  cta: {
    title: 'Find every low-contrast colour on your site',
    text: 'Paste your URL into ProCurveUX for a free audit. It measures contrast in a real browser and flags every text and control below its ratio, with the measured value and a fix, in about a minute.',
  },
};

export const motif: CoverBars = {
  title: 'Minimum contrast',
  chip: '4.5:1',
  rows: [
    { label: 'AAA text', value: '7:1', share: 100, strong: true },
    { label: 'Body text', value: '4.5:1', share: 64 },
    { label: 'Large, UI', value: '3:1', share: 43 },
  ],
};
