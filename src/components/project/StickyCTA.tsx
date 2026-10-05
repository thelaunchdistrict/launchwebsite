'use client';
import { useEffect, useState } from 'react';
import { whatsappHref } from '../lead/WhatsAppLink';
import { Icon } from '../Icon';
import { inr } from '@/lib/format';

/** Mobile-only action bar that appears once the hero scrolls away; sits above the tab bar. */
export function StickyCTA({ name, priceFrom }: { name: string; priceFrom: number | null }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-14 z-30 border-t hairline bg-paper/95 px-3 py-2 backdrop-blur transition-transform duration-200 lg:hidden safe-bottom ${show ? 'translate-y-0' : 'translate-y-[200%]'}`}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight">{name}</p>
          <p className="num text-xs text-ink-2">{priceFrom ? `From ${inr(priceFrom)}` : 'Price on request'}</p>
        </div>
        <a href={whatsappHref(name)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon" aria-label="WhatsApp about this project" tabIndex={show ? 0 : -1}>
          <Icon name="whatsapp" />
        </a>
        <a href="#early-access" className="btn btn-primary px-4" tabIndex={show ? 0 : -1}>Price sheet</a>
      </div>
    </div>
  );
}
