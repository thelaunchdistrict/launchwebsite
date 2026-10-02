import type { ProjectSummary } from '@/lib/types';
import { ATTRIBUTION, stationsFor } from '@/lib/geo';
import { MapBase } from './MapBase';
import { CorridorMapView } from './CorridorMapView';

/**
 * Corridor map of Gurugram drawn from real geography: OpenStreetMap road geometry and sector
 * centres, projects at their verified coordinates (see scripts/geo/build-geo.mjs).
 * Server component; for client callers use `mapProps()` and render CorridorMapView directly.
 */
export function CorridorMap({ projects, highlight, compact = false, title = 'Map of tracked projects' }: { projects: ProjectSummary[]; highlight?: string; compact?: boolean; title?: string }) {
  return <CorridorMapView {...mapProps(projects, highlight)} projects={projects} highlight={highlight} compact={compact} title={title} />;
}

export function mapProps(projects: ProjectSummary[], highlight?: string) {
  return { stations: stationsFor(projects).stations, base: <MapBase highlight={highlight} />, attribution: ATTRIBUTION };
}
