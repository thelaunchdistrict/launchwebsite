import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { allProjects, datasetMeta, MARKETS, marketStats } from '@/lib/data';
import { ARTICLES } from '@/content/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date(datasetMeta.generatedAt);
  const u = (p: string) => `${site.url}${p}`;
  return [
    { url: u('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: u('/projects'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...allProjects().map((p) => ({ url: u(`/projects/${p.slug}`), lastModified: new Date(p.scrapedAt), changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: u('/markets'), lastModified: now, priority: 0.7 },
    ...MARKETS.filter((m) => marketStats(m.slug).count).map((m) => ({ url: u(`/markets/${m.slug}`), lastModified: now, priority: 0.7 })),
    ...['/tools', '/tools/roi-calculator', '/tools/price-per-sqft', '/tools/possession-timeline'].map((p) => ({ url: u(p), lastModified: now, priority: 0.6 })),
    { url: u('/insights'), lastModified: now, priority: 0.5 },
    ...ARTICLES.map((a) => ({ url: u(`/insights/${a.slug}`), lastModified: new Date(a.date), priority: 0.5 })),
    ...['/about', '/contact', '/disclaimer', '/privacy', '/terms'].map((p) => ({ url: u(p), priority: 0.3 })),
  ];
}
