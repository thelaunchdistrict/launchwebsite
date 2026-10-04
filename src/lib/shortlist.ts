'use client';
import { useCallback, useSyncExternalStore } from 'react';

// Tiny localStorage-backed stores shared across components and tabs.
function createStore(key: string, max = Infinity) {
  const EVENT = `tld:${key}`;
  let cache: string[] | null = null;
  const read = (): string[] => {
    if (cache) return cache;
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      cache = Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
    } catch {
      cache = [];
    }
    return cache;
  };
  const write = (next: string[]) => {
    cache = next;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* private mode: keep in memory */ }
    window.dispatchEvent(new Event(EVENT));
  };
  const subscribe = (cb: () => void) => {
    const onStorage = (e: StorageEvent) => { if (e.key === key) { cache = null; cb(); } };
    window.addEventListener(EVENT, cb);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', onStorage); };
  };
  const EMPTY: string[] = [];
  return {
    max,
    use() {
      const items = useSyncExternalStore(subscribe, read, () => EMPTY);
      const has = useCallback((s: string) => items.includes(s), [items]);
      const toggle = useCallback((s: string): boolean => {
        const cur = read();
        if (cur.includes(s)) { write(cur.filter((x) => x !== s)); return true; }
        if (cur.length >= max) return false;
        write([...cur, s]);
        return true;
      }, []);
      const remove = useCallback((s: string) => write(read().filter((x) => x !== s)), []);
      const clear = useCallback(() => write([]), []);
      return { items, has, toggle, remove, clear, full: items.length >= max };
    },
  };
}

export const shortlistStore = createStore('tld-shortlist');
export const compareStore = createStore('tld-compare', 3);
export const useShortlist = () => shortlistStore.use();
export const useCompare = () => compareStore.use();
