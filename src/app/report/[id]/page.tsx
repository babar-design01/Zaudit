import type { Metadata } from 'next';
import { ReportView } from '@/components/report/ReportView';
import type { AuditResult } from '@/lib/audit/types';

export const metadata: Metadata = {
  title: 'UX audit report | Audix',
  description: 'One Audix audit: the score, what was checked, and each issue with where it is and what to change.',
  robots: { index: false, follow: false },
};

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
