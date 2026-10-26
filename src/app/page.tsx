import { auth } from '@/auth';
import { Homepage } from '@/components/Homepage';
import { faqJsonLd } from '@/content/faqs';
import { balance } from '@/lib/credits';
import { accountsEnabled } from '@/lib/db';

/** FAQPage structured data, from the same list the accordion renders. */
function FaqSchema() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />;
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
