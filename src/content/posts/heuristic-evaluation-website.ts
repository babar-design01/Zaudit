import type { CoverBars, Post } from '../blog';

/*
 * Heuristic evaluation of a website. Every Nielsen figure is from the NN/g
 * pages in `sources` (read 9 Nov 2026). ProCurveUX rule names are quoted from
 * lib/audit/catalog.
 */
export const post: Post = {
  slug: 'heuristic-evaluation-website',
  title: 'How to run a heuristic evaluation of a website',
  seoTitle: "Heuristic Evaluation of a Website: Nielsen's 10 Heuristics, Step by Step",
  description:
    "A step-by-step guide to evaluating a website against Nielsen's 10 usability heuristics: web examples, how many evaluators, severity ratings and how to write up findings.",
  date: '2026-11-09',
  category: 'UX audits',
  tags: ['Heuristic evaluation', 'Usability', 'UX audits'],
  author: 'muhammad-babar',
  cover: 'heuristics',
  body: [
    {
      type: 'answer',
      text: "A heuristic evaluation is an expert review: a few evaluators each walk through your website on their own and note every place it breaks one of Jakob Nielsen's 10 usability heuristics. Nielsen Norman Group recommends three to five evaluators, because one person finds only about a third of the problems. Each problem then gets a severity rating from 0 to 4, and the merged, rated list becomes your fix plan.",
    },
    {
      type: 'p',
      text: "Heuristic evaluation is one of the cheapest ways to find usability problems before your customers do. It needs no recruiting and no lab, just a few people, a clear scope and a shared set of rules. This guide translates each of Nielsen's heuristics into website terms, then walks through the method Nielsen Norman Group (NN/g) describes: how many evaluators to use, how to rate severity, and how to write findings a team will act on.",
    },

    { type: 'h2', text: 'What each heuristic means on a real website' },
    {
      type: 'p',
      text: 'Nielsen first developed the heuristics with Rolf Molich in 1990 and refined them in 1994. NN/g illustrates them with everyday objects such as mall maps and road signs. Here is what each one looks like on a website, with a typical violation.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        {
          lead: 'Visibility of System Status.',
          text: 'Keep people informed with timely feedback. Violation: a "Pay now" button that shows no sign it was pressed, so people press it again.',
        },
        {
          lead: 'Match Between the System and the Real World.',
          text: "Use your customers' words and familiar conventions. Violation: navigation labelled with internal team names, so visitors can't tell which menu holds pricing.",
        },
        {
          lead: 'User Control and Freedom.',
          text: 'Give clearly marked exits and undo. Violation: a newsletter pop-up with no visible close button, or a three-step form with no way back.',
        },
        {
          lead: 'Consistency and Standards.',
          text: 'Keep words and patterns the same across the site, and follow web conventions. Violation: "Sign up" on one page and "Create account" on the next for the same action.',
        },
        {
          lead: 'Error Prevention.',
          text: 'Stop mistakes before they happen, with constraints, good defaults or confirmation. Violation: deleting a saved address with one tap and no undo.',
        },
        {
          lead: 'Recognition Rather than Recall.',
          text: "Keep options and information visible so people don't have to remember them. Violation: product filters that reset when someone returns to the list.",
        },
        {
          lead: 'Flexibility and Efficiency of Use.',
          text: 'Offer shortcuts for frequent users that stay out of the way of new ones. Violation: a store with thousands of products and no search box.',
        },
        {
          lead: 'Aesthetic and Minimalist Design.',
          text: 'Remove content that competes with what matters. Violation: a hero with three equally loud buttons, a carousel and a chat bubble.',
        },
        {
          lead: 'Help Users Recognize, Diagnose, and Recover from Errors.',
          text: 'Describe errors in plain language, say what went wrong and suggest a fix. Violation: "Invalid input" under a phone field, with no hint of the expected format.',
        },
        {
          lead: 'Help and Documentation.',
          text: 'Provide concise, searchable help focused on tasks. Violation: a help centre that explains account settings but not the checkout step where people get stuck.',
        },
      ],
    },

    { type: 'h2', text: 'How many evaluators do you need?' },
    {
      type: 'p',
      text: "More than one. In Nielsen's own data, averaged over six projects, single evaluators found only 35% of the usability problems in an interface. Across six case studies he modelled, the share one evaluator found ranged from 19% to 51%, with a mean of 34% (Nielsen, 1994). Even in the best case, one evaluator missed about half the problems.",
    },
    {
      type: 'p',
      text: 'Adding evaluators adds coverage, but with diminishing returns. Nielsen\'s recommendation is "normally to use three to five evaluators", because larger numbers add little new information. In his worked cost-benefit example, four evaluators was the optimum, with benefits about 62 times the cost (Nielsen, 1994).',
    },
    {
      type: 'p',
      text: "NN/g's current guide keeps the same advice: ideally, three to five people should independently evaluate the same interface, since each evaluator, however expert, is likely to miss some issues (Moran and Gordon, 2023).",
    },
    {
      type: 'tip',
      label: 'If you only have one evaluator:',
      text: 'Run the review anyway, but treat the result as a partial list. Rotate a different person in next time so the blind spots change.',
    },

    { type: 'h2', text: 'How to run the evaluation, step by step' },
    {
      type: 'list',
      ordered: true,
      items: [
        {
          lead: 'Set the scope.',
          text: 'Pick the pages and tasks that matter most, such as "find a product and check out" or "start a free trial". Write them down so every evaluator reviews the same thing. The [UX audit template](/ux-audit-template) gives you a structure to record them in.',
        },
        {
          lead: 'Brief the evaluators.',
          text: 'Share the ten heuristics, who the site is for and the tasks in scope. Ask them to check both desktop and a phone, because many websites behave differently on each.',
        },
        {
          lead: 'Evaluate independently.',
          text: "Each person works alone and doesn't see anyone else's findings until they finish. NN/g suggests reserving about 1–2 hours and timeboxing it (Moran and Gordon, 2023).",
        },
        {
          lead: 'Go through each task twice.',
          text: 'The first pass is to learn how the site works. The second is to look for places it breaks a heuristic.',
        },
        {
          lead: 'Log one problem per note.',
          text: 'Record the page, the heuristic, what happened and a screenshot. One problem per note makes merging easier.',
        },
        {
          lead: 'Merge the findings.',
          text: 'Cluster similar issues on a shared board, then discuss where evaluators agree, which issues matter most and which need more data (Moran and Gordon, 2023).',
        },
      ],
    },

    { type: 'h2', text: 'How to rate severity' },
    {
      type: 'p',
      text: "Severity tells the team what to fix first. Nielsen describes it as a mix of three factors: frequency (how often the problem occurs), impact (how hard it is to get past) and persistence (whether people get caught once, or every time). He adds market impact, since some easy-to-overcome problems still hurt a product's popularity (Nielsen, 1994).",
    },
    {
      type: 'table',
      caption: "Nielsen's severity scale, with his wording for each level (Nielsen, 1994)",
      head: ['Rating', "Nielsen's label", 'What it means for the fix list'],
      rows: [
        ['0', "I don't agree that this is a usability problem at all", 'Drop it, and note why'],
        ['1', 'Cosmetic problem only', 'Fix only if extra time is available'],
        ['2', 'Minor usability problem', 'Low priority'],
        ['3', 'Major usability problem', 'Important to fix; high priority'],
        ['4', 'Usability catastrophe', 'Imperative to fix before release'],
      ],
    },
    {
      type: 'p',
      text: "Rate severity after the evaluation, not during it. Nielsen found evaluators rate poorly while they are focused on finding new problems. Instead, send everyone the merged list and let each person rate it alone, which takes about 30 minutes. Ratings from a single evaluator are too unreliable to trust; the mean of three evaluators' ratings is good enough for most practical purposes (Nielsen, 1994).",
    },

    { type: 'h2', text: 'How to write up findings' },
    { type: 'p', text: 'A finding should let someone who missed the evaluation understand the problem and fix it. For each one, record:' },
    {
      type: 'list',
      items: [
        { lead: 'A title that names the problem,', text: 'not the solution: "Phone field rejects spaces with no explanation", not "Improve validation".' },
        { lead: 'Where it happens:', text: 'the URL, the page state and the device.' },
        { lead: 'The heuristic it breaks,', text: 'by name.' },
        { lead: 'Evidence:', text: 'a screenshot and the steps to reproduce it.' },
        { lead: 'Who it affects and how:', text: 'which task it blocks or slows.' },
        { lead: 'Severity:', text: 'the mean rating, with the spread if evaluators disagreed.' },
        { lead: 'A suggested fix,', text: 'and whether it needs user research before anyone builds it.' },
      ],
    },
    {
      type: 'p',
      text: 'Open the write-up with a short summary of the highest-severity problems, then group the rest by page or task. To see one way of laying this out, look at the [sample ProCurveUX report](/report/sample).',
    },
    {
      type: 'tip',
      label: 'Keep it honest:',
      text: 'Heuristics are guidelines, not strict rules, and a violation is not automatically a problem. NN/g notes that heuristic evaluations cannot replace user research, and that deliberate trade-offs should be checked with research first (Moran and Gordon, 2023).',
    },

    { type: 'h2', text: 'Where automation helps, and where it can\'t' },
    {
      type: 'p',
      text: "Some heuristic violations leave measurable traces in a live page. ProCurveUX lists Nielsen's 10 heuristics among the standards behind its usability checks, and several of its rules map directly onto them:",
    },
    {
      type: 'table',
      caption: 'Examples of ProCurveUX rules that test part of a heuristic',
      head: ['Heuristic', 'Example ProCurveUX rules'],
      rows: [
        ['Visibility of System Status', '"Action without feedback"; "Progress not indicated in multi-step flow"'],
        ['User Control and Freedom', '"Modal without dismiss affordance"; "No exit path from a step"'],
        ['Consistency and Standards', '"Inconsistent interaction pattern for the same task"; "Same component rendered differently across pages"'],
        ['Error Prevention', '"Destructive action without confirmation or undo"; "Errors shown only on submit"'],
        ['Recognition Rather than Recall', '"Placeholder used as the only label"; "Current location not indicated in navigation"'],
        ['Flexibility and Efficiency of Use', '"No search where inventory exceeds browsing capacity"'],
        ['Aesthetic and Minimalist Design', '"Competing primary calls to action"; "Content wall without structure"'],
        ['Help Users Recognize, Diagnose, and Recover from Errors', '"Error message states the problem without the correction"'],
      ],
    },
    {
      type: 'p',
      text: 'What software cannot judge is meaning. It cannot tell whether your labels match the words your customers use, whether a flow makes sense for the task, or whether your help pages answer the questions people actually have. ProCurveUX marks judgement calls like these "needs manual review" rather than guessing, and its subjective rules fire only when more than one signal agrees.',
    },
    {
      type: 'p',
      text: 'The practical split is to run an automated audit first and clear the measurable issues, then spend your evaluators\' hours on judgement. For a rule-by-rule view of that boundary, read [what an automated UX audit can really catch](/blog/automated-ux-audit). Once you have a rated list, [turning findings into shipped fixes](/blog/zeeframes-ux-audit-to-redesign) is the next step.',
    },

    { type: 'h2', text: 'Frequently asked questions' },
    {
      type: 'faq',
      items: [
        {
          q: 'What is the difference between a heuristic evaluation and usability testing?',
          a: 'In a heuristic evaluation, evaluators judge a site against principles. In usability testing, you watch real users try tasks. NN/g says heuristic evaluations cannot replace user research, so use both.',
        },
        {
          q: 'How many evaluators should a heuristic evaluation use?',
          a: "Three to five. In Nielsen's data, a single evaluator found only 35% of the problems on average, and larger groups add little new information.",
        },
        {
          q: 'How long does a heuristic evaluation take?',
          a: 'NN/g suggests about 1–2 hours per evaluator for the review itself, plus about 30 minutes each to rate severity, plus time to merge the findings.',
        },
        {
          q: 'Can an automated tool do a heuristic evaluation?',
          a: 'Partly. Software can detect measurable violations, such as missing feedback or a modal with no close button. Judgements about language, flow and help content still need people.',
        },
      ],
    },
  ],
  sources: [
    {
      title: '10 Usability Heuristics for User Interface Design',
      publisher: 'Jakob Nielsen, Nielsen Norman Group',
      note: 'April 24, 1994; last reviewed January 30, 2024',
      url: 'https://www.nngroup.com/articles/ten-usability-heuristics/',
    },
    {
      title: 'How to Conduct a Heuristic Evaluation',
      publisher: 'Kate Moran and Kelley Gordon, Nielsen Norman Group',
      note: 'June 25, 2023',
      url: 'https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/',
    },
    {
      title: 'The Theory Behind Heuristic Evaluations',
      publisher: 'Jakob Nielsen, Nielsen Norman Group',
      note: 'November 1, 1994; single-evaluator figures and the cost-benefit example',
      url: 'https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/',
    },
    {
      title: 'Severity Ratings for Usability Problems',
      publisher: 'Jakob Nielsen, Nielsen Norman Group',
      note: 'November 1, 1994',
      url: 'https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/',
    },
  ],
  cta: {
    title: 'Clear the measurable problems before your evaluators start',
    text: 'Paste your URL into ProCurveUX for a free audit. It checks your live pages in a real browser and flags what needs a human eye.',
  },
};

/** Share of usability problems one evaluator found, across Nielsen's six case studies (NN/g, 1994). */
export const motif: CoverBars = {
  title: 'Found by one evaluator',
  chip: '6 studies',
  rows: [
    { label: 'Lowest', value: '19%', share: 19 },
    { label: 'Mean', value: '34%', share: 34 },
    { label: 'Highest', value: '51%', share: 51, strong: true },
  ],
};
