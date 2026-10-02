'use client';
import { useEffect, useRef, useState } from 'react';

/** Counts up once when scrolled into view; renders the final value immediately under reduced motion / no JS. */
export function Counter({ value, format = 'int', duration = 900 }: { value: number; format?: 'int' | 'inr'; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / duration);
        setShown(Math.round(value * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
      // rAF pauses in background tabs; never leave a half-counted number on screen.
      done = window.setTimeout(() => { cancelAnimationFrame(raf); setShown(value); }, duration + 150);
    }, { threshold: 0.6 });
    let done = 0;
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); clearTimeout(done); };
  }, [value, duration]);
  const text = format === 'inr' ? `₹${shown.toLocaleString('en-IN')}` : shown.toLocaleString('en-IN');
  return (
    <span ref={ref} className="num">
      <span aria-hidden>{text}</span>
      <span className="sr-only">{format === 'inr' ? `₹${value.toLocaleString('en-IN')}` : value}</span>
    </span>
  );
}
