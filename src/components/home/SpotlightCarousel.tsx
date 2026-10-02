'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectSummary } from '@/lib/types';
import { inr, inrFull, monthYear, psf } from '@/lib/format';
import { EntryRail } from '../project/EntryRail';
import { Badges } from '../project/Badges';
import { configSummary } from '../project/ProjectCard';
import { Icon } from '../Icon';

const INTERVAL = 6000;

/**
 * Spotlight carousel. Native scroll-snap handles touch swipes; mouse users can drag or use the
 * arrows. Autoplay pauses on hover, focus, touch or drag, stops while the tab is hidden, can be
 * paused explicitly (WCAG 2.2.2), and is off entirely when the user prefers reduced motion.
 */
export function SpotlightCarousel({ projects }: { projects: ProjectSummary[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true); // user's explicit choice
  const [hold, setHold] = useState(false); // temporary pause: hover / focus / interaction
  const [reduced, setReduced] = useState(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const n = projects.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const goTo = useCallback((i: number, smooth = true) => {
    const el = track.current;
    if (!el) return;
    const k = (i + n) % n;
    const slide = el.children[k] as HTMLElement | undefined;
    const first = el.children[0] as HTMLElement | undefined;
    if (slide && first) el.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: smooth && !reduced ? 'smooth' : 'auto' });
  }, [n, reduced]);

  // Track which slide is in view (covers swipes, drags, arrows and autoplay alike).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting && e.intersectionRatio >= 0.6) setIndex(Number((e.target as HTMLElement).dataset.index));
    }, { root: el, threshold: [0.6] });
    [...el.children].forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [n]);

  // Autoplay
  const autoplay = playing && !hold && !reduced;
  useEffect(() => {
    if (!autoplay) return;
    const t = window.setInterval(() => { if (!document.hidden) goTo(index + 1); }, INTERVAL);
    return () => window.clearInterval(t);
  }, [autoplay, index, goTo]);

  // Mouse drag (touch uses native scrolling)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
    track.current.style.scrollSnapType = 'none';
    setHold(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !track.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5) d.moved = true;
    track.current.scrollLeft = d.left - dx;
  };
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !track.current) return;
    track.current.style.scrollSnapType = '';
    const dx = e.clientX - d.x;
    if (d.moved) goTo(index + (dx < -40 ? 1 : dx > 40 ? -1 : 0));
    window.setTimeout(() => { drag.current = null; }, 0);
  };

  if (!n) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Spotlight projects"
      className="relative"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => { setHold(false); drag.current = null; }}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHold(false); }}
      onTouchStart={() => setHold(true)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
      }}
    >
      <div
        ref={track}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:cursor-grab md:active:cursor-grabbing"
        aria-live={autoplay ? 'off' : 'polite'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {projects.map((p, i) => (
          <div key={p.slug} data-index={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${p.name}`} className="w-[88%] shrink-0 snap-start sm:w-[80%] lg:w-[86%]">
            <Link
              href={`/projects/${p.slug}`}
              prefetch={false}
              draggable={false}
              onClick={(e) => { if (drag.current?.moved) e.preventDefault(); }}
              className="card group grid h-full overflow-hidden transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,.3)] md:grid-cols-[1.35fr_1fr]"
            >
              <div className="relative aspect-[16/10] bg-sunk md:aspect-auto md:min-h-[360px]">
                {p.image && (
                  <Image src={p.image.src} alt={`${p.name} — project exterior`} fill draggable={false} sizes="(min-width: 1024px) 620px, 88vw" priority={i === 0} className="select-none object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                )}
                <Badges badges={p.badges} status={p.status} className="absolute left-3 top-3" />
                <span className="num absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
              </div>
              <div className="flex flex-col gap-5 p-5 md:p-7">
                <div>
                  <p className="text-sm text-ink-2">{p.developer ?? 'Developer not published'} · {p.sector ? `Sector ${p.sector}` : p.marketName}{p.sector && p.marketName ? ` · ${p.marketName}` : ''}</p>
                  <h3 className="mt-1 font-display text-[clamp(1.75rem,3.2vw,2.6rem)] leading-[1.02]">{p.name}</h3>
                </div>
                <EntryRail stage={p.stage} />
                <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-t hairline pt-4">
                  <div><dt className="eyebrow">From</dt><dd className="num mt-1 text-xl" title={inrFull(p.priceFrom)}>{inr(p.priceFrom)}</dd></div>
                  <div><dt className="eyebrow">₹ / sq ft{p.psfDerived && p.psf ? '*' : ''}</dt><dd className="num mt-1 text-xl">{psf(p.psf)}</dd></div>
                  <div><dt className="eyebrow">Possession</dt><dd className="num mt-1">{monthYear(p.possession)}</dd></div>
                  <div><dt className="eyebrow">Configs</dt><dd className="mt-1">{configSummary(p)}</dd></div>
                </dl>
                <span className="mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                  View project <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className="btn btn-ghost btn-icon hidden sm:inline-flex" onClick={() => goTo(index - 1)} aria-label="Previous project"><Icon name="arrowLeft" /></button>
        <button type="button" className="btn btn-ghost btn-icon hidden sm:inline-flex" onClick={() => goTo(index + 1)} aria-label="Next project"><Icon name="arrowRight" /></button>
        <div className="flex flex-1 items-center justify-center gap-0 sm:gap-1" role="group" aria-label="Choose a slide">
          {projects.map((p, i) => (
            <button key={p.slug} type="button" onClick={() => goTo(i)} aria-label={`Show ${p.name}`} aria-current={i === index ? 'true' : undefined} className="grid h-11 w-11 place-items-center">
              <span aria-hidden className={`block h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-signal' : 'w-1.5 bg-rule-strong'}`} />
            </button>
          ))}
        </div>
        {!reduced && (
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPlaying((v) => !v)} aria-label={playing ? 'Pause automatic slides' : 'Play automatic slides'} aria-pressed={!playing}>
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <Icon name="play" size={18} />
            )}
          </button>
        )}
      </div>
    </section>
  );
}
