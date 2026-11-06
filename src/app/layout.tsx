import type { Metadata } from 'next';
import './globals.css';
import './motion.css';

const TITLE = "Free Website UX Audit Tool – Find Why Visitors Don't Convert | ProCurveUX";
const DESCRIPTION =
  'Paste a URL for a free UX audit. ProCurveUX tests your site in a real browser against 120+ UX, design and accessibility rules and ranks what to fix first.';

export const metadata: Metadata = {
  // Share previews need the image's full address, and only this domain is the
  // one people are meant to see.
  metadataBase: new URL('https://www.procurveux.com'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'ProCurveUX',
    url: '/',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
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
