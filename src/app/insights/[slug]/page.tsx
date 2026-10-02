import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { ARTICLES } from '@/content/articles';
import { JsonLd } from '@/components/JsonLd';
import { Disclaimer } from '@/components/Section';

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/insights/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) return {};
  return { title: a.seoTitle ?? a.title, description: a.dek, alternates: { canonical: `/insights/${slug}` }, openGraph: { type: 'article', title: a.title, description: a.dek, publishedTime: a.date } };
}

export default async function ArticlePage({ params }: PageProps<'/insights/[slug]'>) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  const others = ARTICLES.filter((x) => x.slug !== slug);
  return (
    <article className="wrap py-10">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.dek, datePublished: a.date, author: { '@type': 'Organization', name: site.name }, publisher: { '@type': 'Organization', name: site.name } }} />
      <nav aria-label="Breadcrumb" className="text-sm text-ink-2"><Link href="/insights" className="link">Insights</Link></nav>
      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.readMins} min read</p>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02]">{a.title}</h1>
        <p className="mt-5 text-xl text-ink-2">{a.dek}</p>
      </header>
      <div className="prose-falcon mt-10 text-[1.075rem]">
        {a.body.map((b, i) =>
          'h' in b ? <h2 key={i}>{b.h}</h2>
          : 'p' in b ? <p key={i}>{b.p}</p>
          : 'ul' in b ? <ul key={i}>{b.ul.map((x) => <li key={x}>{x}</li>)}</ul>
          : <p key={i} className="max-w-[68ch] border-l-2 border-signal pl-4 text-ink">{b.note}</p>,
        )}
      </div>
      <Disclaimer className="mt-10 max-w-3xl">Educational content, not legal, tax or investment advice. Rules and rates change. Confirm with a professional and the official portals.</Disclaimer>
      <aside className="mt-16 border-t border-ink pt-4" aria-labelledby="more">
        <h2 id="more" className="eyebrow">Keep reading</h2>
        <ul className="mt-4 grid gap-6 md:grid-cols-2">
          {others.map((o) => <li key={o.slug}><Link href={`/insights/${o.slug}`} className="font-display text-2xl hover:underline underline-offset-4">{o.title}</Link></li>)}
        </ul>
      </aside>
    </article>
  );
}
