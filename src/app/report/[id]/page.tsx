import type { Metadata } from 'next';
import { ReportView } from '@/components/report/ReportView';
import type { AuditResult } from '@/lib/audit/types';

const SAMPLE_TITLE = 'Sample UX audit report | ProCurveUX';
const SAMPLE_DESCRIPTION = 'A real ProCurveUX audit, start to finish: the score, what was checked, and each issue with where it is and what to change.';

/**
 * The sample is a public page, listed in the sitemap and allowed by robots.txt,
 * so it is indexable and has its own share cards. Everyone's own reports stay
 * out of search: they open to anyone with the link, but are not listed.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  if ((await params).id === 'sample') {
    return {
      title: SAMPLE_TITLE,
      description: SAMPLE_DESCRIPTION,
      alternates: { canonical: '/report/sample' },
      openGraph: { title: SAMPLE_TITLE, description: SAMPLE_DESCRIPTION, url: '/report/sample', type: 'website', siteName: 'ProCurveUX' },
      twitter: { card: 'summary_large_image', title: SAMPLE_TITLE, description: SAMPLE_DESCRIPTION },
    };
  }
  return {
    title: 'UX audit report | ProCurveUX',
    description: 'One ProCurveUX audit: the score, what was checked, and each issue with where it is and what to change.',
    robots: { index: false, follow: false },
  };
}

/**
 * `/report/<id>` — one audit's report. `/report/sample` is a real run of
 * example.com, kept in the repo so "Sample report" always has something to
 * show; regenerate it with the engine when the catalog changes.
 */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initial = id === 'sample' ? ((await import('@/content/sample-report.json')).default as unknown as AuditResult) : null;
  return <ReportView id={id} initial={initial} />;
}
