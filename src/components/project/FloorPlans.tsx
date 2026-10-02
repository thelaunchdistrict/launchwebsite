'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Lightbox, type GalleryItem } from './Gallery';

/** Floor plans grouped by configuration as a segmented control; click to inspect full screen. */
export function FloorPlans({ plans, name }: { plans: (GalleryItem & { group: string })[]; name: string }) {
  const groups = [...new Set(plans.map((p) => p.group))];
  const [g, setG] = useState(groups[0]);
  const [open, setOpen] = useState<number | null>(null);
  const list = plans.filter((p) => p.group === g);
  if (!plans.length) return null;
  return (
    <div>
      {groups.length > 1 && (
        <div role="tablist" aria-label="Configuration" className="mb-4 flex flex-wrap gap-2">
          {groups.map((x) => (
            <button key={x} role="tab" type="button" aria-selected={x === g} onClick={() => setG(x)} className={`chip min-h-11 px-4 text-sm ${x === g ? 'border-ink bg-ink text-paper' : 'bg-raised hover:border-ink'}`}>
              {x}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <figure key={p.src} className="card overflow-hidden">
            <button type="button" onClick={() => setOpen(i)} className="relative block aspect-[4/3] w-full bg-white" aria-label={`Enlarge ${p.alt}`}>
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 380px, 50vw" className="object-contain p-2" />
            </button>
            {p.caption && <figcaption className="border-t hairline px-3 py-2 text-sm">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {open != null && <Lightbox items={list} index={open} setIndex={setOpen} name={`${name} floor plans`} />}
    </div>
  );
}
