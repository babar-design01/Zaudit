/**
 * Every string on the homepage, transcribed from `Homepage Veltrex.dc.html` and
 * the design transcripts. Copy is verbatim — the user wrote it and signed off on
 * it line by line, so it does not get paraphrased here.
 */

import type { IconName } from '@/components/ui/Icon';

export const SOLUTIONS = [
  { label: 'Founders', desc: 'Find what’s costing you signups.' },
  { label: 'Designers', desc: 'Evidence for the redesign you proposed.' },
  { label: 'Agencies', desc: 'Client-ready audits in minutes.' },
  { label: 'Product Teams', desc: 'Track UX health release over release.' },
];

export const PROOF_FIELDS = [
  {
    label: 'What’s happening?',
    body: 'The primary and secondary actions have similar visual weight, making it harder to identify the intended next step.',
  },
  {
    label: 'Why it matters',
    body: 'When actions compete for attention, users may hesitate or choose a secondary path instead of the primary conversion action.',
  },
  { label: 'Based on', body: 'Visual Hierarchy · Von Restorff Effect' },
  {
    label: 'Recommended action',
    body: 'Create stronger visual differentiation between the primary and secondary actions through contrast, hierarchy, and spacing.',
  },
];

/**
 * The problem section's horizontal journey. The prototype's template renders
 * `journey`, but the value was dropped from its logic during a later edit, so the
 * section shipped with an empty grid. Copy restored from the transcript where the
 * user specified this section; the 04 card has no closing line in that copy, so it
 * has none here.
 */
export type JourneyStep = {
  n: string;
  label: string;
  lead: string;
  points: string[];
  close?: string;
  emphasis?: boolean;
};

export const JOURNEY: JourneyStep[] = [
  {
    n: '01',
    label: 'Analytics',
    lead: 'See what happened.',
    points: ['Conversions dropped.', 'Users abandoned the flow.', 'Engagement decreased.'],
    close: 'You have the signal.',
  },
  {
    n: '02',
    label: 'Behavioral Insights',
    lead: 'See where users struggled.',
    points: [
      'Users ignored a CTA.',
      'They repeatedly clicked an element.',
      'They abandoned a form.',
    ],
    close: 'You can see the behavior.',
  },
  {
    n: '03',
    label: 'The UX Gap',
    lead: 'But why is it happening?',
    points: [
      'Is the CTA unclear?',
      'Is there too much cognitive load?',
      'Is the hierarchy weak?',
      'Is the form creating unnecessary friction?',
    ],
    close: 'This still needs diagnosis.',
  },
  {
    n: '04',
    label: 'Zaudit UX Audit',
    lead: 'Turn signals into actionable UX findings.',
    points: [
      'Identify potential problems,',
      'connect them to evidence,',
      'understand why they matter,',
      'and know what to improve next.',
    ],
    emphasis: true,
  },
];

export const HOW_CARDS = [
  {
    n: '01',
    name: 'Connect',
    icon: 'captive_portal',
    title: 'Enter your website.',
    body: 'Paste your URL and let Zaudit understand the page and its context.',
    grad: 'linear-gradient(150deg, #DCEBFF 0%, #B7D4FF 55%, #93BAF8 100%)',
    placeholder: 'Drop the URL input screenshot',
  },
  {
    n: '02',
    name: 'Analyze',
    icon: 'query_stats',
    title: 'Review the experience from multiple perspectives.',
    body: 'Evaluate usability, visual design, accessibility, conversion, mobile UX, and established UX principles.',
    grad: 'linear-gradient(150deg, #D8F1FA 0%, #B3E1F0 55%, #8FCBE0 100%)',
    placeholder: 'Drop the analysis screenshot',
  },
  {
    n: '03',
    name: 'Diagnose',
    icon: 'troubleshoot',
    title: 'See what’s getting in the way.',
    body: 'Turn potential issues into structured findings with location, evidence, reasoning, severity, and impact.',
    grad: 'linear-gradient(150deg, #E9E2FB 0%, #D2C4F3 55%, #B9A4E8 100%)',
    placeholder: 'Drop the finding screenshot',
  },
  {
    n: '04',
    name: 'Improve',
    icon: 'trending_up',
    title: 'Know what to work on next.',
    body: 'Prioritize recommendations, make changes, and re-audit to see how the experience evolves.',
    grad: 'linear-gradient(150deg, #DCEFE5 0%, #B9DFCB 55%, #97CDB0 100%)',
    placeholder: 'Drop the re-audit screenshot',
  },
].map((c, i) => ({ ...c, top: 104 + i * 24 }));

