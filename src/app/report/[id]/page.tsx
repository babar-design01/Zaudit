import type { Metadata } from 'next';
import { ReportView } from '@/components/report/ReportView';

export const metadata: Metadata = {
  title: 'UX audit report | Zaudit',
  description: 'The full findings from one Zaudit run: pillars, criteria, evidence and the fixes worth doing first.',
  robots: { index: false, follow: false },
};

/**
 * `/report/<id>` — one audit's findings, on a page that can be printed, exported
 * and sent. The id is the one the run was given; the view loads the report from
 * the browser's own copy or from the server, whichever answers.
 */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <ReportView id={id} />
    </div>
  );
}
