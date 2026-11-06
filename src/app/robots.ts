import type { MetadataRoute } from 'next';

/**
 * `/robots.txt`. Search engines may read every public page. People's own
 * reports, accounts and the admin are kept out; the sample report stays in,
 * since the homepage links to it as an example.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/report/sample'],
      disallow: ['/api/', '/admin', '/account', '/signin', '/report/', '/design'],
    },
    sitemap: 'https://www.procurveux.com/sitemap.xml',
    host: 'https://www.procurveux.com',
  };
}
