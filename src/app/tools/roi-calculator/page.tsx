import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RoiCalculator } from '@/components/tools/RoiCalculator';
import { ToolsNav } from '@/components/tools/ToolsNav';

export const metadata: Metadata = {
  title: 'ROI & IRR calculator for new launches',
  description: 'Model total return, annualised IRR and money multiple for a Gurugram property: entry price, holding period, appreciation, rental yield, home loan EMI and exit costs.',
  alternates: { canonical: '/tools/roi-calculator' },
};

export default function RoiPage() {
  return (
    <div className="wrap py-10">
      <ToolsNav current="/tools/roi-calculator" />
      <header className="mb-10 mt-6 max-w-3xl">
        <p className="eyebrow">Tool · Returns</p>
        <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">What could this actually return?</h1>
        <p className="mt-4 text-ink-2">Change the assumptions and the result updates live. The model is monthly: EMIs go out, rent comes in after possession, and the sale closes everything out. The IRR comes from those cash flows.</p>
      </header>
      <Suspense fallback={<p className="text-ink-2">Loading calculator…</p>}>
        <RoiCalculator />
      </Suspense>
    </div>
  );
}
