'use client';
import { useState } from 'react';
import { Icon } from '../Icon';

/**
 * Toggle for a server-rendered table whose extra rows carry the `row-extra` class. Rows stay in the HTML
 * (good for search and no-JS readers); CSS hides them until the table is marked expanded.
 */
export function ShowMoreRows({ tableId, count, noun }: { tableId: string; count: number; noun: string }) {
  const [open, setOpen] = useState(false);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    document.getElementById(tableId)?.toggleAttribute('data-expanded', next);
  };
  return (
    <button type="button" onClick={toggle} aria-expanded={open} aria-controls={tableId} className="cta-line mt-2">
      {open ? `Show fewer ${noun}` : `Show ${count} more ${noun}`}
      <Icon name="chevronDown" size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}
