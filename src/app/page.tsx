import { auth } from '@/auth';
import { Homepage } from '@/components/Homepage';
import { balance } from '@/lib/credits';
import { accountsEnabled } from '@/lib/db';

/**
 * With no database this reads nothing and the page stays static, exactly as it
 * was before accounts existed. With one, it costs a session lookup and a sum
 * over the ledger so the nav can say what is left before anything is clicked.
 */
export default async function Page() {
  const accounts = accountsEnabled();
  if (!accounts) return <Homepage />;

  const session = await auth();
  const id = session?.user?.id;
  return (
    <Homepage
      accounts
      account={id ? { email: session?.user?.email ?? null, credits: await balance(id) } : null}
    />
  );
}
