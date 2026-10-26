import type { Metadata } from 'next';
import './globals.css';

const DESCRIPTION =
  'Paste a URL. Audix tests your site in a real browser and scores it against UX laws, design principles and accessibility rules, then tells you which element to fix first and why it matters.';

export const metadata: Metadata = {
  title: 'Audix – Free Website UX Audit Tool',
  description: DESCRIPTION,
  openGraph: {
    title: 'Audix – Free Website UX Audit Tool',
    description: DESCRIPTION,
    siteName: 'Audix',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Audix – Free Website UX Audit Tool', description: DESCRIPTION },
  icons: { icon: '/audix-logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* One family. The brand book allows no second typeface. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@300..900&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
