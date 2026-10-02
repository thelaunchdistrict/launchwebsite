import { VIEW, placeLabels, roadLayers, sectorLabels } from '@/lib/geo';

/** Server-rendered base layer: survey grid, sector numbers, real corridor roads (OSM), places. */
export function MapBase({ highlight }: { highlight?: string }) {
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
      <g aria-hidden fontFamily="var(--font-mono)" fontSize="8" className="fill-ink-2" opacity="0.55" textAnchor="middle">
        {sectorLabels().map((s) => <text key={s.n} x={s.xy[0]} y={s.xy[1] + 3}>{s.n}</text>)}
      </g>
      {nh48 && (
        <g aria-hidden>
          <path d={nh48.d} fill="none" stroke="var(--rule-strong)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
          {nh48.anchor && <text x={nh48.anchor[0] + 10} y={nh48.anchor[1]} fontSize="11" fontFamily="var(--font-mono)" className="fill-ink-2" style={{ paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: 3 }}>NH-48</text>}
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
        <text key={r.corridor} aria-hidden x={r.anchor[0] + 8} y={r.anchor[1] - 8} fontSize="14" fontFamily="var(--font-serif)" fontStyle="italic" className="fill-ink" opacity={highlight && highlight !== r.corridor ? 0.45 : 1} style={{ paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: 4, strokeLinejoin: 'round' }}>
          {r.label}
        </text>
      ))}
      {placeLabels().map((p) => (
        <g key={p.name} aria-hidden>
          {!p.edge && <circle cx={p.x} cy={p.y} r="2.5" className="fill-ink-2" />}
          <text x={p.x + (p.edge ? 0 : p.flip ? -6 : 6)} y={p.y + 4} textAnchor={p.flip ? 'end' : 'start'} fontSize="11" fontFamily="var(--font-mono)" className="fill-ink-2" style={{ paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: 3 }}>{p.name}</text>
        </g>
      ))}
    </g>
  );
}
