'use client';
import Link from 'next/link';
import type { ProjectSummary } from '@/lib/types';
import { useCompare, useShortlist } from '@/lib/shortlist';
import { ProjectCard } from '../project/ProjectCard';

export function ShortlistView({ all }: { all: ProjectSummary[] }) {
  const { items, clear } = useShortlist();
  const compare = useCompare();
  const list = items.map((s) => all.find((p) => p.slug === s)).filter((p): p is ProjectSummary => !!p);
  if (!list.length) {
    return (
      <div className="card mt-8 p-8">
        <p className="h3">No saved projects yet.</p>
        <p className="mt-2 text-ink-2">Tap the bookmark on any project to keep it here.</p>
        <Link href="/projects" className="btn btn-ink mt-4">Browse projects</Link>
      </div>
    );
  }
  const compareTop = () => { compare.clear(); list.slice(0, 3).forEach((p) => compare.toggle(p.slug)); };
  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-ink pb-3">
        <p className="mr-auto"><span className="num text-lg">{list.length}</span> <span className="text-ink-2">saved</span></p>
        {list.length > 1 && <Link href={`/compare?p=${list.slice(0, 3).map((p) => p.slug).join(',')}`} onClick={compareTop} className="btn btn-ink">Compare {Math.min(3, list.length)}</Link>}
        <button type="button" className="btn btn-ghost" onClick={clear}>Clear shortlist</button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <ProjectCard key={p.slug} p={p} />)}
      </div>
    </>
  );
}
