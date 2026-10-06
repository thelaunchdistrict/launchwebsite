import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Jost } from 'next/font/google';
import { site } from '@/config/site';
import { TopNav } from '@/components/chrome/TopNav';
import { TabBar } from '@/components/chrome/TabBar';
import { Footer } from '@/components/chrome/Footer';
import { CompareTray } from '@/components/shortlist/CompareTray';
import { Analytics } from '@/components/chrome/Analytics';
import { JsonLd } from '@/components/JsonLd';
import { AnnouncementBar } from '@/components/chrome/AnnouncementBar';
import { datasetMeta, summaries } from '@/lib/data';
import './globals.css';

// Couture direction: high-contrast Didone for display (optical sizes keep hairlines intact when small), geometric Jost for text and figures.
const serif = Bodoni_Moda({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-serif', display: 'swap' });
const sans = Jost({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-jost', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Early-entry real estate research, Gurugram`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: 'website', siteName: site.name, locale: site.locale },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { color: site.colors.light.paper },
  ],
};

// ink2 → --ink-2, nightInk2 → --night-ink-2 (digits get their own segment, matching globals.css).
const kebab = (k: string) => k.replace(/[A-Z]|\d+/g, (c) => `-${c.toLowerCase()}`);
const vars = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `--${kebab(k)}:${v}`).join(';');
const themeCss = `:root{${vars(site.colors.light)};color-scheme:light}
@media (prefers-color-scheme: dark){:root[data-theme="system"]{${vars(site.colors.dark)};color-scheme:dark}}
:root[data-theme="dark"]{${vars(site.colors.dark)};color-scheme:dark}`;

// Runs before paint so a stored appearance override never flashes.
const themeScript = `try{var t=localStorage.getItem('tld-theme');if(t==='light'||t==='dark'||t==='system')document.documentElement.dataset.theme=t}catch(e){}`;

function announcement() {
  const s = summaries();
  const verified = s.filter((p) => p.updates.some((u) => u.key === 'verified')).length;
  const prices = s.filter((p) => p.updates.some((u) => u.key === 'price')).length;
  const fresh = s.filter((p) => p.updates.some((u) => u.key === 'new')).length;
  const parts = [
    verified ? `${verified} projects re-verified with their developers` : null,
    prices ? `${prices} starting price${prices > 1 ? 's' : ''} updated` : null,
    fresh ? `${fresh} newly listed` : null,
  ].filter(Boolean);
  return parts.length ? { message: `Updated ${new Date(datasetMeta.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${parts.join(' · ')}`, version: datasetMeta.generatedAt.slice(0, 10) } : null;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="skip-link">Skip to content</a>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: site.name,
            url: site.url,
            email: site.contact.email,
            address: { '@type': 'PostalAddress', addressLocality: 'Gurugram', addressRegion: 'Haryana', addressCountry: 'IN' },
          }}
        />
        {(() => { const a = announcement(); return a ? <AnnouncementBar {...a} href="/projects?sort=verified" cta="See what changed" /> : null; })()}
        <TopNav />
        <main id="main" className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <CompareTray />
        <TabBar />
        <Analytics />
      </body>
    </html>
  );
}
