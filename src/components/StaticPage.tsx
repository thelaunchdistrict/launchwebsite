export function StaticPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="wrap py-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">{title}</h1>
      {intro && <p className="mt-4 max-w-2xl text-lg text-ink-2">{intro}</p>}
      <div className="prose-falcon mt-10 text-ink-2 [&_h2]:text-ink [&_strong]:text-ink">{children}</div>
    </div>
  );
}
