import type { Metadata } from 'next';
import { site } from '@/config/site';
import { StaticPage } from '@/components/StaticPage';
import { whatsappHref } from '@/components/lead/WhatsAppLink';

export const metadata: Metadata = { title: 'Privacy policy', description: `What ${site.name} collects when you enquire, what stays on your device, and how to access or delete your data.`, alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <StaticPage eyebrow="Legal" title="Privacy policy" intro="Template for review by counsel before launch. It is written to align with India’s Digital Personal Data Protection Act, 2023.">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Enquiries:</strong> name, mobile number, budget, timeline and project interest, but only when you submit a form.</li>
        <li><strong>On your device only:</strong> your shortlist, compare list and appearance preference live in your browser’s local storage and are never sent to us.</li>
        <li><strong>Analytics:</strong> Google Analytics 4 (IP addresses anonymised) for aggregate usage statistics. Meta Pixel is used only if enabled by the operator for ad measurement.</li>
      </ul>
      <h2>Why</h2>
      <p>To respond to your enquiry, share pricing and inventory, and arrange site visits. We share your details with a developer only for the project you asked about and with your consent.</p>
      <h2>Your rights</h2>
      <p>You can ask us to access, correct or erase your data, or withdraw consent, by <a className="link" href={whatsappHref()} target="_blank" rel="noopener noreferrer">messaging us on WhatsApp</a>.</p>
      <h2>Retention</h2>
      <p>Enquiry data is kept for up to 24 months after the last contact, unless the law requires longer.</p>
      <p className="text-xs">Operator: {site.legalName}.</p>
    </StaticPage>
  );
}
