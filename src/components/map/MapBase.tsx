import { VIEW, placeLabels, roadLayers, sectorLabels } from '@/lib/geo';

/** File name of the pre-rendered base for a theme and highlighted corridor (see scripts/build/map-base.mjs). */
export const mapBaseSrc = (theme: 'light' | 'dark', highlight?: string) => `/media/map/base-${theme}-${highlight || 'all'}.webp`;

/**
 * Live base layer: the survey grid, sector numbers, OSM corridor roads and place names as a pre-rendered WebP
 * (light and dark; CSS shows the one that matches the theme). Project markers are drawn over it as an
 * interactive SVG layer in CorridorMapView.
 */
export function MapBase({ highlight }: { highlight?: string }) {
  return (
    <g aria-hidden>
      {(['light', 'dark'] as const).map((t) => (
        <image key={t} href={mapBaseSrc(t, highlight)} width={VIEW.w} height={VIEW.h} preserveAspectRatio="xMidYMid meet" className={`map-base map-base-${t}`} />
      ))}
    </g>
  );
}

/** Full vector drawing of the base layer. Used only to produce the WebP files above. */
export function MapBaseVector({ highlight }: { highlight?: string }) {
  const roads = roadLayers();
  const nh48 = roads.find((r) => r.corridor === 'nh48');
  const corridors = roads.filter((r) => r.corridor !== 'nh48');
  return (
    <g>
      <defs>
        <pattern id="survey-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="var(--rule)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={VIEW.w} height={VIEW.h} fill="url(#survey-grid)" opacity="0.7" />
      {/* sector numbers, for orientation */}
      <g aria-hidden fontFamily="var(--font-sans)" fontSize="10" fontWeight="500" className="fill-ink-2" opacity="0.8" textAnchor="middle">
        {sectorLabels().map((s) => <text key={s.n} x={s.xy[0]} y={s.xy[1] + 3.5}>{s.n}</text>)}
      </g>
      {nh48 && (
        <g aria-hidden>
          <path d={nh48.d} fill="none" stroke="var(--rule-strong)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
          {nh48.anchor && <text x={nh48.anchor[0] + 10} y={nh48.anchor[1]} fontSize="13" fontWeight="500" fontFamily="var(--font-sans)" className="fill-ink-2" style={{ paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: 3.5 }}>NH-48</text>}
        </g>
      )}
      {corridors.map((r) => {
        const on = highlight === r.corridor;
        const dim = highlight && !on;
        return (
          <g key={r.corridor} aria-hidden opacity={dim ? 0.35 : 1}>
            <path d={r.d} fill="none" stroke="var(--ink)" strokeWidth={on ? 4 : 2.2} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
      {/* labels last so lines never cover them */}
      {corridors.map((r) => r.anchor && (
        <text key={r.corridor} aria-hidden x={r.anchor[0] + 8} y={r.anchor[1] - 8} fontSize="16" fontWeight="600" fontFamily="var(--font-serif)" fontStyle="italic" className="fill-ink" opacity={highlight && highlight !== r.corridor ? 0.55 : 1} style={{ fontVariationSettings: '"opsz" 11', paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: 5, strokeLinejoin: 'round' }}>
          {r.label}
        </text>
      ))}
      {placeLabels().map((p) => (
        <g key={p.name} aria-hidden>
          {!p.edge && <circle cx={p.x} cy={p.y} r="2.5" className="fill-ink-2" />}
          <text x={p.x + (p.edge ? 0 : p.flip ? -6 : 6)} y={p.y + 4} textAnchor={p.flip ? 'end' : 'start'} fontSize="13" fontWeight="500" fontFamily="var(--font-sans)" className="fill-ink-2" style={{ paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: 3.5 }}>{p.name}</text>
        </g>
      ))}
    </g>
  );
}
