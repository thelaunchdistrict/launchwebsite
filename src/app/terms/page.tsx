import type { Metadata } from 'next';
import { site } from '@/config/site';
import { StaticPage } from '@/components/StaticPage';

export const metadata: Metadata = { title: 'Terms of use', description: `Terms for using ${site.name}: information not advice, accuracy of listing data, image rights and calculator limits.`, alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <StaticPage eyebrow="Legal" title="Terms of use" intro="Template for review by counsel before launch.">
      <h2>Information, not advice</h2>
      <p>{site.disclaimer}</p>
      <h2>Accuracy</h2>
      <p>Project information is compiled from public sources and may be incomplete, outdated or wrong. Values {site.name} derives (such as indicative ₹/sq ft or construction stage) are estimates and are labelled as such. The developer’s documents and the RERA registration prevail over anything shown here.</p>
      <h2>Images and trademarks</h2>
      <p>Project images, plans and names belong to their respective developers and are shown to identify the projects. If you own content shown here and want it removed, write to {site.contact.email}.</p>
      <h2>Tools</h2>
      <p>Calculators use your assumptions and a simplified model. Outputs are illustrative and do not predict actual returns.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, {site.name} is not liable for decisions made on the basis of information on this site.</p>
    </StaticPage>
  );
}
