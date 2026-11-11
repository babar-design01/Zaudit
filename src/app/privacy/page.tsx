import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { LegalLayout, PageHero, prose, textLink } from '@/components/site/PageKit';
import { LEGAL, LEGAL_UPDATED } from '@/content/legal';
import { pageMetadata } from '@/lib/page-meta';

/*
 * `/privacy`. A starting draft written from what the code actually does, NOT
 * legal advice: have a lawyer check it before relying on it, especially for EU
 * or UK customers (GDPR).
 *
 * What is stated as fact was checked in the committed code on 9 Nov 2026:
 * - the audit takes a URL, the goals picked and an email (api/audit/route.ts),
 *   and the browser remembers that email in local storage (hooks/useAudit.ts);
 * - each run is logged with the email, approximate city and country, browser
 *   and OS, a keyed hash of the IP address and the source (lib/usage.ts);
 * - reports, screenshots included, are kept in Vercel Blob (lib/report/store.ts)
 *   and open to anyone with the link (app/report/[id]/page.tsx);
 * - pages are rendered with headless Chromium on our own hosting
 *   (lib/audit/browser.ts), and findings are reviewed by Anthropic's Claude
 *   (lib/audit/review.ts);
 * - mail goes through Resend (api/contact/route.ts, auth.ts), the contact form's
 *   bot check is Cloudflare Turnstile (lib/captcha.ts), and accounts, when
 *   switched on, are kept in a Neon Postgres database (lib/db/index.ts).
 * Business facts (name, address, email, payment, retention, response time,
 * region) are Babar's answers of 9 Nov 2026, kept in content/legal.ts.
 */

