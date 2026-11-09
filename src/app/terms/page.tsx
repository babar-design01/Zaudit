import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { LegalLayout, PageHero, prose, textLink } from '@/components/site/PageKit';
import { LEGAL, LEGAL_UPDATED } from '@/content/legal';
import { pageMetadata } from '@/lib/page-meta';

/*
 * `/terms`. A starting draft, NOT legal advice: have a lawyer check it before
 * relying on it, especially for EU or UK customers. Billing terms, the legal
 * entity and governing law are Babar's answers of 9 Nov 2026 (content/legal.ts).
 *
 * Plans are requested through /contact and switched on by hand; no card is
 * taken on the site (Conversion and Trust Fix Spec, 9 Nov 2026).
 */

export const metadata = pageMetadata({
  title: 'Terms of service | ProCurveUX',
  description: 'The terms for using ProCurveUX: who can use it, what you may audit, how paid plans are set up and billed, and what an audit does and does not promise.',
  path: '/terms',
});

const P = ({ children }: { children: React.ReactNode }) => <p style={prose.p}>{children}</p>;
const UL = ({ items }: { items: React.ReactNode[] }) => (
  <ul style={prose.ul}>
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);
const H3 = ({ children }: { children: React.ReactNode }) => <h3 style={prose.h3}>{children}</h3>;
const contactLink = (
  <a href="/contact" style={textLink}>
    contact form
  </a>
);

