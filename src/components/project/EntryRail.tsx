import { site } from '@/config/site';
import { RAIL_STATIONS } from '@/lib/stage';
import type { Stage } from '@/lib/types';

const BASIS_NOTE: Record<Stage['basis'], string> = {
  status: 'from the listed project status',
  'listing-text': 'as stated in the listing text',
  derived: `estimated by ${site.name} from the stated possession date`,
  unknown: 'stage not published',
};

/**
 * The Launch District's signature: a four-station lifecycle rail. The vermilion fill runs from the start to the
 * project's current position — the less vermilion, the earlier you are.
 */
export function EntryRail({ stage, size = 'sm', className = '' }: { stage: Stage; size?: 'sm' | 'lg'; className?: string }) {
  const pct = Math.min(100, Math.max(0, (stage.position / 3) * 100));
  const lg = size === 'lg';
  const label = `Entry stage: ${stage.label}, ${BASIS_NOTE[stage.basis]}.`;
  return (
    <div className={className} role="img" aria-label={label} title={label}>
      <div className={`relative ${lg ? 'h-1.5' : 'h-1'} rounded-full bg-rule`}>
        <div className="rail-fill absolute inset-y-0 left-0 rounded-full bg-signal" style={{ width: `${pct}%` }} />
        {RAIL_STATIONS.map((s, i) => (
          <span
            key={s}
            aria-hidden
            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${lg ? 'h-3 w-3' : 'h-2 w-2'} ${(i / 3) * 100 <= pct ? 'border-signal bg-signal' : 'border-rule-strong bg-paper'}`}
            style={{ left: `${(i / 3) * 100}%` }}
          />
        ))}
        <span
          aria-hidden
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-2 ring-paper ${lg ? 'h-4 w-4' : 'h-3 w-3'}`}
          style={{ left: `${pct}%` }}
        />
      </div>
      <div aria-hidden className={`mt-2 grid grid-cols-4 ${lg ? 'text-xs' : 'text-xs'} text-ink-2`}>
        {RAIL_STATIONS.map((s, i) => (
          <span key={s} className={i === 0 ? 'text-left' : i === 3 ? 'text-right' : 'text-center'}>{s}</span>
        ))}
      </div>
    </div>
  );
}
