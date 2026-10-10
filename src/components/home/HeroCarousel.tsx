'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectSummary } from '@/lib/types';
import { inr } from '@/lib/format';
import { Icon } from '../Icon';

const DURATION = 6500;

/**
 * Full-bleed home hero: the headline stays put while the featured projects crossfade behind it.
 * Autoplays (not under reduced motion), pauses on hover and focus, and can be driven by the progress bars,
 * the arrow buttons, the arrow keys or a swipe. Each slide's facts come from the dataset.
 */
export function HeroCarousel({ projects, updated }: { projects: ProjectSummary[]; updated: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const n = projects.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the media query after hydration
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    const vis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => { mq.removeEventListener('change', on); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (reduced || paused || n < 2) return;
    const t = setTimeout(() => go(i + 1), DURATION);
    return () => clearTimeout(t);
  }, [i, reduced, paused, n, go]);

  const p = projects[i];
  const stage = p.badges[0]?.label ?? '';

  return (
    <div
      ref={root}
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured residences"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) setPaused(false); }}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="hero-slides" aria-live="off">
        {projects.map((s, k) => (
          <div key={s.slug} className={`hero-slide ${k === i ? 'on' : ''}`} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`} aria-hidden={k !== i}>
            {s.image && (
              <Image src={s.image.src} alt={`${s.name}, ${s.locationLabel ?? 'Gurugram'}`} fill sizes="100vw" priority={k === 0} quality={75} draggable={false} />
            )}
          </div>
        ))}
      </div>
      <div className="hero-shade" aria-hidden />

      <div className="wrap hero-copy">
        <p className="eyebrow hero-eyebrow">Gurugram · Private early-entry residences · Updated {updated}</p>
        <h1 className="display">Own the address <em>before</em> the city does.</h1>
        <p className="hero-lead">
          A curated portfolio of pre-launch and early-construction homes, each one checked against what its developer publishes. See the whole picture before the price list moves.
        </p>
        <div className="hero-cta">
          <Link href="/projects?early=1" className="btn btn-light">Explore the collection</Link>
          <Link href="/contact#early-access" className="btn btn-outline-light">Request a private showing</Link>
        </div>
      </div>

      <aside className="hero-feature" aria-label="Featured project">
        <p className="hero-k">{stage}</p>
        <p className="hero-name" aria-live="polite">{p.name}</p>
        <p className="hero-where">{p.locationLabel}{p.marketName ? ` · ${p.marketName}` : ''}</p>
        <div className="hero-row">
          <span className="hero-price"><small>From</small>{p.priceFrom ? inr(p.priceFrom) : 'On request'}</span>
          <Link href={`/projects/${p.slug}`} className="hero-go">View residence <Icon name="arrowRight" size={14} /></Link>
        </div>
        <div className="hero-ctrl">
          <div className="hero-bars">
            {projects.map((s, k) => (
              <button key={s.slug} type="button" aria-label={`Show ${s.name}`} aria-current={k === i} onClick={() => go(k)} className={k < i ? 'done' : k === i ? 'on' : ''}>
                <i style={k === i && !reduced ? { animationDuration: `${DURATION}ms`, animationPlayState: paused ? 'paused' : 'running' } : undefined} />
              </button>
            ))}
          </div>
          <button type="button" className="hero-arrow" aria-label="Previous project" onClick={() => go(i - 1)}><Icon name="arrowLeft" size={16} /></button>
          <button type="button" className="hero-arrow" aria-label="Next project" onClick={() => go(i + 1)}><Icon name="arrowRight" size={16} /></button>
        </div>
      </aside>
    </div>
  );
}
