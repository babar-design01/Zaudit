import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin | ProcurveUX',
  robots: { index: false, follow: false },
};

/** Sign-in is checked by each page rather than here, because a layout is not re-run on every navigation. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