const sections = [
  {
    id: 'agreement',
    title: 'About these terms',
    body: (
      <>
        <P>
          These terms are an agreement between you and {LEGAL.name}, of {LEGAL.address} (“we”, “us”). They cover the ProCurveUX
          website at procurveux.com, the audits it runs, the reports it produces and the ProCurveUX Chrome extension (together, “the service”).
        </P>
        <P>
          By running an audit, creating an account or requesting a plan, you agree to these terms and to our{' '}
          <a href="/privacy" style={textLink}>
            Privacy policy
          </a>
          . If you use the service for a company, you agree on its behalf and confirm you are allowed to.
        </P>
      </>
    ),
  },
  {
    id: 'the-service',
    title: 'The service and who may use it',
    body: (
      <>
        <P>
          ProCurveUX loads a public web page in a browser, checks it against its UX, design and accessibility rules, and produces a report of findings and suggested fixes. We may add, change or remove features over time.
        </P>
        <UL
          items={[
            'You must be at least 16 years old to use the service.',
            'An audit needs a valid email address that belongs to you.',
            'If you create an account, keep access to your email secure, because the sign-in links we send go there. You are responsible for what happens in your account.',
            'Tell us straight away if you think someone else is using your account.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <P>
          You may audit any publicly reachable page: your own, a client’s, a prospect’s or a competitor’s. The audit views it the way a normal visitor would and does not log in, submit forms or get past access controls. You agree
          not to:
        </P>
        <UL
          items={[
            'Use the service to reach pages that are not public, or to get around logins, paywalls, robot checks or other access controls.',
            'Run audits in bulk or in a way meant to scrape, copy or collect content or personal data from other people’s sites.',
            'Overload a website, ours or anyone else’s, for example by auditing the same site over and over to slow it down.',
            'Get around the free audit limits, for example by using many email addresses.',
            'Copy, resell or reverse engineer the service, or use it to build a competing product.',
            'Use the service for anything illegal, or to harass, defame or harm anyone.',
          ]}
        />
        <P>We may limit, pause or refuse audits that break these rules or put the service at risk.</P>
      </>
    ),
  },
  {
    id: 'plans-and-billing',
    title: 'Plans and billing',
    body: (
      <>
        <H3>The free audit</H3>
        <P>Your first audit is free, includes every check and needs only your email. No card is asked for, and nothing turns into a charge.</P>
        <H3>Paid plans</H3>
        <UL
          items={[
            <>
              Paid plans (Starter, Pro and Agency) are requested through our {contactLink}. We reply within one working day and set the plan up by hand.
            </>,
            'No card or payment details are taken on the website. The price and the number of audits each month are the ones shown on the pricing section when you request the plan.',
            <>
              How you pay: we send an invoice through {LEGAL.payment}, and the plan starts once it is paid.
            </>,
            <>
              Renewal: plans run month to month. We email the next month’s invoice a few days before the plan renews, and it continues once that invoice is paid. If it is not paid, the plan ends at the end of the month already paid for.
            </>,
            <>
              Cancelling: you can cancel at any time by email to <a href={`mailto:${LEGAL.email}`} style={textLink}>{LEGAL.email}</a> or through the {contactLink}. Your plan stays active until the end of the month you have paid for.
            </>,
            <>
              Refunds: payments are not refundable, including for part of a month, except where the law requires a refund.
            </>,
            <>
              Unused audits: each month starts with your plan’s number of audits. Audits you do not use expire at the end of the month and do not carry over.
            </>,
          ]}
        />
        <P>We may change prices for future periods. If you are on a paid plan, we will tell you before a new price applies to you, and you can cancel before it does.</P>
      </>
    ),
  },
  {
    id: 'results',
    title: 'What an audit does and does not promise',
    body: (
      <>
        <P>Audit results are guidance from an automated review. They are a thorough first pass, not a final verdict. In particular:</P>
        <UL
          items={[
            'We do not guarantee more conversions, sales, sign-ups or any other result from making the suggested changes.',
            'Findings about WCAG and accessibility are not a legal accessibility certification or a statement that a site complies with the ADA, the European Accessibility Act or any other law. Automated checks cannot test everything WCAG asks for, and some items always need a person.',
            'Parts of the report are written with the help of AI and can be wrong. Findings we are less sure about are marked, and judgement calls are left to you.',
            'A page can change after the audit, so a report shows the page as it was when it ran.',
          ]}
        />
        <P>Check important findings yourself, or with a designer, developer or lawyer, before you rely on them.</P>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    body: (
      <UL
        items={[
          'You keep all rights to your website and its content. You give us permission to load, screenshot and analyse the pages you ask us to audit, only to run the service.',
          'Your reports are yours to use, share and publish as you like, including with clients.',
          'We own the ProCurveUX software, its rules, report design, brand and website. These terms do not give you any rights to them beyond using the service.',
          'If you send us feedback or ideas, we may use them without owing you anything.',
        ]}
      />
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <>
        <P>
          The service is provided “as is” and “as available”. We work to keep it accurate and running, but we do not promise that it will always be available, error free, or that every problem on a page will be found.
        </P>
        <P>
          As far as the law allows, we are not liable for indirect or consequential losses, such as lost profits, revenue, data or business, arising from your use of the service or the reports. Our total liability to you for any
          claim is limited to the amount you paid us in the 12 months before the claim, or {LEGAL.freeLiabilityCap} if you have only used the free service.
        </P>
        <P>Nothing in these terms limits liability that cannot be limited by law, or your rights as a consumer where those apply.</P>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Ending your use of the service',
    body: (
      <>
        <P>
          You can stop using the service at any time. To close your account or have your data deleted, use the {contactLink}; the{' '}
          <a href="/privacy" style={textLink}>
            Privacy policy
          </a>{' '}
          explains what happens to your data.
        </P>
        <P>We may suspend or end your access if you break these terms, if we must by law, or if we stop offering the service. Where we can, we will tell you first. Sections 5, 6, 7 and 9 continue to apply after your use ends.</P>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    body: (
      <P>
        These terms are governed by the laws of {LEGAL.governingLaw}, and disputes go to {LEGAL.courts}, unless the law of the country you live in gives you the right to bring a claim where you
        live.
      </P>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: <P>We may update these terms. We will change the date at the top of the page, and if a change matters we will tell you on the site or by email before it takes effect. Using the service after that means you accept the new terms.</P>,
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <P>
        Questions about these terms: <a href={`mailto:${LEGAL.email}`} style={textLink}>{LEGAL.email}</a>, or the {contactLink}.
      </P>
    ),
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav />
      <main id="main">
        <PageHero
          label="Legal"
          title="Terms of service"
          intro="The rules for using ProCurveUX: what you may audit, how paid plans work, and what an audit can and cannot promise."
          trail={[{ name: 'Terms of service', path: '/terms' }]}
        />
        <LegalLayout updated={LEGAL_UPDATED} sections={sections} />
      </main>
      <SiteFooter />
    </div>
  );
}
