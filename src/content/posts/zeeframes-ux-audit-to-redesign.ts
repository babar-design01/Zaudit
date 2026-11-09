import type { CoverBars, Post } from '../blog';

/*
 * What to do after a UX audit. ZeeFrames facts are only from the author bio in
 * blog.ts and from the zeeframes.com pages in `sources` (read 9 Nov 2026).
 * The fix process is general advice, not a description of how ZeeFrames works.
 * ProCurveUX rule names are quoted from lib/audit/catalog.
 */
export const post: Post = {
  slug: 'zeeframes-ux-audit-to-redesign',
  title: 'After the UX audit: turning findings into shipped fixes',
  seoTitle: 'After a UX Audit: How to Fix the Findings or Brief a Design Agency',
  description:
    "A UX audit is a list, not a result. How to triage findings, fix what you can, brief a design team on the rest and judge an agency's work.",
  date: '2026-11-09',
  category: 'Design services',
  tags: ['UX audits', 'Redesign', 'Design agencies'],
  author: 'muhammad-babar',
  cover: 'zeeframes',
  body: [
    {
      type: 'answer',
      text: 'After a UX audit, sort the findings by severity and effort, fix the clear and cheap ones yourself, and save design time for problems that need research, new flows or a design system. If you bring in a design team, give them the full report, your goals and your constraints, and ask how they will check that the fixes worked. Then re-run the audit on the same pages to confirm.',
    },
    {
      type: 'p',
      text: "An audit report feels like progress, but it isn't yet. A list of findings sitting in a shared folder changes nothing for your visitors. The work that matters starts after the report: deciding what to fix, who fixes it, and how you'll know it worked. This guide covers that step, including when you need a design team and how to brief one.",
    },
    {
      type: 'tip',
      label: 'Disclosure:',
      text: 'I am Muhammad Babar, Co-Founder and Design Director at ZeeFrames, the design agency whose team builds ProCurveUX. ZeeFrames comes up later as one option. The advice applies whichever team you choose, including your own.',
    },

    { type: 'h2', text: 'Start by triaging the report' },
    {
      type: 'p',
      text: "Not every finding deserves the same attention. Give each one two scores: how severe it is, and how much effort it takes to fix. For severity, Jakob Nielsen's 0–4 scale works well, and our guide to [running a heuristic evaluation](/blog/heuristic-evaluation-website) explains how to apply it. For effort, a rough small, medium or large is enough.",
    },
    {
      type: 'p',
      text: 'Then plot the findings on a simple two-axis chart. NN/g describes this kind of prioritisation matrix as a way to compare items on two weighted criteria, such as value to the user and effort for the organisation. It recommends that team members vote on their own first, to stop the loudest person in the room from deciding the outcome (Gibbons, 2018).',
    },
    {
      type: 'table',
      caption: 'A simple way to sort audit findings by severity and effort',
      head: ['Group', 'Typical findings', 'What to do'],
      rows: [
        ['High severity, low effort', 'Low-contrast text, missing labels, a modal with no close button', 'Fix now, in-house'],
        ['High severity, high effort', 'A confusing checkout, navigation people get lost in', 'Plan as design work; research first'],
        ['Low severity, low effort', 'Inconsistent spacing or button styles', 'Batch into a clean-up sprint'],
        ['Low severity, high effort', 'A full visual refresh', 'Park it until the bigger problems are fixed'],
      ],
    },
    {
      type: 'p',
      text: "Drop findings you disagree with, but write down why. An audit, automated or human, can be wrong about your context. Keep findings marked \"needs manual review\" in a separate pile: they are questions for a person, not answers.",
    },

    { type: 'h2', text: 'What you can fix yourself' },
    {
      type: 'p',
      text: 'Many findings are specific code or content changes with one clear right answer. In a ProCurveUX report, rules such as "Body text contrast below minimum", "Input missing programmatic label", "Placeholder used as the only label", "Target size below minimum", "Informative image missing alt text" and "Non-descriptive link text" each come with the element, a screenshot and a fix. A developer can handle these without a designer, as long as the changes follow your existing styles.',
    },
    {
      type: 'p',
      text: 'Our [accessibility checklist](/accessibility-checklist) covers many of these in plain language, so a developer or content editor can work through them without design help.',
    },
    {
      type: 'tip',
      label: 'Fix it once:',
      text: 'If the same problem appears on every page, fix the source. Change the colour token or the shared form component, not each page by hand.',
    },

    { type: 'h2', text: 'When to bring in a design team' },
    { type: 'p', text: 'Outside help earns its cost when the fix is a design decision rather than a code change. The signs:' },
    {
      type: 'list',
      items: [
        {
          lead: 'The same problem shows up in many forms.',
          text: 'Findings like "Same component rendered differently across pages", "Type scale sprawl" or "Color palette sprawl" point to a missing or broken design system. Patching each instance won\'t stop new ones.',
        },
        {
          lead: 'The fix changes a flow, not a component.',
          text: 'If "Key task exceeds click depth budget" fires on your sign-up path, someone has to redesign the path, not restyle a button.',
        },
        {
          lead: 'The answer depends on your users.',
          text: 'Whether your labels match how customers talk, or whether pricing is clear, cannot be settled by opinion. It needs research.',
        },
        {
          lead: 'Fixes conflict.',
          text: 'Making one call to action stronger can weaken another. Resolving that needs someone thinking about the whole page.',
        },
        {
          lead: 'Nobody has the time.',
          text: 'A clear list that sits untouched for a quarter is worth nothing. Sometimes the reason to hire is capacity, and that is fine.',
        },
      ],
    },
    {
      type: 'p',
      text: "If your list is mostly measurable fixes from the first group, you probably don't need an agency. Spend the money after you've cleared them and re-audited.",
    },

    { type: 'h2', text: 'How to brief a design agency with an audit report' },
    { type: 'p', text: 'A good brief saves the first two weeks of any engagement. Include:' },
    {
      type: 'list',
      ordered: true,
      items: [
        {
          lead: 'The full report, not a summary.',
          text: 'Evidence such as screenshots, page states and severity lets the team check findings for themselves. The [sample report](/report/sample) shows what that evidence looks like.',
        },
        { lead: 'The goal.', text: 'Name the metric and the pages that matter: trial sign-ups, demo requests or completed checkouts.' },
        { lead: "What you've already done.", text: "List what you've fixed, what you've ruled out, and why." },
        { lead: 'Your constraints.', text: 'Your tech stack, CMS, brand rules, release schedule and who signs off on designs.' },
        { lead: 'The findings you disagree with.', text: 'Saying so up front avoids paying someone to fix a non-problem.' },
        { lead: 'Access.', text: 'Analytics, a staging site and existing design files, if you have them.' },
        { lead: 'A request for a plan back.', text: 'Ask which findings they would tackle first, what they would research, and how they would measure success.' },
      ],
    },

    { type: 'h2', text: 'What a good fix process looks like' },
    {
      type: 'p',
      text: 'Whoever does the work, in-house or agency, the process should have the same shape. First, confirm the problem: reproduce it, and check analytics or session recordings to see how many people it affects. Second, fix it at the right level, whether that is a token, a component or a whole flow.',
    },
    {
      type: 'p',
      text: 'Third, test changes to flows with real people before you ship them. Nielsen found that a study with five users finds about 85% of usability problems, and that three small studies of five users each improve a design far more than one large study. Retesting matters because a new design can introduce new problems (Nielsen, 2000).',
    },
    {
      type: 'p',
      text: 'Fourth, hand off with specs your developers can build from, and ship in stages where you can. Finally, re-audit the same pages on the same devices and compare the reports. A fix you can\'t measure is a guess.',
    },

    { type: 'h2', text: 'How to judge a design agency' },
    { type: 'p', text: 'Portfolios show what an agency can make look good. These questions show how it works:' },
    {
      type: 'list',
      items: [
        { lead: 'Did they read the report before the first call?', text: 'A good team arrives with questions, and pushes back on findings it thinks are wrong.' },
        { lead: 'Do they ask about goals and constraints before showing ideas?', text: 'Design that ignores your stack or release schedule will not ship.' },
        { lead: 'Do their case studies explain the problem and the process,', text: 'or only show finished screens?' },
        { lead: 'How will they validate the work?', text: 'Ask who runs usability testing, with whom, and when.' },
        { lead: 'Is the handoff usable?', text: 'Specs, components and tokens your developers can build from, not just pictures.' },
        { lead: 'Is the scope written down?', text: 'Which flows, which deliverables, and what happens after launch.' },
      ],
    },
    {
      type: 'p',
      text: 'Be wary of any agency that proposes a full redesign before reading the audit, or guarantees a conversion uplift. Neither is possible to promise honestly before the problems are understood.',
    },

    { type: 'h2', text: 'Where ZeeFrames fits' },
    {
      type: 'p',
      text: 'ZeeFrames is one option. It is a digital design agency with offices in Lahore, Austin and Manchester, and I work remotely with teams in the US, the UK, the Gulf and Australia. Our work runs from UX research and strategy through wireframes and prototypes to design systems and finished web and mobile apps.',
    },
    {
      type: 'p',
      text: 'The [ZeeFrames product revamp service](https://zeeframes.com/services/product-revamp) covers the high-effort work described above: a UX audit and gap analysis, redesign of priority flows, design system migration, usability testing with real users and an engineering handoff. If you want an expert review on top of an automated one, its [fixed-scope UX audit](https://zeeframes.com/services/ux-audit) includes a heuristic evaluation, benchmarking against two to three competitors and issues ranked by impact and effort.',
    },
    {
      type: 'p',
      text: "Recent projects, including AI products for pathology, legal intake and nutrition tracking, are on the [ZeeFrames work page](https://zeeframes.com/work). Judge them with the same questions as any other agency's. Because our team builds ProCurveUX, we know its reports well. That is a convenience, not a reason to choose us. If you want to talk it through, [get in touch](/contact).",
    },

    { type: 'h2', text: 'Frequently asked questions' },
    {
      type: 'faq',
      items: [
        {
          q: 'Should I fix everything in a UX audit?',
          a: 'No. Rate each finding by severity and effort, fix the severe and cheap ones first, and drop the ones you disagree with after writing down why.',
        },
        {
          q: 'Do I need a design agency to act on a UX audit?',
          a: 'Not for measurable fixes such as contrast, labels and tap targets. A design team helps when the fix changes a flow, needs research, or points to a missing design system.',
        },
        {
          q: 'What should I send a design agency along with the audit?',
          a: "The full report, your goal and key pages, what you've already fixed, your constraints, the findings you disagree with, and access to analytics and staging.",
        },
        {
          q: 'How do I know the fixes worked?',
          a: 'Re-audit the same pages on the same devices and compare. For changes to flows, test with a few users and watch the metric you named in the brief.',
        },
      ],
    },
  ],
  sources: [
    {
      title: 'Product Revamp',
      publisher: 'ZeeFrames',
      note: 'service page: deliverables and phases',
      url: 'https://zeeframes.com/services/product-revamp',
    },
    {
      title: 'UX Audit',
      publisher: 'ZeeFrames',
      note: 'service page: what the fixed-scope audit covers',
      url: 'https://zeeframes.com/services/ux-audit',
    },
    {
      title: 'Our recent work',
      publisher: 'ZeeFrames',
      note: 'case studies',
      url: 'https://zeeframes.com/work',
    },
    {
      title: 'Using Prioritization Matrices to Inform UX Decisions',
      publisher: 'Sarah Gibbons, Nielsen Norman Group',
      note: 'May 27, 2018',
      url: 'https://www.nngroup.com/articles/prioritization-matrices/',
    },
    {
      title: 'Why You Only Need to Test with 5 Users',
      publisher: 'Jakob Nielsen, Nielsen Norman Group',
      note: 'March 18, 2000',
      url: 'https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/',
    },
    {
      title: 'Severity Ratings for Usability Problems',
      publisher: 'Jakob Nielsen, Nielsen Norman Group',
      note: 'November 1, 1994',
      url: 'https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/',
    },
  ],
  cta: {
    title: 'Know what to fix before you brief anyone',
    text: 'Run a free ProCurveUX audit for a ranked fix list with evidence. Then fix what you can, or bring the report to our team through the contact page.',
  },
};

// The article's triage order, first to last: a priority, not a measurement.
export const motif: CoverBars = {
  title: 'After the audit',
  chip: 'Fix order',
  rows: [
    { label: 'Fix now', value: '1st', share: 100, strong: true },
    { label: 'Plan', value: '2nd', share: 66 },
    { label: 'Batch', value: '3rd', share: 38 },
  ],
};
