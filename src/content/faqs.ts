/**
 * The homepage FAQ, verbatim from "ProCurveUX Landing Page Copy (Approved)",
 * 6 Nov 2026.
 *
 * Also the source for the FAQPage JSON-LD the copy deck asks for, so the
 * answers a search engine indexes are the answers on the page.
 *
 * Before launch, the copy deck asks that two of these become true: a report can
 * be deleted from the account, and the AI provider is confirmed not to train on
 * report data. Both back "What happens to my data?".
 */
export const FAQS = [
  {
    q: 'How does ProCurveUX analyse my website?',
    a: "ProCurveUX loads your site in a real browser at desktop and mobile sizes, interacts with it, and checks every page against 120+ rules drawn from UX laws, Nielsen's usability heuristics, visual design principles and WCAG 2.2 accessibility guidelines. Each finding is tied to a specific element with a screenshot and a fix.",
  },
  {
    q: 'How accurate are the findings?',
    a: 'ProCurveUX is most reliable on things it can measure, such as contrast, tap-target size, missing labels, heading structure, layout shift and CTA prominence. Judgement calls like brand fit, copy tone and complex flows are marked "needs manual review," and you get a short checklist for them. Treat it as a thorough first pass, not a final verdict.',
  },
  {
    q: 'Does ProCurveUX replace a UX designer?',
    a: "No. It replaces the slow, repetitive first pass of a review: finding and documenting the measurable problems. It doesn't replace user research, testing or design judgement. Designers use it to start reviews with the basics already covered, and founders use it to know what to ask a designer for.",
  },
  {
    q: "Can I audit a site I don't own?",
    a: "Yes, any public URL. Agencies use it on prospects, and teams use it to benchmark competitors. ProCurveUX only views pages the way a normal visitor would. It doesn't log in, submit forms or bypass access controls.",
  },
  {
    q: 'How long does an audit take?',
    a: 'About 60 seconds per page. Heavy pages, or sites with bot protection, can take a little longer.',
  },
  {
    q: 'Do I need to install anything?',
    a: "No. There's no script, no code snippet and no browser extension. Paste a URL and ProCurveUX does the rest from the outside.",
  },
  {
    q: 'Can I share or export the report?',
    a: 'Yes. Every report, including the free one, exports as a PDF with annotated screenshots, and you can send it straight to your developer, client or team.',
  },
  {
    q: 'What happens to my data?',
    a: "We store the URL, screenshots and findings so you can view and compare your reports. You can delete any report at any time. We don't sell your data, and we don't use your reports to train AI models.",
  },
  {
    q: 'Is the free audit really free?',
    a: "Yes. Your first full audit costs nothing and includes every check and every finding. All you need is an email address. There's no card and no trial that turns into a charge.",
  },
  {
    q: 'Can ProCurveUX audit pages behind a login?',
    a: 'Not yet. ProCurveUX audits publicly reachable pages. For logged-in areas, audit a public staging or preview URL.',
  },
  {
    q: 'How is ProCurveUX different from Lighthouse or heatmap tools?',
    a: "Lighthouse scores performance and SEO. Heatmaps show what visitors do once you've installed a script and collected traffic. ProCurveUX checks usability, design, conversion friction and UX laws on day one, with no script, and ranks fixes by your goal.",
  },
];

/** FAQPage structured data, as the copy deck's SEO section asks for. */
export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
