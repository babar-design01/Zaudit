/**
 * The homepage FAQ, verbatim from the handoff's copy deck.
 *
 * Also the source for the FAQPage JSON-LD the copy deck asks for, so the
 * answers a search engine indexes are the answers on the page.
 *
 * TODO(design): "120+ rules" and "roughly two-thirds" are illustrative figures
 * from the copy deck and must be confirmed before launch.
 */
export const FAQS = [
  {
    q: 'How does Audix analyse my website?',
    a: "Audix loads your site in a real browser at desktop and mobile sizes, interacts with it, and checks every page against 120+ rules drawn from UX laws, Nielsen's usability heuristics, visual design principles and WCAG 2.2 accessibility guidelines. Each finding is tied to a specific element with a screenshot and a fix.",
  },
  {
    q: 'How accurate are the findings?',
    a: 'Automated checks cover roughly two-thirds of the UX issues a senior designer would flag in a manual review, with very few false positives because we test the rendered page rather than the source code. For the rest, Audix gives you a short manual review checklist and clearly marks what it could not test.',
  },
  {
    q: 'Does Audix replace a UX designer?',
    a: 'No. It replaces the weeks of waiting, the blank-page problem and the guesswork. Designers use Audix to find issues faster and bring evidence to decisions; the judgement calls about brand, tone and strategy still need a person.',
  },
  {
    q: "Can I audit a site I don't own?",
    a: "Yes, any publicly reachable URL. Agencies use this to audit prospects before a pitch. Pages behind a login or a paywall can't be audited unless you provide a public staging URL.",
  },
  {
    q: 'How long does an audit take?',
    a: "Most sites are done in about 60 seconds. Large sites with many pages can take a few minutes; you'll get an email when the report is ready.",
  },
  { q: 'Do I need to install anything?', a: 'No script, no plugin, no code. Paste a URL and go.' },
  {
    q: 'Can I share or export the report?',
    a: 'Yes. Every report has a shareable link, and paid plans add PDF export, CSV export and white-label branding for client delivery.',
  },
  {
    q: 'What happens to my data?',
    a: 'We store the screenshots and findings for your report so you can compare runs over time. We never sell or share your data, and you can delete any audit at any time.',
  },
  {
    q: 'Is the free audit really free?',
    a: 'Yes. One full audit a month on one website, no card, no trial countdown. You only pay when you want unlimited runs, more sites, or team features.',
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
