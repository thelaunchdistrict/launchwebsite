import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { site } from '@/config/site';
import { summaries } from '@/lib/data';
import { LeadForm } from '@/components/lead/LeadForm';
import { WhatsAppLink } from '@/components/lead/WhatsAppLink';

export const metadata: Metadata = pageMeta({ title: 'Contact & early access', description: 'Leave your details or message us on WhatsApp for the private price sheet on pre-launch and early-construction projects in Gurugram.', path: '/contact' });

export default function ContactPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow">Contact</p>
      <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">Talk to an advisor.</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <p className="text-lg text-ink-2">Leave your details and an advisor will reach you within one working day with current pricing, inventory and our view on the corridor. Prefer to write? Message us on WhatsApp.</p>
          <dl className="divide-y divide-rule border-y border-ink">
            <div className="flex items-center justify-between py-3"><dt className="text-ink-2">Hours</dt><dd>{site.contact.hours}</dd></div>
            <div className="flex items-center justify-between py-3"><dt className="text-ink-2">Office</dt><dd>{site.contact.address}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <WhatsAppLink className="btn btn-primary" label="Message us on WhatsApp" />
          </div>
        </div>
        <div id="early-access" className="card scroll-mt-24 p-5 md:p-8">
          <LeadForm heading="Receive the private price sheet" projects={summaries().map((p) => ({ slug: p.slug, name: p.name }))} source="contact" />
        </div>
      </div>
    </div>
  );
}
