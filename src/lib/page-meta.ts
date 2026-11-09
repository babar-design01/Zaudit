import type { Metadata } from 'next';

export const SITE = 'https://www.procurveux.com';

/**
 * Metadata for a page other than the homepage: its own title and description,
 * a canonical address, and Open Graph and Twitter cards that say the same.
 *
 * The root layout sets a Twitter card for the homepage, and a page that sets
 * only `openGraph` inherits that card's title, so every page shared on X looked
 * like the homepage. Setting both here keeps them in step.
 */
export function pageMetadata({ title, description, path, type = 'website' }: { title: string; description: string; path: string; type?: 'website' | 'article' | 'profile' }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type, siteName: 'ProCurveUX' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** BreadcrumbList structured data: Home, then each step to this page. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.path === '/' ? '' : c.path}`,
    })),
  };
}
