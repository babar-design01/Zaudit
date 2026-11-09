import type { CoverBars, Post } from '../blog';

/*
 * WCAG facts checked against the WCAG 2.2 Recommendation (12 December 2024
 * version), W3C's "What's New in WCAG 2.2", the WCAG 2 FAQ and the
 * Understanding documents listed in `sources` (all read 9 Nov 2026).
 * ProCurveUX rule names are quoted from lib/audit/catalog/acc.ts and mobile.ts.
 */
export const post: Post = {
  slug: 'wcag-2-2-new-success-criteria',
  title: "What's new in WCAG 2.2: the nine new success criteria",
  seoTitle: 'WCAG 2.2 New Success Criteria: All 9 Changes Explained',
  description:
    'WCAG 2.2 added nine success criteria and removed 4.1.1 Parsing. What each new criterion asks, its level, and what it means for your website.',
  date: '2026-11-09',
  category: 'Accessibility',
  tags: ['WCAG 2.2', 'Accessibility', 'Keyboard access'],
  author: 'muhammad-babar',
  cover: 'wcag22',
  body: [
    {
      type: 'answer',
      text: 'WCAG 2.2 added nine success criteria to WCAG 2.1: two at Level A, four at Level AA and three at Level AAA. If your target is AA, six of them apply to you: Focus Not Obscured (Minimum), Dragging Movements, Target Size (Minimum), Consistent Help, Redundant Entry and Accessible Authentication (Minimum). WCAG 2.2 also removed one criterion, 4.1.1 Parsing, which W3C now marks as obsolete.',
    },
    {
      type: 'p',
      text: 'WCAG 2.2 became a W3C Recommendation on 5 October 2023, and W3C published an updated version on 12 December 2024. Everything else from WCAG 2.0 and 2.1 carries over essentially unchanged, so if your site already meets 2.1 AA, the new criteria are your to-do list. This post goes through each one in plain terms: what it asks, its level, and what it usually means on a real website.',
    },

    { type: 'h2', text: 'The nine new criteria at a glance' },
    {
      type: 'table',
      caption: 'The success criteria added in WCAG 2.2. Source: W3C, WCAG 2.2',
      head: ['Criterion', 'Level', 'In one line'],
      rows: [
        ['2.4.11 Focus Not Obscured (Minimum)', 'AA', 'The focused item is never entirely hidden by your own content'],
        ['2.4.12 Focus Not Obscured (Enhanced)', 'AAA', 'No part of the focused item is hidden'],
        ['2.4.13 Focus Appearance', 'AAA', 'The focus indicator is big enough and has 3:1 contrast'],
        ['2.5.7 Dragging Movements', 'AA', 'Anything done by dragging can also be done without dragging'],
        ['2.5.8 Target Size (Minimum)', 'AA', 'Targets are at least 24 by 24 CSS pixels, or spaced out'],
        ['3.2.6 Consistent Help', 'A', 'Help links and contact details stay in the same place across pages'],
        ['3.3.7 Redundant Entry', 'A', "Don't ask for the same information twice in one process"],
        ['3.3.8 Accessible Authentication (Minimum)', 'AA', 'Logging in does not depend on memory or puzzles'],
        ['3.3.9 Accessible Authentication (Enhanced)', 'AAA', 'The same, without the object-recognition exceptions'],
      ],
    },
    {
      type: 'p',
      text: "One thing to notice: the numbers don't follow the levels. W3C added each new criterion to the end of its guideline so that no existing criterion had to be renumbered. That means 2.4.11 is AA while 2.4.12 is AAA. Only the level marked on each criterion tells you which one applies.",
    },

    { type: 'h2', text: 'Focus you can always see (2.4.11 to 2.4.13)' },
    {
      type: 'p',
      lead: '2.4.11 Focus Not Obscured (Minimum), Level AA.',
      text: "When an element receives keyboard focus, it must not be entirely hidden by content the site added. W3C names the usual culprits: sticky headers, sticky footers and non-modal dialogs. A cookie banner pinned to the bottom of the screen fails if it completely covers the item someone has just tabbed to. Partly covered still passes at AA.",
    },
    {
      type: 'p',
      lead: '2.4.12 Focus Not Obscured (Enhanced), Level AAA.',
      text: 'The stricter version. No part of the focused element may be hidden by author-created content.',
    },
    {
      type: 'p',
      lead: '2.4.13 Focus Appearance, Level AAA.',
      text: 'This sets a minimum for the focus indicator itself. Its area must be at least as large as a 2 CSS pixel thick perimeter of the unfocused component, and those pixels must have a contrast ratio of at least 3:1 between the focused and unfocused states. It does not apply when the browser draws the indicator and you have not changed it or its background.',
    },
    {
      type: 'tip',
      label: 'Fix:',
      text: 'Tab through your page with a sticky header or footer showing. If focused items slide underneath it, use CSS scroll padding, such as `scroll-padding-top` set to the header height, so the page scrolls them clear. W3C uses scroll padding as its own example of a pass.',
    },

    { type: 'h2', text: 'Dragging and target size (2.5.7 and 2.5.8)' },
    {
      type: 'p',
      lead: '2.5.7 Dragging Movements, Level AA.',
      text: 'Anything that works by dragging must also work with a single pointer without dragging, unless dragging is essential. W3C gives examples of passes: a map with arrow buttons as well as drag-to-pan, a sortable list with move-up and move-down controls, and a task board where you can tap a card and pick a column from a menu. Keyboard support alone does not automatically meet this criterion. The point is that someone with a hand tremor can click instead of drag.',
    },
    {
      type: 'p',
      lead: '2.5.8 Target Size (Minimum), Level AA.',
      text: 'Pointer targets must be at least 24 by 24 CSS pixels. There are five exceptions: a smaller target passes if a 24px circle centred on it does not overlap another target or its circle (spacing), if another control on the page does the same job and meets the size (equivalent), if it sits inside a sentence (inline), if the browser sets its size and you have not changed it, or if that size is essential or legally required. The older AAA criterion, 2.5.5 Target Size (Enhanced), uses 44 by 44.',
    },
    {
      type: 'tip',
      label: 'Fix:',
      text: 'Small icon buttons are the usual failures: close buttons, social icons, carousel dots. Add padding to grow the clickable area while the icon stays the same size.',
    },

    { type: 'h2', text: 'Consistent help and redundant entry (3.2.6 and 3.3.7)' },
    {
      type: 'p',
      lead: '3.2.6 Consistent Help, Level A.',
      text: 'If help is repeated across a set of pages, it must appear in the same relative order each time. Help here means human contact details, a way to contact a person such as a chat, a self-help option, or a fully automated contact mechanism. It only applies if you offer help. If your contact link sits in the header on one page and the footer on the next, move it.',
    },
    {
      type: 'p',
      lead: '3.3.7 Redundant Entry, Level A.',
      text: 'Information someone has already entered, or that was given to them, and that is needed again in the same process must be filled in for them or offered for them to select. Exceptions are when re-entry is essential, when it is needed for security, or when the earlier information is no longer valid. W3C examples include a "billing address same as delivery address" option, and a checkout that keeps what was typed after showing an error.',
    },

    { type: 'h2', text: 'Logins without memory tests (3.3.8 and 3.3.9)' },
    {
      type: 'p',
      lead: '3.3.8 Accessible Authentication (Minimum), Level AA.',
      text: 'No step of logging in may require a cognitive function test, such as remembering a password or solving a puzzle, unless that step offers one of four things: another method that is not a test, a mechanism that helps complete it, a test that asks people to recognise objects, or a test that asks them to identify images or other non-text content they gave the site themselves. W3C names password managers and copy and paste as mechanisms that count.',
    },
    {
      type: 'p',
      text: 'In practice that means three things. Do not block pasting into password or code fields. Do not stop browsers and password managers from filling them in. And if a one-time code is split into separate boxes, make sure pasting the whole code works. W3C shows a split code field where a paste fills only the first box. A distorted-text CAPTCHA fails unless there is another way in, and an audio version you have to transcribe does not count as that other way.',
    },
    {
      type: 'p',
      lead: '3.3.9 Accessible Authentication (Enhanced), Level AAA.',
      text: 'The same rule with two exceptions removed: object recognition and personal content no longer count. A "pick all the pictures of cats" challenge passes AA but not AAA.',
    },

    { type: 'h2', text: 'What was removed: 4.1.1 Parsing' },
    {
      type: 'p',
      text: 'WCAG 2.2 lists 4.1.1 Parsing as "obsolete and removed". It was written for a time when assistive technology parsed HTML directly. It no longer does, and the problems the criterion targeted either no longer exist or are covered by other criteria, such as 1.3.1 Info and Relationships and 4.1.2 Name, Role, Value. W3C has also added a note to WCAG 2.0 and 2.1 saying 4.1.1 should be treated as always satisfied for content in HTML or XML.',
    },
    {
      type: 'p',
      text: 'If a contract or policy names WCAG 2.0 or 2.1, the specification says you may still need to test and report 4.1.1. Fixing markup errors can still be useful. It is just not an accessibility requirement in 2.2.',
    },
    {
      type: 'p',
      text: 'Content that meets WCAG 2.2 also meets 2.1 and 2.0, and W3C recommends adopting 2.2 as your target even where formal obligations still name an older version. For a site that meets 2.1 AA today, moving to 2.2 AA means checking the six new A and AA criteria. Our [accessibility checklist](/accessibility-checklist) puts them alongside the older ones.',
    },
    {
      type: 'tip',
      text: 'This post is general information, not legal advice. Which version of WCAG you are held to depends on your market and contracts, so ask a lawyer. For the litigation picture, see [ADA website lawsuit statistics](/blog/ada-website-lawsuit-statistics).',
    },

    { type: 'h2', text: 'What ProCurveUX checks, and what needs a person' },
    {
      type: 'p',
      text: 'ProCurveUX loads your page in a real browser and measures what it can. For WCAG 2.2, that covers target size and focus styling:',
    },
    {
      type: 'list',
      items: [
        { lead: '"Target size below minimum"', text: 'fails controls under 24 by 24 CSS pixels, the 2.5.8 line, and warns below 44 by 44. It skips links inside a sentence and targets with enough spacing, as WCAG does.' },
        { lead: '"Tap targets too small for a thumb"', text: 'runs the same idea on a second visit at phone size, 390 by 844 with touch on.' },
        { lead: '"Focus indicator suppressed" and "Focus indicator contrast insufficient"', text: 'flag removed focus outlines and focus rings under 3:1. These support 2.4.11 and 2.4.13 but are not a full test of either.' },
        { lead: '"Pinned bars cover the screen"', text: 'flags fixed and sticky bars covering more than 30% of a phone screen, the usual cause of hidden focus. It does not test 2.4.11 itself.' },
      ],
    },
    {
      type: 'p',
      text: 'The rest needs a person. Whether a focused item is entirely hidden, whether a drag has a click alternative, whether help stays in the same place across pages, whether a multi-step form asks twice, and whether your login lets people paste: all of these depend on flows and judgement. Tab through your key pages, try your login with a password manager, and walk through checkout once. The [sample report](/report/sample) shows what the automated part looks like. Colour contrast is unchanged in 2.2; our [contrast guide](/blog/color-contrast-ratio-wcag) covers it.',
    },

    { type: 'h2', text: 'Frequently asked questions' },
    {
      type: 'faq',
      items: [
        {
          q: 'How many new success criteria are in WCAG 2.2?',
          a: 'Nine: two at Level A, four at Level AA and three at Level AAA. One older criterion, 4.1.1 Parsing, was removed.',
        },
        {
          q: 'Which new WCAG 2.2 criteria apply at Level AA?',
          a: 'Six: the two Level A criteria (3.2.6 Consistent Help and 3.3.7 Redundant Entry) plus the four AA ones (2.4.11 Focus Not Obscured (Minimum), 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum) and 3.3.8 Accessible Authentication (Minimum)).',
        },
        {
          q: 'Is 4.1.1 Parsing still required?',
          a: 'Not in WCAG 2.2, where it is marked obsolete and removed. W3C says it should be treated as always satisfied for HTML and XML under 2.0 and 2.1 too, though a policy naming an older version may still ask you to report it.',
        },
        {
          q: 'If my site meets WCAG 2.2, does it also meet WCAG 2.1?',
          a: 'Yes. W3C states that content conforming to WCAG 2.2 also conforms to 2.1 and 2.0.',
        },
        {
          q: 'Can an automated tool test all of WCAG 2.2?',
          a: 'No. Target size and focus styling can be measured. Dragging alternatives, consistent help, redundant entry and login steps need a person to walk through the flows.',
        },
      ],
    },
  ],
  sources: [
    {
      title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
      publisher: 'W3C',
      note: 'W3C Recommendation, 12 December 2024 version',
      url: 'https://www.w3.org/TR/WCAG22/',
    },
    {
      title: "What's New in WCAG 2.2",
      publisher: 'W3C Web Accessibility Initiative',
      note: 'updated 5 October 2023',
      url: 'https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/',
    },
    {
      title: 'WCAG 2 FAQ',
      publisher: 'W3C Web Accessibility Initiative',
      note: 'why 4.1.1 Parsing is obsolete, and the December 2024 update',
      url: 'https://www.w3.org/WAI/standards-guidelines/wcag/faq/',
    },
    {
      title: 'Understanding SC 2.4.11 Focus Not Obscured (Minimum)',
      publisher: 'W3C Web Accessibility Initiative',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html',
    },
    {
      title: 'Understanding SC 2.5.7 Dragging Movements',
      publisher: 'W3C Web Accessibility Initiative',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html',
    },
    {
      title: 'Understanding SC 2.5.8 Target Size (Minimum)',
      publisher: 'W3C Web Accessibility Initiative',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
    },
    {
      title: 'Understanding SC 3.3.7 Redundant Entry',
      publisher: 'W3C Web Accessibility Initiative',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html',
    },
    {
      title: 'Understanding SC 3.3.8 Accessible Authentication (Minimum)',
      publisher: 'W3C Web Accessibility Initiative',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html',
    },
  ],
  cta: {
    title: 'See which WCAG 2.2 checks your site fails',
    text: 'Paste your URL into ProCurveUX for a free audit: target size, focus and contrast measured in a real browser, with a ranked fix list in about a minute.',
  },
};

export const motif: CoverBars = {
  title: 'New in WCAG 2.2',
  chip: '9 criteria',
  rows: [
    { label: 'Level A', value: '2', share: 50 },
    { label: 'Level AA', value: '4', share: 100, strong: true },
    { label: 'Level AAA', value: '3', share: 75 },
  ],
};
