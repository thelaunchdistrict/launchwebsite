import type { Metadata } from 'next';
import { site } from '@/config/site';

/** Branded share card used wherever a page has no image of its own (public/og/default.jpg, 1200×630). */
export const OG_DEFAULT = { url: '/og/default.jpg', width: 1200, height: 630, alt: `${site.name}: private early-entry real estate in Gurugram` };

type OgImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * Complete metadata for a page: title, description, canonical, Open Graph and Twitter card.
 * Next.js replaces (does not merge) a parent's `openGraph` when a page sets its own, so every page builds the
 * full set here instead of relying on the root layout. Relative URLs resolve against `metadataBase`.
 */
export function pageMeta({
  title, description, path, image, type = 'website', noindex = false, publishedTime,
}: {
  title: string;
  description: string;
  /** Canonical path, e.g. '/projects/foo'. Also used as og:url. */
  path: string;
  image?: OgImage | null;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string;
}): Metadata {
  const img = image ? { ...image, alt: image.alt ?? title } : OG_DEFAULT;
  const shareTitle = path === '/' ? title : `${title} · ${site.name}`;
  return {
    title: path === '/' ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: site.name,
      locale: site.locale,
      url: path,
      title: shareTitle,
      description,
      images: [img],
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [{ url: img.url, alt: img.alt }] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