export const DIMENSIONS = [
  {
    name: 'Usability',
    icon: 'ads_click',
    desc: 'Can users move through the experience with ease? We review navigation, discoverability, cognitive load, and user control.',
  },
  {
    name: 'UI & Visual Design',
    icon: 'palette',
    desc: 'Does the interface guide attention clearly? We review hierarchy, typography, spacing, and consistency.',
  },
  {
    name: 'Accessibility',
    icon: 'accessibility_new',
    desc: 'Can more people use the experience effectively? We review contrast, readability, labels, and interaction accessibility.',
  },
  {
    name: 'Conversion & Friction',
    icon: 'conversion_path',
    desc: 'Is anything getting in the way of action? We review CTA clarity, forms, trust, and decision friction.',
  },
  {
    name: 'UX Principles',
    icon: 'psychology',
    desc: 'Does the experience follow established UX thinking? We check against Nielsen heuristics, Hick’s law, Fitts’s law, and Gestalt principles.',
  },
  {
    name: 'Mobile Experience',
    icon: 'smartphone',
    desc: 'Does the experience hold up across smaller screens? We review responsive UX, touch, readability, and mobile navigation.',
  },
];

export const AUDIENCES = [
  {
    short: 'Founders & Business Owners',
    dot: '#7ED957',
    offset: 0,
    headline: 'See what may be getting in the way of growth.',
    body: 'Understand usability and conversion friction in plain language, identify high-impact issues, and know where your team should focus next.',
    cta: 'Explore for Founders',
  },
  {
    short: 'UX & Product Designers',
    dot: '#5FD9A8',
    offset: 48,
    headline: 'A second pair of eyes for every design.',
    body: 'Catch issues you may have missed, validate decisions against established UX principles, and turn findings into actionable improvements.',
    cta: 'Explore for Designers',
  },
  {
    short: 'UX Agencies & Consultants',
    dot: '#6FB4FF',
    offset: 0,
    headline: 'Turn UX audits into a repeatable workflow.',
    body: 'Analyze client experiences faster, review and refine AI findings, and deliver evidence-backed recommendations and professional reports.',
    cta: 'Explore for Agencies',
  },
  {
    short: 'Product Teams',
    dot: '#BFE05C',
    offset: 48,
    headline: 'Turn UX issues into clear priorities.',
    body: 'Bring potential UX debt into focus, prioritize improvements by impact and effort, and track what gets better across re-audits.',
    cta: 'Explore for Product Teams',
  },
];

const TESTIMONIALS = [
  {
    brand: 'Fieldnote',
    quote:
      '“We ran the audit on our checkout flow and got back findings we could act on the same day. The severity and confidence scores made it easy to decide what to fix first instead of debating opinions.”',
    name: 'Maya Lindqvist',
    role: 'Head of Product Design',
  },
  {
    brand: 'Arcadia Labs',
    quote:
      '“The written fixes are the difference. Instead of “improve contrast” we got exact values and element references our developers could ship without a follow-up meeting.”',
    name: 'Daniel Okafor',
    role: 'Engineering Lead',
  },
  {
    brand: 'Loomwork',
    quote:
      '“We audit every client site before a redesign kickoff now. The structured findings give us an evidence-backed starting point that clients trust far more than a slide of observations.”',
    name: 'Sofia Marchetti',
    role: 'UX Consultant',
  },
  {
    brand: 'Hatch Studio',
    quote:
      '“Re-auditing after each release keeps regressions from creeping back in. It has quietly become part of our definition of done.”',
    name: 'James Whitfield',
    role: 'Founder',
  },
];

/** Doubled so the -50% marquee translation loops seamlessly. */
export const TESTIMONIALS_LOOP = [...TESTIMONIALS, ...TESTIMONIALS];

export const ANATOMY = [
  'Severity, from critical to low',
  'Confidence, stated separately',
  'Impact × effort',
  'A written fix',
];

