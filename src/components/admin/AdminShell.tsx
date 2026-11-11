import Link from 'next/link';
import type { ReactNode } from 'react';
import { leave } from '@/app/admin/actions';
import { Logo } from '@/components/site/Logo';

const NAV = [
  { href: '/admin', id: 'overview', label: 'Overview', icon: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z' },
  { href: '/admin/audits', id: 'audits', label: 'Audits', icon: 'M5 4h14v16H5V4Zm3 5h8M8 12h8M8 15h5' },
  { href: '/admin/visitors', id: 'visitors', label: 'Visitors', icon: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5c1.8.8 3 2.6 3 5.5' },
  { href: '/admin/plugin', id: 'plugin', label: 'Figma plugin', icon: 'M9 3h3v6H9a3 3 0 1 1 0-6Zm3 0h3a3 3 0 1 1 0 6h-3V3Zm0 6h3a3 3 0 1 1-3 3V9Zm-3 0h3v6H9a3 3 0 1 1 0-6Zm0 6h3v3a3 3 0 1 1-3-3Z' },
] as const;

/** The frame every admin page sits in: the side menu, then the page's title and content. */
export function AdminShell({
  active,
  title,
  actions,
  children,
}: {
  active: (typeof NAV)[number]['id'];
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="admin-app">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand" aria-label="ProcurveUX admin">
          <Logo height={14} />
          <span>Admin</span>
        </Link>
        <nav aria-label="Admin" className="admin-nav">
          {NAV.map((item) => (
            <Link key={item.id} href={item.href} aria-current={item.id === active ? 'page' : undefined}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={leave} className="admin-signout">
          <button type="submit">Sign out</button>
        </form>
      </aside>
      <main className="admin-main">
        <div className="admin-head">
          <h1>{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
