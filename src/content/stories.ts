/**
 * Customer stories for the homepage band.
 *
 * TODO(design): every entry here is a SAMPLE from the handoff — invented
 * people, invented companies, and `[00]` figures waiting for real numbers.
 * The copy deck is explicit: never publish placeholder quotes. Replace these
 * with real customers, or remove the band, before the site goes public.
 */
export const STORIES_ARE_PLACEHOLDERS = true;

export type Story = {
  company: string;
  /** How the company's name is set as a wordmark on its tab. */
  logoFont: string;
  logoTrack: string;
  logoCase: 'none' | 'uppercase' | 'lowercase';
  initials: string;
  name: string;
  role: string;
  quote: string;
  stat1: string;
  stat1Label: string;
  stat2: string;
  stat2Label: string;
};

export const STORIES: Story[] = [
  {
    company: 'Fieldnote',
    logoFont: '800 22px/1 var(--font-sans)',
    logoTrack: '-0.03em',
    logoCase: 'none',
    initials: 'ML',
    name: 'Maya Lindqvist',
    role: 'Head of Product Design',
    quote:
      'We ran the audit on our checkout flow and got back findings we could act on the same day. The severity and confidence scores made it easy to decide what to fix first instead of debating opinions.',
    stat1: '[00]',
    stat1Label: 'Findings fixed in the first sprint',
    stat2: '[0]x',
    stat2Label: 'Faster from audit to decision',
  },
  {
    company: 'Arcadia Labs',
    logoFont: '600 15px/1 var(--font-sans)',
    logoTrack: '0.32em',
    logoCase: 'uppercase',
    initials: 'DO',
    name: 'Daniel Okafor',
    role: 'Engineering Lead',
    quote:
      'The written fixes are the difference. Instead of “improve contrast” we got exact values and element references our developers could ship without a follow-up meeting.',
    stat1: '[00]',
    stat1Label: 'Follow-up meetings saved per release',
    stat2: '[00]%',
    stat2Label: 'Fixes shipped without clarification',
  },
  {
    company: 'Loomwork',
    logoFont: '300 24px/1 var(--font-sans)',
    logoTrack: '0.02em',
    logoCase: 'lowercase',
    initials: 'SM',
    name: 'Sofia Marchetti',
    role: 'UX Consultant',
    quote:
      'We audit every client site before a redesign kickoff now. The structured findings give us an evidence-backed starting point that clients trust far more than a slide of observations.',
    stat1: '[00]+',
    stat1Label: 'Client sites audited before kickoff',
    stat2: '[0]x',
    stat2Label: 'Faster discovery phase',
  },
  {
    company: 'Northbeam',
    logoFont: '700 19px/1 var(--font-sans)',
    logoTrack: '0.08em',
    logoCase: 'uppercase',
    initials: 'PR',
    name: 'Priya Raman',
    role: 'Founder',
    quote:
      'I am not a designer, and I did not need to be. The report told me in plain language what was hurting sign-ups and which three fixes to hand the team first.',
    stat1: '[00]%',
    stat1Label: 'Lift in sign-up completion',
    stat2: '[0]',
    stat2Label: 'Fixes prioritised for the first sprint',
  },
  {
    company: 'Halcyon',
    logoFont: '500 22px/1 var(--font-sans)',
    logoTrack: '-0.01em',
    logoCase: 'none',
    initials: 'JW',
    name: 'James Whitaker',
    role: 'Accessibility Lead',
    quote:
      'Contrast measured from rendered pixels and a real Tab walk through the page. It caught focus traps our manual reviews kept missing, and every finding cited the WCAG criterion.',
    stat1: '[00]',
    stat1Label: 'Accessibility issues closed before launch',
    stat2: '[0]x',
    stat2Label: 'Faster pre-launch QA',
  },
];
