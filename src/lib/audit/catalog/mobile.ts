import type { RuleDef } from '../contract';

/**
 * Check definitions for the Mobile family.
 *
 * Every one of these is measured on a second visit at 390×844 with touch on,
 * not on the desktop page narrowed down: a site is free to serve a different
 * navigation, a different type scale and a different set of controls to a
 * phone, and the audit should judge what it actually serves.
 */

const F = 'MOBILE';

export const MOBILE_CHECKS: RuleDef[] = [
  {
    id: 'MOB-001',
    family: F,
    name: 'Tap targets too small for a thumb',
    layer: 'L1',
    signal: 'bounding box of every control on the first screen, measured at 390×844 with touch on',
    threshold: 'under 24×24 CSS px, or under 44×44 with less than 8px of clear space; links inside a sentence excluded',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.9,
    effort: 'small',
    doNotFireWhen: [
      'the target is a link inside a run of prose, which WCAG exempts',
      'the control is hidden from sight or from assistive technology',
      'the target is between 24 and 44px but carries 8px of clear space, which WCAG accepts in place of size',
    ],
    evidenceFields: ['target_size', 'required_size', 'clear_space', 'selectors', 'mobile_capture'],
    whyItMatters:
      'A finger is not a cursor. Below roughly 44pt a tap lands next to the control as often as on it, and the person cannot tell whether the page ignored them or they missed.',
    fix: 'Give the control at least 44×44px of hit area on touch — padding counts, and a transparent box around a small icon counts, while the icon itself stays the size it is. Where the design will not allow it, keep the target above 24×24px and give it 8px of clear space on every side.',
  },
  {
    id: 'MOB-003',
    family: F,
    name: 'Navigation does not collapse on a phone',
    layer: 'L2',
    signal: 'navigation landmark width and link count at 390px, and the presence of a control that opens a menu',
    threshold: 'the nav lays out wider than the screen, or shows six or more links, with no menu control',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.85,
    effort: 'medium',
    doNotFireWhen: [
      'a menu control is present, whatever it is called',
      'the navigation is deliberately a short horizontal row that fits',
    ],
    evidenceFields: ['visible_links', 'nav_overflows', 'mobile_capture'],
    whyItMatters:
      'A desktop navigation left at phone width either spills off the screen or squeezes its labels until they are unreadable. Navigation is how people recover when they are lost, so it is the worst thing to lose on the smallest screen.',
    fix: 'Collapse the primary navigation behind a labelled menu control below the layout breakpoint, keeping the one or two destinations that matter most visible, and make the control itself a 44×44 target with an accessible name.',
  },
  {
    id: 'MOB-004',
    family: F,
    name: 'Pinned bars cover the screen',
    layer: 'L2',
    signal: 'height of fixed and sticky bars at the top and bottom edges, against viewport height at 390×844',
    threshold: 'more than 30% of the screen covered between them',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.85,
    effort: 'medium',
    doNotFireWhen: ['the bar is the page content itself, such as a full-screen menu that is open'],
    evidenceFields: ['covered_share', 'bars', 'mobile_capture'],
    whyItMatters:
      'A phone screen is small before anything is pinned to it. A header, a cookie bar and a promotion bar together can leave half a screen of content, and the person scrolls twice as far to read the same page.',
    fix: 'Keep the pinned furniture to one bar of around 56px. Let the header scroll away and come back on scroll-up, and dismiss consent and promotion bars once they have been answered.',
  },
  {
    id: 'MOB-005',
    family: F,
    name: 'Fields zoom the page when they are focused',
    layer: 'L1',
    signal: 'computed font-size of each text field on the first screen at 390px',
    threshold: 'below 16px',
    pageTypes: 'all',
    severityBase: 'low',
    confidenceFloor: 0.95,
    effort: 'trivial',
    doNotFireWhen: ['the field cannot take a keyboard, such as a checkbox or a range'],
    evidenceFields: ['font_px', 'selectors', 'mobile_capture'],
    whyItMatters:
      'Safari on iOS zooms the page in whenever a field smaller than 16px is focused, and it does not zoom back out. The layout jumps mid-form and the rest of the page is left off-screen.',
    fix: 'Set the font-size of text inputs, selects and textareas to 16px or more at phone widths. If the design needs smaller text, scale it down visually with a transform rather than with font-size.',
  },
  {
    id: 'MOB-006',
    family: F,
    name: 'Body text too small to read on a phone',
    layer: 'L1',
    signal: 'computed font-size of elements holding a run of text on the first screen at 390px',
    threshold: 'below 14px for a block of 25 characters or more',
    pageTypes: 'all',
    severityBase: 'medium',
    confidenceFloor: 0.9,
    effort: 'small',
    doNotFireWhen: ['the text is a label, a caption or fine print rather than body copy'],
    evidenceFields: ['font_px', 'sample', 'selectors', 'mobile_capture'],
    whyItMatters:
      'Phone reading happens at arm’s length, in motion, often in bad light. Body copy that works at 13px on a desk is a squint on a train, and people zoom or leave rather than squint.',
    fix: 'Set body copy to at least 16px on phones, keeping 14px as the floor for secondary text. Size type in rem against a root size rather than fixing it in pixels per breakpoint.',
  },
  {
    id: 'MOB-007',
    family: F,
    name: 'Page scrolls sideways on a real phone',
    layer: 'L1',
    signal: 'document scrollWidth against viewport width at 390×844 with touch on',
    threshold: 'horizontal overflow of more than 2px',
    pageTypes: 'all',
    severityBase: 'high',
    confidenceFloor: 0.9,
    effort: 'medium',
    doNotFireWhen: ['the overflow comes from a region meant to scroll, such as a wide table or a carousel'],
    evidenceFields: ['viewport_width', 'overflow_px', 'offenders', 'mobile_capture'],
    whyItMatters:
      'This is the layout the phone actually receives, not a desktop page squeezed into a narrow window. Sideways scroll here means every vertical swipe risks dragging the page off to one side.',
    fix: 'Find what sets the floor on the width ({offenders}) and let it shrink: max-width: 100% on media, wrapping for long strings, and overflow-x: auto on the one element that genuinely needs to be wide.',
  },
];