export const metadata = pageMetadata({
  title: 'Privacy policy | ProCurveUX',
  description: 'What ProCurveUX collects when you run a UX audit or contact us, why, who it is shared with, how long it is kept and how to have it deleted.',
  path: '/privacy',
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
const contactEmail = (
  <a href={`mailto:${LEGAL.email}`} style={textLink}>
    {LEGAL.email}
  </a>
);

const sections = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <P>
          ProCurveUX is an automated UX audit for websites, at procurveux.com. It is run by {LEGAL.name}, which is the controller of the personal data described here.
        </P>
        <UL
          items={[
            <>
              Address: {LEGAL.address}
            </>,
            <>Email: {contactEmail}</>,
            <>
              Or use the{' '}
              <a href="/contact" style={textLink}>
                contact form
              </a>
              .
            </>,
          ]}
        />
        <P>
          This policy covers the website, the audits it runs and the ProCurveUX Chrome extension. Using the service is also covered by our{' '}
          <a href="/terms" style={textLink}>
            Terms of service
          </a>
          .
        </P>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    body: (
      <>
        <H3>When you run an audit</H3>
        <UL
          items={[
            'Your email address, which an audit asks for.',
            'The address of the website you audit and the goals you pick for it.',
            'The report we produce: screenshots of the page at desktop and mobile sizes, and the findings.',
            'A record of the run: when it ran, how it ended, your approximate city and country (worked out from your IP address), your browser and operating system, whether it came from the website or the Chrome extension, and a scrambled code made from your IP address. We store that code, not the IP address itself.',
          ]}
        />
        <P>Your browser also remembers the email you typed, in its own local storage, so you do not have to type it again. You can clear it by clearing this site’s data in your browser.</P>
        <H3>When you contact us or request a plan</H3>
        <UL
          items={[
            'Your name, email address and message, and the website address if you give one.',
            'The plan you ask about (Starter, Pro, Agency or Not sure yet), if you choose one.',
            'If you send a message from a report, a link to that report, its score and how many issues it found.',
            <>
              For paid plans, the details needed to invoice you: your name, billing email and, if you want them on the invoice, your company name and address. Payment is made through {LEGAL.payment}; we receive confirmation of the payment, never your card or bank login details.
            </>,
          ]}
        />
        <H3>If you create an account</H3>
        <P>Your email address, which you sign in with by a link we email to you, and your audit history and plan.</P>
        <H3>Cookies and analytics</H3>
        <P>
          The site uses the cookies it needs to work, such as the one that keeps you signed in, and Cloudflare Turnstile may set its own when it checks the contact form for robots. We do not use analytics, tracking or advertising cookies.
        </P>
        <H3>If you use the ProCurveUX Figma plugin</H3>
        <P>
          The plugin checks your designs inside Figma; your designs, layer and file names and any text in them never leave Figma. Unless you turn off
          “Share anonymous usage” in the plugin’s Settings, it sends us counts: a random install id the plugin creates for itself, the plugin version,
          your approximate country, when it was opened, and for each audit the score, the number of frames, layers and findings, and which checks
          failed. We use these to see how the plugin is used and to improve it.
        </P>
        <H3>The sites you audit</H3>
        <P>
          An audit views a public page the way a normal visitor would. It does not log in, submit forms or get past access controls. If a page shows personal information to every visitor, that can appear in the screenshots we
          take of it.
        </P>
      </>
    ),
  },
  {
    id: 'why',
    title: 'Why we use it',
    body: (
      <UL
        items={[
          'To run the audits you ask for and show you the report.',
          'To reply to your messages and set up the plan you request.',
          'To invoice paid plans and keep the records the law requires.',
          'To keep the service working and fair: limiting how many free audits one person or network can run, and stopping abuse.',
          'To improve ProCurveUX, by looking at which audits fail or run slowly and why.',
          'To contact you about your results. We only send marketing emails if you have agreed to them, and every one lets you stop them.',
        ]}
      />
    ),
  },
  {
    id: 'legal-basis',
    title: 'Legal basis (EU and UK visitors)',
    body: (
      <>
        <P>If you are in the European Economic Area or the United Kingdom, we rely on these legal bases under the GDPR and UK GDPR:</P>
        <UL
          items={[
            <>
              <strong>Contract:</strong> to run the audits you ask for, reply to plan requests and provide a paid plan.
            </>,
            <>
              <strong>Legitimate interests:</strong> to prevent abuse, keep the service secure, understand how it is used and improve it. We weigh these against your rights, and you can object.
            </>,
            <>
              <strong>Consent:</strong> for marketing emails. You can withdraw it at any time.
            </>,
            <>
              <strong>Legal obligation:</strong> to keep invoices and tax records.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    body: (
      <>
        <P>We do not sell your personal data. We share it only with the companies that help us run the service, and only what each needs:</P>
        <UL
          items={[
            <>
              <strong>Vercel</strong>: hosts the website and runs the audits, and stores reports and screenshots (Vercel Blob).
            </>,
            <>
              <strong>Anthropic</strong>: its Claude AI model reviews the page and the findings to write parts of the report. It receives the page content and screenshots, not your email address. Under Anthropic’s commercial terms, data sent through its API is not used to train its models.
            </>,
            <>
              <strong>Resend</strong>: sends our emails, such as sign-in links and replies to the contact form.
            </>,
            <>
              <strong>Cloudflare</strong>: Turnstile checks the contact form for robots.
            </>,
            <>
              <strong>Neon</strong>: stores account records, when accounts are switched on.
            </>,
            <>
              <strong>{LEGAL.payment}</strong>: sends invoices for paid plans and processes the payments.
            </>,
          ]}
        />
        <P>
          Anyone with the link to a report can open it, so share report links with care. Reports are not listed in search engines. We may also disclose information when the law requires it, or to protect our rights or someone’s
          safety.
        </P>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <UL
        items={[
          <>
            Reports and screenshots: {LEGAL.retention.reports}, then deleted. You can ask us to delete one sooner.
          </>,
          <>
            Audit run records (email, approximate location, browser): {LEGAL.retention.runLog}.
          </>,
          <>
            Contact messages and plan requests: {LEGAL.retention.messages}.
          </>,
          <>
            Account records: for as long as your plan or account is active, then {LEGAL.retention.accountAfter}.
          </>,
          <>
            Invoices and billing records: {LEGAL.retention.invoices}, as tax law requires.
          </>,
        ]}
      />
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <>
        <P>Wherever you are, you can ask us to:</P>
        <UL
          items={[
            'Give you a copy of the personal data we hold about you.',
            'Correct anything that is wrong.',
            'Delete your data, including your reports.',
            'Send your data to you in a format you can take elsewhere.',
            'Stop using your data for a purpose you object to, or withdraw your consent.',
          ]}
        />
        <P>
          To ask, email {contactEmail} or use the{' '}
          <a href="/contact" style={textLink}>
            contact form
          </a>
          , from the email address the request is about. We will reply within {LEGAL.responseTime}. When you ask us to delete a report, we delete it with its screenshots.
        </P>
        <P>If you are in the EEA or the UK and are unhappy with how we handled your data, you can complain to your local data protection authority.</P>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <P>
        The site is served only over HTTPS. Data is stored with the providers above, who protect it with access controls and encryption. Only the people who run ProCurveUX can see audit records and messages. No system is perfectly
        secure, and if a breach affects your data we will tell you as the law requires.
      </P>
    ),
  },
  {
    id: 'transfers',
    title: 'International transfers',
    body: (
      <P>
        ProCurveUX is run from Pakistan, and our providers process data in other countries, including the United States. When data from the EEA or the UK is transferred, we rely on the safeguards our providers offer, such as the
        European Commission’s standard contractual clauses. The website, the audits and stored reports run on Vercel in {LEGAL.region}.
      </P>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <P>ProCurveUX is not meant for anyone under 16, and we do not knowingly collect their data. If you believe a child has given us personal data, contact us and we will delete it.</P>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: <P>When we change this policy we will update the date at the top of the page. If a change matters, we will also say so on the site or by email before it takes effect.</P>,
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <P>
        Questions about this policy or your data: {contactEmail}, or the{' '}
        <a href="/contact" style={textLink}>
          contact form
        </a>
        .
      </P>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav />
      <main id="main">
        <PageHero
          label="Legal"
          title="Privacy policy"
          intro="What we collect when you run an audit or contact us, why, who it goes to, and how to have it deleted."
          trail={[{ name: 'Privacy policy', path: '/privacy' }]}
        />
        <LegalLayout updated={LEGAL_UPDATED} sections={sections} />
      </main>
      <SiteFooter />
    </div>
  );
}
