import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VIEW } from '@/lib/geo';
import { MapBaseVector } from '@/components/map/MapBase';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Export-only page: draws the vector base layer on a transparent background so scripts/build/map-base.mjs
 * can capture it as a WebP. Returns 404 unless the server was started with MAP_BASE_EXPORT=1, so it is
 * never reachable on the live site.
 */
export default async function MapBaseExport({ params }: PageProps<'/map-base/[theme]/[variant]'>) {
  if (process.env.MAP_BASE_EXPORT !== '1') notFound();
  const { variant } = await params;
  return (
    <>
      <style>{'html,body{background:transparent !important}header,footer,nav,aside,.band-night,main~*{display:none !important}'}</style>
      <svg id="map-base-export" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} width={VIEW.w} height={VIEW.h} style={{ display: 'block' }}>
        <MapBaseVector highlight={variant === 'all' ? undefined : variant} />
      </svg>
    </>
  );
}
