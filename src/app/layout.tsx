import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { site } from '@/config/site';
import { TopNav } from '@/components/chrome/TopNav';
import { TabBar } from '@/components/chrome/TabBar';
import { Footer } from '@/components/chrome/Footer';
import { CompareTray } from '@/components/shortlist/CompareTray';
import { Analytics } from '@/components/chrome/Analytics';
import { JsonLd } from '@/components/JsonLd';
import './globals.css';

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
const sans = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

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
    { media: '(prefers-color-scheme: light)', color: site.colors.light.paper },
    { media: '(prefers-color-scheme: dark)', color: site.colors.dark.paper },
  ],
};

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const vars = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `--${kebab(k)}:${v}`).join(';');
const themeCss = `:root{${vars(site.colors.light)};color-scheme:light}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars(site.colors.dark)};color-scheme:dark}}
:root[data-theme="dark"]{${vars(site.colors.dark)};color-scheme:dark}`;

// Runs before paint so a stored appearance override never flashes.
const themeScript = `try{var t=localStorage.getItem('falcon-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
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
            telephone: site.contact.phone,
            address: { '@type': 'PostalAddress', addressLocality: 'Gurugram', addressRegion: 'Haryana', addressCountry: 'IN' },
          }}
        />
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
