import type { MetadataRoute } from 'next';
import { POSTS } from '@/content/blog';

const SITE = 'https://www.procurveux.com';

/** `/sitemap.xml` — the public pages search engines should index. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...POSTS.map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: new Date(`${p.updated ?? p.published}T00:00:00Z`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