export const TIERS: {
  name: string;
  icon: IconName;
  summary: string;
  price: string;
  per: string;
  cta: string;
  features: string[];
}[] = [
  {
    name: 'Free',
    icon: 'IconSparkles',
    summary: 'Try a full audit on your own page with 1 free credit.',
    price: '$0',
    per: '1 credit',
    cta: 'Get Started',
    features: [
      '1 Credit',
      'UX Audit',
      'CRO Audit',
      'Content & Copywriting Audit',
      'Feedback for both Desktop and Mobile',
      'Detailed Section Recommendations',
      'Strategic Next-Step Recommendations',
      'Basic customer support',
    ],
  },
  {
    name: 'Standard',
    icon: 'IconZap',
    summary: 'For designers and product teams auditing regularly.',
    price: '$10',
    per: '20 credits',
    cta: 'Buy One-time Credits',
    features: [
      '20 Credits',
      'UX Audit',
      'CRO Audit',
      'Content & Copywriting Audit',
      'Feedback for both Desktop and Mobile',
      'Detailed Section Recommendations',
      'Strategic Next-Step Recommendations',
      'Basic customer support',
    ],
  },
  {
    name: 'Ultimate',
    icon: 'IconBriefcase',
    summary: 'For agencies auditing client experiences at scale.',
    price: '$30',
    per: '100 credits',
    cta: 'Buy One-time Credits',
    features: [
      '100 Credits',
      'UX Audit',
      'CRO Audit',
      'Content & Copywriting Audit',
      'Feedback for both Desktop and Mobile',
      'Detailed Section Recommendations',
      'Strategic Next-Step Recommendations',
      'Basic customer support',
    ],
  },
];

export const FAQS = [
  {
    q: 'How does Zaudit analyze my website?',
    a: 'Zaudit evaluates your website across usability, UI and visual design, accessibility, conversion friction, mobile experience, and established UX principles to surface structured findings.',
  },
  {
    q: 'How accurate are AI-generated UX findings?',
    a: 'UX is contextual, so findings shouldn’t be treated as absolute conclusions. Zaudit is designed to show the reasoning and evidence behind findings and let you review whether they apply to your experience.',
  },
  {
    q: 'Does Zaudit replace a UX designer?',
    a: 'No. Zaudit is designed to support designers, founders, and product teams by accelerating analysis and providing a structured second perspective—not replacing human judgment.',
  },
  {
    q: 'Do I need UX expertise to understand the audit?',
    a: 'No. Findings are explained in clear language, while supporting UX principles and deeper reasoning are available for users who want more detail.',
  },
  {
    q: 'Can I reject a finding that doesn’t apply?',
    a: 'Yes. Findings can be reviewed and classified so that intentional design decisions or irrelevant findings don’t have to be treated as active UX issues.',
  },
  {
    q: 'Can I audit mobile experiences?',
    a: 'Yes. Zaudit can evaluate responsive experiences to identify potential issues related to mobile hierarchy, navigation, readability, touch interactions, and other mobile UX considerations.',
  },
  {
    q: 'Can I generate a UX audit report?',
    a: 'Yes. Audit findings can be organized into a report containing key issues, evidence, priorities, and recommendations for sharing with your team or clients.',
  },
  {
    q: 'Is my website data secure?',
    a: 'We’re building Zaudit with privacy and data protection in mind. Full details about how website data, screenshots, and audit information are processed will be available in our Security and Privacy documentation.',
  },
];

/**
 * What the dialog says while each stage runs, in the order of `STAGES` in
 * `hooks/useAudit.ts`. One entry per stage; the lines rotate while that stage
 * is the one in flight.
 *
 * These describe work the engine actually does at that point. Nothing here
 * claims a step that may not run: the model is optional, so the review stage's
 * lines describe the checks that happen either way.
 */
export const AUDIT_STAGE_LINES: string[][] = [
  [
    'Opening the page in a real browser at 1440×900',
    'Measuring contrast, labels and names with axe-core',
    'Pressing Tab through every control on the page',
    'Re-reading motion with reduced motion switched on',
  ],
  [
    'Reading the address, forms and page structure',
    'Matching them to a page type',
    'Choosing which criteria apply to a page like this',
  ],
  [
    'Judging each criterion against what was measured',
    'Dropping anything without complete evidence',
    'Marking what needs a person rather than guessing',
  ],
  [
    'Grouping findings by root cause',
    'Moving uncertain findings to review',
    'Checking every sentence against the evidence',
  ],
  [
    'Scoring each pillar as a weighted pass rate',
    'Applying the weights your goal sets',
    'Ranking the five fixes worth doing first',
  ],
];
