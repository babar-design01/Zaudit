import type { MetadataRoute } from 'next';
import { AUTHORS, POSTS } from '@/content/blog';

const SITE = 'https://www.procurveux.com';

/**
 * `/sitemap.xml`: every public page, so search engines find new articles
 * without waiting to stumble on a link. Built from the blog's own list, so an
 * article added there is listed here too.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const newest = POSTS.map((p) => p.date).sort().at(-1);
  return [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/contact`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE}/help`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/ux-laws`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/accessibility-checklist`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/ux-audit-template`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/changelog`, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${SITE}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/report/sample`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/blog`, lastModified: newest, changeFrequency: 'weekly', priority: 0.8 },
    ...POSTS.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.date, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...Object.keys(AUTHORS).map((id) => ({ url: `${SITE}/blog/author/${id}`, changeFrequency: 'monthly' as const, priority: 0.4 })),
  ];
}
