import type { Metadata } from 'next';
import { summaries } from '@/lib/data';
import { ShortlistView } from '@/components/shortlist/ShortlistView';

export const metadata: Metadata = {
  title: 'Your shortlist',
  description: 'Projects you saved on this device, ready to compare side by side or to request early-access pricing.',
  robots: { index: false },
  alternates: { canonical: '/shortlist' },
};

export default function ShortlistPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow">Shortlist</p>
      <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">Saved projects.</h1>
      <p className="mt-3 text-ink-2">Stored only in this browser. Nothing is sent to us until you request pricing.</p>
      <ShortlistView all={summaries()} />
    </div>
  );
}
