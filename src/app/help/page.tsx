import type { ReactNode } from 'react';
import { AuditUrlBox, JsonLd, PageHero, card, cols, frame, textLink } from '@/components/site/PageKit';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { FAQS } from '@/content/faqs';
import { pageMetadata } from '@/lib/page-meta';
import { PLANS, priceOf } from '@/lib/plans';

export const metadata = pageMetadata({
  title: 'Help centre | ProCurveUX',
  description: 'Answers on running a ProCurveUX audit, reading the report, starting a paid plan, and what happens to your data.',
  path: '/help',
});

/** A homepage FAQ answer, word for word, so the two never disagree. */
const faq = (q: string) => {
  const f = FAQS.find((x) => x.q === q);
  if (!f) throw new Error(`No homepage FAQ "${q}"`);
  return { q: f.q, a: f.a as ReactNode, text: f.a };
};

type QA = { q: string; a: ReactNode; text: string };

const plansList = PLANS.map((p) => `${p.name} is ${priceOf(p)} a month for ${p.auditsPerMonth} audits`).join('; ');

/**
 * `/help`: the homepage FAQ, grouped by what people are trying to do, plus the
 * answers about plans and data that only this page carries. Each answer is plain
 * text (`text`) for the FAQPage schema, and may carry links on the page (`a`).
 */
const GROUPS: { id: string; title: string; items: QA[] }[] = [
  {
    id: 'running',
    title: 'Running an audit',
    items: [
      faq('How does ProCurveUX analyse my website?'),
      faq('How long does an audit take?'),
      faq('Do I need to install anything?'),
      faq("Can I audit a site I don't own?"),
      faq('Can ProCurveUX audit pages behind a login?'),
      faq('Is the free audit really free?'),
    ],
  },
  {
    id: 'reports',
    title: 'Reading a report',
    items: [
      faq('How accurate are the findings?'),
      faq('Does ProCurveUX replace a UX designer?'),
      faq('Can I share or export the report?'),
      faq('How is ProCurveUX different from Lighthouse or heatmap tools?'),
    ],
  },
  {
    id: 'plans',
    title: 'Plans and billing',
    items: [
      {
        q: 'How do I start a paid plan?',
        text: 'Choose Get Starter, Get Pro or Get Agency on the pricing section. That opens our contact page with the plan already chosen. Send the form and we email you within one working day to set the plan up. Nothing is charged on this website.',
        a: (
          <>
            Choose Get Starter, Get Pro or Get Agency on the <a href="/#plans" style={textLink}>pricing section</a>. That opens our <a href="/contact" style={textLink}>contact page</a> with the plan already chosen. Send the form and we email you within one working day to set the plan up. Nothing is charged on this website.
          </>
        ),
      },
      {
        q: 'What do the plans cost?',
        text: `Your first audit is free. After that: ${plansList}.`,
        a: `Your first audit is free. After that: ${plansList}.`,
      },
      {
        q: 'Which plan should I choose?',
        text: `Pick by how often you audit. ${PLANS.map((p) => `${p.name}: ${p.summary.toLowerCase()}`).join('. ')}. If you're unsure, choose "Not sure yet" on the contact form and tell us what you need.`,
        a: (
          <>
            Pick by how often you audit. {PLANS.map((p) => `${p.name}: ${p.summary.toLowerCase()}`).join('. ')}. If you&apos;re unsure, choose &ldquo;Not sure yet&rdquo; on the <a href="/contact?plan=unsure" style={textLink}>contact form</a> and tell us what you need.
          </>
        ),
      },
      {
        q: 'How do I pay, cancel or get a refund?',
        text: 'Plans are set up by hand, so we send payment details in our reply, before the plan starts. Renewals, cancellation and refunds are covered in our Terms of service.',
        a: (
          <>
            Plans are set up by hand, so we send payment details in our reply, before the plan starts. Renewals, cancellation and refunds are covered in our <a href="/terms" style={textLink}>Terms of service</a>.
          </>
        ),
      },
    ],
  },
  {
    id: 'data',
    title: 'Account and data',
    items: [
      faq('What happens to my data?'),
      {
        q: 'How do I ask to see or delete my data?',
        text: 'Send us a message through the contact form, from the email address you used. Our Privacy policy explains your rights and how quickly we respond.',
        a: (
          <>
            Send us a message through the <a href="/contact" style={textLink}>contact form</a>, from the email address you used. Our <a href="/privacy" style={textLink}>Privacy policy</a> explains your rights and how quickly we respond.
          </>
        ),
      },
      {
        q: 'Why do you need my email to run an audit?',
        text: "An email address is all the free audit asks for. We keep it with your audit and may contact you about your results. We don't sell it.",
        a: "An email address is all the free audit asks for. We keep it with your audit and may contact you about your results. We don't sell it.",
      },
    ],
  },
];

export default function HelpPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GROUPS.flatMap((g) => g.items).map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.text } })),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav />
      <main id="main">
        <JsonLd data={schema} />
        <PageHero label="Help centre" title="How can we help?" intro="Answers on running an audit, reading the report, plans and your data." trail={[{ name: 'Help centre', path: '/help' }]}>
          <nav aria-label="Help topics" style={{ marginTop: '8px' }}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(200, 12) }}>
              {GROUPS.map((g) => (
                <li key={g.id}>
                  <a href={`#${g.id}`} style={{ ...card, padding: '18px 20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ink)', font: '600 16px/24px var(--font-sans)' }}>
                    {g.title}
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--ink-muted)' }}>{g.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </PageHero>

        <div style={{ ...frame, paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: '72px' }}>
          {GROUPS.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} style={{ scrollMarginTop: '96px', display: 'flex', flexWrap: 'wrap', gap: '24px 64px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
              <h2 id={`${g.id}-h`} style={{ flex: '0 1 280px', margin: 0, font: '500 clamp(24px, 2.4vw, 30px)/1.15 var(--font-sans)', letterSpacing: '-0.025em' }}>
                {g.title}
              </h2>
              <dl style={{ flex: '1 1 480px', minWidth: 0, maxWidth: '760px', margin: 0, display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {g.items.map((i) => (
                  <div key={i.q} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <dt style={{ font: '700 18px/26px var(--font-sans)', color: 'var(--ink)' }}>{i.q}</dt>
                    <dd style={{ margin: 0, font: '400 16px/27px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' }}>{i.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section aria-labelledby="still-h" style={{ ...card, padding: '32px', background: 'var(--blue-tint)', borderColor: '#D6E4FB', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h2 id="still-h" style={{ margin: 0, font: '700 22px/30px var(--font-sans)', letterSpacing: '-0.015em' }}>
                Still stuck?
              </h2>
              <span style={{ font: '400 16px/26px var(--font-sans)', color: 'var(--ink-secondary)' }}>A person replies within one working day.</span>
            </span>
            <a href="/contact" data-cta="primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '52px', background: 'var(--ink)', color: '#FFFFFF', font: '600 14px/20px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px', borderRadius: '2px' }}>
              Contact us
            </a>
          </section>
        </div>

        <AuditUrlBox />
      </main>
      <SiteFooter />
    </div>
  );
}
