import type { Metadata } from 'next';
import { auth } from '@/auth';
import { Homepage } from '@/components/Homepage';
import { faqJsonLd } from '@/content/faqs';
import { balance } from '@/lib/credits';
import { accountsEnabled } from '@/lib/db';
import { PLANS } from '@/lib/plans';

/** The one address search engines should credit, whatever query string a visit arrived with. */
export const metadata: Metadata = { alternates: { canonical: '/' } };

const SITE = 'https://www.procurveux.com';

/**
 * Who makes the site and what the product is, for search engines: the
 * organisation, the site, and the tool with its free audit and paid plans.
 * Only facts the page itself states; no ratings, since there are none to cite.
 */
const PRODUCT_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'ProCurveUX', url: `${SITE}/`, logo: `${SITE}/icon.svg` },
    { '@type': 'WebSite', '@id': `${SITE}/#site`, name: 'ProCurveUX', url: `${SITE}/`, publisher: { '@id': `${SITE}/#org` } },
    {
      '@type': 'SoftwareApplication',
      name: 'ProCurveUX',
      url: `${SITE}/`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'A website UX audit tool. Paste a URL and ProCurveUX tests the live page in a real browser against 120+ UX, design and accessibility rules, then ranks what to fix first.',
      publisher: { '@id': `${SITE}/#org` },
      offers: [
        { '@type': 'Offer', name: 'Free UX audit', price: '0', priceCurrency: 'USD' },
        ...PLANS.map((p) => ({ '@type': 'Offer', name: p.name, price: (p.amount / 100).toFixed(2), priceCurrency: p.currency.toUpperCase() })),
      ],
    },
  ],
};

/** FAQPage structured data, from the same list the accordion renders, and the product's. */
function FaqSchema() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }} />
    </>
  );
}

/**
 * With no database this reads nothing and the page stays static. With one, it
 * costs a session lookup and a sum over the ledger so the nav can say what is
 * left before anything is clicked.
 */
export default async function Page() {
  const accounts = accountsEnabled();
  if (!accounts) {
    return (
      <>
        <FaqSchema />
        <Homepage />
      </>
    );
  }

  const session = await auth();
  const id = session?.user?.id;
  return (
    <>
      <FaqSchema />
      <Homepage
        accounts
        account={id ? { email: session?.user?.email ?? null, credits: await balance(id) } : null}
      />
    </>
  );
}
