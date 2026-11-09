/**
 * The checklist on /accessibility-checklist: every WCAG 2.2 Level A and AA
 * success criterion (55; 4.1.1 Parsing is obsolete in 2.2 and left out).
 * Numbers, names and levels follow https://www.w3.org/TR/WCAG22/.
 *
 * `auto` says how much ProCurveUX measures, and `rules` names the catalog rules
 * that do it (src/lib/audit/catalog/*.ts), by the names the report prints. A
 * criterion is 'auto' only when a rule measures what it asks for; 'partial'
 * when a rule catches some failures but a person must judge the rest.
 */

export type Coverage = 'auto' | 'partial' | 'manual';

export type Criterion = {
  num: string;
  name: string;
  level: 'A' | 'AA';
  /** New in WCAG 2.2. */
  isNew?: boolean;
  text: string;
  auto: Coverage;
  rules?: string[];
};

export type Principle = { id: string; name: string; summary: string; items: Criterion[] };

export const CHECKLIST: Principle[] = [
  {
    id: 'perceivable',
    name: 'Perceivable',
    summary: 'People can see or hear the content, whatever senses they use.',
    items: [
      { num: '1.1.1', name: 'Non-text Content', level: 'A', text: 'Images, icons and controls have a text alternative that serves the same purpose.', auto: 'partial', rules: ['Informative image missing alt text', 'Decorative image announced to screen readers', 'Icon-only control without accessible name'] },
      { num: '1.2.1', name: 'Audio-only and Video-only (Prerecorded)', level: 'A', text: 'Recorded audio has a transcript; silent video has a transcript or audio track.', auto: 'manual' },
      { num: '1.2.2', name: 'Captions (Prerecorded)', level: 'A', text: 'Recorded video with sound has captions.', auto: 'manual' },
      { num: '1.2.3', name: 'Audio Description or Media Alternative (Prerecorded)', level: 'A', text: 'What happens on screen in a video is described in audio or in text.', auto: 'manual' },
      { num: '1.2.4', name: 'Captions (Live)', level: 'AA', text: 'Live video with sound has captions.', auto: 'manual' },
      { num: '1.2.5', name: 'Audio Description (Prerecorded)', level: 'AA', text: 'Recorded video has an audio description of important visual detail.', auto: 'manual' },
      { num: '1.3.1', name: 'Info and Relationships', level: 'A', text: 'Headings, lists, labels and regions are marked up, not just styled to look that way.', auto: 'partial', rules: ['Input missing programmatic label', 'Heading level skipped', 'Missing or duplicate h1', 'Landmark regions missing'] },
      { num: '1.3.2', name: 'Meaningful Sequence', level: 'A', text: 'The reading order in the code matches the order that makes sense on screen.', auto: 'partial', rules: ['DOM order does not match visual order'] },
      { num: '1.3.3', name: 'Sensory Characteristics', level: 'A', text: 'Instructions do not rely only on shape, position or sound ("click the round button on the right").', auto: 'manual' },
      { num: '1.3.4', name: 'Orientation', level: 'AA', text: 'The page works in both portrait and landscape.', auto: 'manual' },
      { num: '1.3.5', name: 'Identify Input Purpose', level: 'AA', text: 'Fields for personal details say what they are for (autocomplete), so browsers can fill them.', auto: 'manual' },
      { num: '1.4.1', name: 'Use of Color', level: 'A', text: 'Colour is never the only way information is shown, such as links or errors.', auto: 'partial', rules: ['Information conveyed by color alone'] },
      { num: '1.4.2', name: 'Audio Control', level: 'A', text: 'Audio that plays by itself for more than 3 seconds can be paused or turned down.', auto: 'partial', rules: ['Autoplaying media without control'] },
      { num: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', text: 'Text has a contrast ratio of at least 4.5:1, or 3:1 for large text.', auto: 'auto', rules: ['Body text contrast below minimum', 'Large text contrast below minimum', 'Text over image without contrast protection'] },
      { num: '1.4.4', name: 'Resize Text', level: 'AA', text: 'Text can be zoomed to 200% without losing content or function.', auto: 'partial', rules: ['Zoom disabled'] },
      { num: '1.4.5', name: 'Images of Text', level: 'AA', text: 'Text is real text, not a picture of text, except logos.', auto: 'manual' },
      { num: '1.4.10', name: 'Reflow', level: 'AA', text: 'At 320 CSS pixels wide, content fits without scrolling sideways.', auto: 'partial', rules: ['Page scrolls sideways on a phone'] },
      { num: '1.4.11', name: 'Non-text Contrast', level: 'AA', text: 'Field borders, controls, focus rings and meaningful graphics have at least 3:1 contrast.', auto: 'partial', rules: ['UI component boundary contrast below minimum', 'Focus indicator contrast insufficient'] },
      { num: '1.4.12', name: 'Text Spacing', level: 'AA', text: 'Nothing breaks when people increase line, letter and word spacing.', auto: 'manual' },
      { num: '1.4.13', name: 'Content on Hover or Focus', level: 'AA', text: 'Tooltips and pop-ups shown on hover can be dismissed, hovered over, and stay until moved away from.', auto: 'manual' },
    ],
  },
  {
    id: 'operable',
    name: 'Operable',
    summary: 'People can use every control, with a mouse, a keyboard, touch or assistive technology.',
    items: [
      { num: '2.1.1', name: 'Keyboard', level: 'A', text: 'Everything can be done with a keyboard alone.', auto: 'partial', rules: ['Hover-dependent content on touch-capable viewport'] },
      { num: '2.1.2', name: 'No Keyboard Trap', level: 'A', text: 'Keyboard focus can always move out of any element it enters.', auto: 'auto', rules: ['Keyboard trap'] },
      { num: '2.1.4', name: 'Character Key Shortcuts', level: 'A', text: 'Single-key shortcuts can be turned off or remapped.', auto: 'manual' },
      { num: '2.2.1', name: 'Timing Adjustable', level: 'A', text: 'Time limits can be turned off, adjusted or extended.', auto: 'partial', rules: ['Timeout or auto-dismiss too short to read'] },
      { num: '2.2.2', name: 'Pause, Stop, Hide', level: 'A', text: 'Moving, blinking or auto-updating content can be paused, stopped or hidden.', auto: 'partial', rules: ['Autoplaying media without control'] },
      { num: '2.3.1', name: 'Three Flashes or Below Threshold', level: 'A', text: 'Nothing flashes more than three times a second.', auto: 'partial', rules: ['Flashing content'] },
      { num: '2.4.1', name: 'Bypass Blocks', level: 'A', text: 'People can skip repeated blocks, such as with a skip link or landmarks.', auto: 'auto', rules: ['Skip link missing', 'Landmark regions missing'] },
      { num: '2.4.2', name: 'Page Titled', level: 'A', text: 'Each page has a title that says what it is.', auto: 'auto', rules: ['Non-descriptive page title'] },
      { num: '2.4.3', name: 'Focus Order', level: 'A', text: 'Keyboard focus moves in an order that keeps meaning.', auto: 'partial', rules: ['DOM order does not match visual order'] },
      { num: '2.4.4', name: 'Link Purpose (In Context)', level: 'A', text: 'Each link says where it goes, alone or with its sentence.', auto: 'partial', rules: ['Non-descriptive link text'] },
      { num: '2.4.5', name: 'Multiple Ways', level: 'AA', text: 'There is more than one way to find a page, such as navigation and search.', auto: 'manual' },
      { num: '2.4.6', name: 'Headings and Labels', level: 'AA', text: 'Headings and labels describe the topic or purpose.', auto: 'manual' },
      { num: '2.4.7', name: 'Focus Visible', level: 'AA', text: 'Keyboard focus is always visible.', auto: 'auto', rules: ['Focus indicator suppressed'] },
      { num: '2.4.11', name: 'Focus Not Obscured (Minimum)', level: 'AA', isNew: true, text: 'A focused element is never fully hidden behind sticky headers, banners or pop-ups.', auto: 'manual' },
      { num: '2.5.1', name: 'Pointer Gestures', level: 'A', text: 'Anything done with a multi-finger or path gesture also works with a single tap.', auto: 'manual' },
      { num: '2.5.2', name: 'Pointer Cancellation', level: 'A', text: 'Actions fire when the finger or button is released, so a slip can be undone.', auto: 'manual' },
      { num: '2.5.3', name: 'Label in Name', level: 'A', text: 'A control’s accessible name contains the words on it, so voice control works.', auto: 'manual' },
      { num: '2.5.4', name: 'Motion Actuation', level: 'A', text: 'Anything triggered by shaking or tilting also has a button, and can be turned off.', auto: 'manual' },
      { num: '2.5.7', name: 'Dragging Movements', level: 'AA', isNew: true, text: 'Anything done by dragging can also be done with single taps or clicks.', auto: 'manual' },
      { num: '2.5.8', name: 'Target Size (Minimum)', level: 'AA', isNew: true, text: 'Targets are at least 24×24 CSS pixels, or have enough space around them. Inline links in text are exempt.', auto: 'auto', rules: ['Target size below minimum', 'Tap targets too small for a thumb'] },
    ],
  },
  {
    id: 'understandable',
    name: 'Understandable',
    summary: 'People can understand the content and predict what the interface will do.',
    items: [
      { num: '3.1.1', name: 'Language of Page', level: 'A', text: 'The page declares its language, so screen readers pronounce it correctly.', auto: 'auto', rules: ['Missing or incorrect lang attribute'] },
      { num: '3.1.2', name: 'Language of Parts', level: 'AA', text: 'Passages in another language are marked as such.', auto: 'manual' },
      { num: '3.2.1', name: 'On Focus', level: 'A', text: 'Focusing an element does not change the page or context on its own.', auto: 'manual' },
      { num: '3.2.2', name: 'On Input', level: 'A', text: 'Changing a field does not cause an unexpected change of context.', auto: 'manual' },
      { num: '3.2.3', name: 'Consistent Navigation', level: 'AA', text: 'Repeated navigation appears in the same order on every page.', auto: 'manual' },
      { num: '3.2.4', name: 'Consistent Identification', level: 'AA', text: 'Things that do the same job are labelled the same way everywhere.', auto: 'manual' },
      { num: '3.2.6', name: 'Consistent Help', level: 'A', isNew: true, text: 'Help, such as contact details or chat, is in the same place on every page that has it.', auto: 'manual' },
      { num: '3.3.1', name: 'Error Identification', level: 'A', text: 'Errors are described in text and the field at fault is identified.', auto: 'manual' },
      { num: '3.3.2', name: 'Labels or Instructions', level: 'A', text: 'Fields have visible labels or instructions.', auto: 'partial', rules: ['Input missing programmatic label', 'Placeholder used as the only label', 'Required and optional fields not distinguished'] },
      { num: '3.3.3', name: 'Error Suggestion', level: 'AA', text: 'Error messages say how to fix the problem when that is known.', auto: 'partial', rules: ['Error message states the problem without the correction'] },
      { num: '3.3.4', name: 'Error Prevention (Legal, Financial, Data)', level: 'AA', text: 'Legal, financial or data-changing submissions can be checked, corrected or reversed.', auto: 'partial', rules: ['Destructive action without confirmation or undo'] },
      { num: '3.3.7', name: 'Redundant Entry', level: 'A', isNew: true, text: 'People are not asked to type the same information twice in one process.', auto: 'manual' },
      { num: '3.3.8', name: 'Accessible Authentication (Minimum)', level: 'AA', isNew: true, text: 'Logging in does not depend on a memory or puzzle test, unless an alternative or help is offered.', auto: 'manual' },
    ],
  },
  {
    id: 'robust',
    name: 'Robust',
    summary: 'The code works with today’s browsers and assistive technology, and tomorrow’s.',
    items: [
      { num: '4.1.2', name: 'Name, Role, Value', level: 'A', text: 'Every control exposes its name, role and state to assistive technology.', auto: 'partial', rules: ['Icon-only control without accessible name', 'Input missing programmatic label'] },
      { num: '4.1.3', name: 'Status Messages', level: 'AA', text: 'Status messages, such as "Added to basket", are announced without moving focus.', auto: 'manual' },
    ],
  },
];
