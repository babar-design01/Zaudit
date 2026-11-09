import { Contact } from '@/components/report/Contact';
import { Breadcrumbs, frame } from '@/components/site/PageKit';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { pageMetadata } from '@/lib/page-meta';
import { planFromParam } from '@/lib/plan-request';

export const metadata = pageMetadata({
  title: 'Contact ProCurveUX | Plans, reports and questions',
  description: 'Start a Starter, Pro or Agency plan, ask about a report, or get the fixes designed and built. A person replies within one working day.',
  path: '/contact',
});

/**
 * `/contact`: the contact form as a page of its own. A pricing card's button
 * opens it as `/contact?plan=pro`; an unknown or missing plan just shows the
 * form with nothing chosen.
 */
export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const plan = planFromParam((await searchParams).plan);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav current="contact" />
      <main id="main">
        <div style={{ ...frame, paddingTop: '24px', paddingBottom: '24px' }}>
          <Breadcrumbs trail={[{ name: 'Contact', path: '/contact' }]} />
        </div>
        {/* Keyed by plan so moving between ?plan= values starts the form afresh. */}
        <Contact key={plan ?? 'none'} plan={plan} page />
      </main>
      <SiteFooter />
    </div>
  );
}
