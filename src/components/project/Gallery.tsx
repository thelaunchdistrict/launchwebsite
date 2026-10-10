'use client';
import Image from 'next/image';
import { site } from '@/config/site';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebImage } from '@/lib/types';
import { Icon } from '../Icon';

export type GalleryItem = WebImage & { alt: string; caption?: string };

/** Hero mosaic + accessible lightbox (focus-trapped dialog, arrows, Esc, swipe). */
export function Gallery({ items, name }: { items: GalleryItem[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  // Mosaic adapts to the count so there are never empty cells: 1 → full, 2 → halves, 3 → 1 big + 2,
  // 4 → 1 big + 1 tall + 2, 5+ → 1 big + 4.
  const shown = items.slice(0, 5);
  const n = shown.length;
  const cell = (i: number) => {
    if (i === 0) return n === 1 ? 'col-span-4 row-span-2' : 'col-span-4 row-span-2 md:col-span-2';
    const base = 'hidden md:block';
    if (n === 2) return `${base} md:col-span-2 md:row-span-2`;
    if (n === 3) return `${base} md:col-span-2`;
    if (n === 4 && i === 1) return `${base} md:row-span-2`;
    return base;
  };
  return (
    <>
      <div className="grid h-[52vw] max-h-[560px] min-h-[260px] grid-cols-4 grid-rows-2 gap-1.5 md:gap-2">
        {shown.map((it, i) => (
          <button
            key={it.src}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden rounded-[6px] bg-sunk focus-visible:z-10 ${cell(i)}`}
            aria-label={`Open photo ${i + 1} of ${items.length}: ${it.alt}`}
          >
            <Image src={it.src} alt="" fill priority={i === 0} sizes={i === 0 ? '(min-width: 768px) 620px, 100vw' : '300px'} className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={() => setOpen(0)} className="btn btn-ghost text-sm">
          <Icon name="expand" size={16} /> All {items.length} images
        </button>
      </div>
      {open != null && <Lightbox items={items} index={open} setIndex={setOpen} name={name} />}
    </>
  );
}

export function Lightbox({ items, index, setIndex, name }: { items: GalleryItem[]; index: number; setIndex: (i: number | null) => void; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const go = useCallback((d: number) => setIndex((index + d + items.length) % items.length), [index, items.length, setIndex]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; prev?.focus(); };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab' && ref.current) {
        const els = [...ref.current.querySelectorAll<HTMLElement>('button')];
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, setIndex]);
  const it = items[index];
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} images`}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ animation: 'fade-in .18s both', background: site.colors.dark.paperSunk, color: site.colors.dark.ink }}
      onPointerDown={(e) => { startX.current = e.clientX; }}
      onPointerUp={(e) => { if (startX.current != null && Math.abs(e.clientX - startX.current) > 50) go(e.clientX < startX.current ? 1 : -1); startX.current = null; }}
    >
      <div className="flex items-center justify-between p-3">
        <p className="num text-sm" aria-live="polite">{index + 1} / {items.length}</p>
        <button type="button" data-autofocus onClick={() => setIndex(null)} className="btn btn-icon text-inherit" aria-label="Close gallery"><Icon name="close" /></button>
      </div>
      <div className="relative flex-1">
        <Image src={it.src} alt={it.alt} fill sizes="100vw" className="object-contain" />
      </div>
      <div className="flex items-center justify-between gap-3 p-3">
        <button type="button" onClick={() => go(-1)} className="btn btn-icon border border-white/20 text-inherit" aria-label="Previous image"><Icon name="arrowLeft" /></button>
        <p className="line-clamp-2 text-center text-sm opacity-80">{it.caption ?? it.alt}</p>
        <button type="button" onClick={() => go(1)} className="btn btn-icon border border-white/20 text-inherit" aria-label="Next image"><Icon name="arrowRight" /></button>
      </div>
    </div>
  );
}
