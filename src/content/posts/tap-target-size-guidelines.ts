import type { CoverBars, Post } from '../blog';

/*
 * Facts from the W3C Understanding docs for 2.5.8 and 2.5.5, Apple's HIG
 * Accessibility page (control-size table and padding guidance), Material
 * Design 3 "Structure" (target sizes and spacing), Android Developers and
 * NN/g on Fitts's law. All read 9 Nov 2026.
 */
export const post: Post = {
  slug: 'tap-target-size-guidelines',
  title: 'Tap target size: 24px, 44pt or 48dp, and why they differ',
  seoTitle: 'Tap Target Size Guidelines: WCAG 2.2, Apple and Material Compared',
  description:
    'WCAG asks for 24×24 CSS pixels, Apple 44×44 points and Material 48×48dp. What each number means, why they differ, and how to fix small targets.',
  date: '2026-11-09',
  category: 'Mobile UX',
  tags: ['Tap targets', 'WCAG 2.2', 'Mobile UX'],
  author: 'muhammad-babar',
  cover: 'targets',
  body: [
    {
      type: 'answer',
      text: "To pass WCAG 2.2 at level AA, a tap target must be at least 24×24 CSS pixels, unless it has enough space around it or another exception applies. For touch, aim higher: WCAG's AAA criterion asks for 44×44 CSS pixels, Apple's default control size is 44×44 points and Material Design recommends 48×48dp. The numbers differ because WCAG sets a floor for every kind of pointer, mouse included, while Apple and Google set a comfortable size for fingers.",
    },
    {
      type: 'p',
      text: 'Ask three sources how big a button should be and you get three answers. Designers quote 44, Android developers quote 48, and accessibility audits quote 24. All of them are right about different things. This post explains where each number comes from, which one to design to, and how to fix the targets that fail most often: icon buttons, inline and footer links, close buttons and crowded navigation.',
    },

    { type: 'h2', text: 'The four numbers side by side' },
    {
      type: 'table',
      caption: 'Sources: W3C Understanding SC 2.5.8 and 2.5.5; Apple HIG, Accessibility; Material Design 3, Structure',
      head: ['Guideline', 'Size', 'Status', 'Covers'],
      rows: [
        ['WCAG 2.2 SC 2.5.8 Target Size (Minimum)', '24×24 CSS px', 'Level AA, five exceptions', 'Every pointer: touch, mouse, stylus, trackpad'],
        ['WCAG 2.2 SC 2.5.5 Target Size (Enhanced)', '44×44 CSS px', 'Level AAA, four exceptions', 'Every pointer'],
        ['Apple Human Interface Guidelines', '44×44 pt default, 28×28 pt minimum', 'Platform guidance for iOS and iPadOS', 'Touch'],
        ['Material Design 3', '48×48dp for touch, 44×44dp for pointers', 'Platform guidance', 'Touch and pointer'],
      ],
    },
    {
      type: 'p',
      text: 'If your goal is WCAG 2.2 AA, 2.5.8 is the one you have to meet. The other three describe a better experience on touch screens. Material notes that 48dp works out at about 9mm on screen, whatever the screen size, and that iOS recommends 44.',
    },

    { type: 'h2', text: 'WCAG 2.5.8: the 24-pixel minimum' },
    {
      type: 'p',
      text: 'The criterion says the target for pointer inputs must be at least 24 by 24 CSS pixels. In practice it must be possible to draw a solid 24×24 square, aligned with the page, completely inside the target. Rounded corners can leave too little room for that square, so a round icon button 24px across still counts as undersized.',
    },
    {
      type: 'p',
      text: 'Why so small? The W3C explains that most research on target size is about touch, but 2.5.8 covers mouse, trackpad and stylus too. Requiring touch-sized targets for every pointer would not have been appropriate, so after reviewing the average target size on high-traffic sites, the Working Group settled on 24 pixels. The size is also independent of zoom: you cannot pass by saying the target gets bigger when the user zooms in.',
    },
    { type: 'p', text: 'There are five exceptions:' },
    {
      type: 'list',
      items: [
        { lead: 'Spacing.', text: 'An undersized target passes if it has enough clear space around it (see below).' },
        { lead: 'Equivalent.', text: 'Another control on the same page does the same thing and meets the size.' },
        { lead: 'Inline.', text: 'The target sits in a sentence, or its size is set by the line height of the text around it.' },
        { lead: 'User agent control.', text: "The browser draws the control, such as the calendar inside `<input type=\"date\">`, and you haven't restyled it." },
        { lead: 'Essential.', text: 'The size or position carries meaning, such as pins on a map, or a law requires it.' },
      ],
    },
    { type: 'h3', text: 'How the spacing exception works' },
    {
      type: 'p',
      text: "Draw a 24px circle centred on each undersized target. If no circle touches another target, or another undersized target's circle, the targets pass. The W3C's own example is a row of icon buttons: 20×20 buttons with 4px between them pass, while the same buttons with no gap fail. Buttons only 16px tall can pass when nothing sits above or below them, but fail when another row is stacked 1px away.",
    },
    {
      type: 'tip',
      label: 'Note:',
      text: 'The W3C points out that a very small target with no neighbours can technically pass. It encourages authors to meet the 24px size anyway, and to aim for the stricter 44px criterion on important controls.',
    },
    {
      type: 'p',
      text: 'Two more details catch teams out. Targets hidden behind something the user opened, such as a dropdown or a dialog, are exempt while they are covered. But the requirement applies to targets in any new content that appears on top, so the buttons on a cookie banner or a pop-up must meet it.',
    },

    { type: 'h2', text: 'The touch sizes: WCAG AAA, Apple and Material' },
    {
      type: 'p',
      text: '2.5.5 Target Size (Enhanced) is the AAA version: 44×44 CSS pixels, with the same exceptions except spacing. The W3C recommends going larger still when a control is used often, when its result cannot easily be undone, when it sits near the edge of the screen, or when it is part of a sequence of steps.',
    },
    {
      type: 'p',
      text: "Apple's Human Interface Guidelines list a default control size of 44×44 points on iOS and iPadOS, and a minimum of 28×28 points. Material Design 3 says to consider touch targets of at least 48×48dp and pointer targets of at least 44×44dp. Android's developer guidance gives the same 48dp figure and adds that larger is even better.",
    },
    {
      type: 'p',
      text: 'For a website, treat 24 as the floor everywhere and 44 as the target for anything people tap on a phone: primary buttons, navigation, form controls and anything destructive. If your design system is built on Material, use 48. The gap between 44 and 48 matters far less than the gap between 16 and 24.',
    },

    { type: 'h2', text: "Fitts's law: why size and distance both matter" },
    {
      type: 'p',
      text: "[Fitts's law](/ux-laws#fitts-law), from Paul Fitts's 1954 research, says the time it takes to reach a target depends on its size and its distance. Small, far-away targets are slow to hit and easy to miss. Nielsen Norman Group sums up the practical side: bigger targets are faster to hit and produce fewer errors, and closer targets are faster to reach.",
    },
    {
      type: 'p',
      text: 'Two lessons follow for web pages. First, make the whole visible control clickable. NN/g notes that a text label next to an icon only enlarges the target if the label is part of the clickable area. Second, keep frequent actions close to where the pointer or thumb already is. NN/g also notes that screen edges help mouse users, because the cursor stops there, but that advantage does not carry over to touch screens.',
    },

    { type: 'h2', text: 'Spacing between targets' },
    {
      type: 'p',
      text: 'Size is only half of the problem. Touch screens guess which control is closest to a tap, so the W3C notes that enough spacing can work as well as a larger target. Every guideline gives a figure:',
    },
    {
      type: 'list',
      items: [
        { lead: 'WCAG 2.5.8:', text: 'undersized targets need a clear 24px circle each, as described above.' },
        { lead: 'Apple:', text: 'about 12 points of padding around elements with a bezel, and about 24 points around elements without one.' },
        { lead: 'Material:', text: 'targets separated by 8dp or more.' },
      ],
    },
    {
      type: 'p',
      text: 'Spacing is the fix to reach for when the design cannot grow, such as a toolbar of small icons. It is not a reason to keep tiny targets elsewhere.',
    },

    { type: 'h2', text: 'Common failures and how to fix them' },
    { type: 'h3', text: 'Icon buttons' },
    {
      type: 'p',
      text: "A 16px or 20px icon with no padding is the most common failure: share, edit, delete, the cart icon. Keep the icon the size it is and grow the hit area around it. Material's own example is a 24dp icon inside a 48dp target. In CSS, padding counts towards the target and margin does not, so use something like `.icon-button { min-width: 44px; min-height: 44px; display: inline-grid; place-items: center; }`.",
    },
    { type: 'h3', text: 'Inline and footer links' },
    {
      type: 'p',
      text: "Links inside a sentence are exempt, so you don't need to make body text links 24px tall. But a stacked list of footer links, a row of \"Terms · Privacy · Cookies\" or a tag cloud is not a sentence. Give each link enough vertical padding to reach 24px, or space the rows so the 24px circles don't overlap.",
    },
    { type: 'h3', text: 'Close buttons' },
    {
      type: 'p',
      text: 'The small "×" on a modal, cookie banner or chat widget is often 16px and pushed into a corner. Because it is new content on top of the page, WCAG applies to it. Give it a 44×44 hit area, keep it inside the panel rather than on the edge of the screen, and make sure it never sits right next to the main action.',
    },
    { type: 'h3', text: 'Crowded navigation' },
    {
      type: 'p',
      text: 'Tabs, filter chips and desktop menus squeezed onto a phone screen fail on size, spacing or both. Below your layout breakpoint, collapse the menu behind a labelled control, keep only the one or two most important links visible, and make each item a full-width row at least 44px tall.',
    },

    { type: 'h2', text: 'How to check your own site' },
    {
      type: 'list',
      ordered: true,
      items: [
        { lead: 'Measure in the browser.', text: "Inspect each control in DevTools. The box model shows the size including padding, which is what WCAG measures." },
        { lead: 'Test with your thumb.', text: 'Use the page on a real phone, one-handed. Anything you miss once, your visitors miss often.' },
        { lead: 'Check spacing where size fails.', text: 'For anything under 24px, picture the 24px circle and look for overlaps with neighbours.' },
        { lead: 'Add it to your checklist.', text: 'Target size is one of the WCAG 2.2 AA items on our [accessibility checklist](/accessibility-checklist).' },
      ],
    },
    {
      type: 'p',
      text: 'ProCurveUX does this measuring for you. It loads your page in a real browser at desktop and mobile sizes and runs two checks. "Target size below minimum" fails any control under 24×24 CSS pixels and warns below 44×44, skipping links inside sentences. "Tap targets too small for a thumb" measures every control on the first screen at a 390×844 phone size with touch on, and flags anything under 24×24, or under 44×44 with less than 8px of clear space around it. Each finding comes with a screenshot, the CSS selector and a fix. See a [sample report](/report/sample).',
    },
    {
      type: 'tip',
      text: 'Size is not the only way a tap goes wrong. A correctly sized button still gets missed if the page moves under the finger, which is what [Cumulative Layout Shift](/blog/cumulative-layout-shift-fix) measures.',
    },

    { type: 'h2', text: 'Frequently asked questions' },
    {
      type: 'faq',
      items: [
        {
          q: 'What is the minimum tap target size in WCAG 2.2?',
          a: '24×24 CSS pixels, under success criterion 2.5.8 at level AA. Smaller targets can still pass if they have enough space around them, if an equivalent control meets the size, if they are links in a sentence, if the browser draws them, or if their size is essential.',
        },
        {
          q: 'Should I use 44px or 48px?',
          a: '44 matches WCAG 2.5.5 (AAA) and Apple. 48dp is Material Design. Either is well above the 24px minimum. Pick one and apply it consistently.',
        },
        {
          q: 'Does padding count towards target size?',
          a: 'Yes. The target is the area that responds to the pointer, so padding inside the clickable element counts. Margin does not, because it is outside the element.',
        },
        {
          q: 'Do links in a paragraph need to be 24px tall?',
          a: 'No. WCAG exempts targets inside a sentence. Lists of links that are not part of a sentence, such as footer menus, are not exempt.',
        },
        {
          q: 'Does target size matter on desktop?',
          a: 'Yes. WCAG 2.5.8 covers every pointer, including a mouse and trackpad. People with tremors or limited fine motor control miss small targets with a mouse too.',
        },
      ],
    },
  ],
  sources: [
    {
      title: 'Understanding Success Criterion 2.5.8: Target Size (Minimum)',
      publisher: 'W3C Web Accessibility Initiative',
      note: 'WCAG 2.2, Level AA',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
    },
    {
      title: 'Understanding Success Criterion 2.5.5: Target Size (Enhanced)',
      publisher: 'W3C Web Accessibility Initiative',
      note: 'WCAG 2.2, Level AAA',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html',
    },
    {
      title: 'Accessibility',
      publisher: 'Apple Human Interface Guidelines',
      note: 'Mobility: default and minimum control sizes by platform, and padding between controls',
      url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility',
    },
    {
      title: 'Accessibility designing: Structure',
      publisher: 'Material Design 3',
      note: 'Target sizes and target spacing',
      url: 'https://m3.material.io/foundations/designing/structure',
    },
    {
      title: 'Make apps more accessible',
      publisher: 'Android Developers',
      note: 'Use large, simple controls',
      url: 'https://developer.android.com/guide/topics/ui/accessibility/apps',
    },
    {
      title: "Fitts's Law and Its Applications in UX",
      publisher: 'Nielsen Norman Group (Raluca Budiu)',
      note: 'July 31, 2022',
      url: 'https://www.nngroup.com/articles/fitts-law/',
    },
  ],
  cta: {
    title: 'Find the targets your visitors keep missing',
    text: 'Paste your URL into ProCurveUX for a free audit. It measures your controls at desktop and mobile sizes in a real browser and gives you a ranked fix list in about a minute.',
  },
};

export const motif: CoverBars = {
  title: 'Minimum tap target',
  chip: 'px · pt · dp',
  rows: [
    { label: 'WCAG AA', value: '24px', share: 50 },
    { label: 'Apple HIG', value: '44pt', share: 92 },
    { label: 'Material', value: '48dp', share: 100, strong: true },
  ],
};
