import type { Metadata } from 'next';
import { site } from '@/config/site';
import { datasetMeta } from '@/lib/data';
import { StaticPage } from '@/components/StaticPage';

export const metadata: Metadata = { title: 'RERA note, disclaimer & methodology', description: `How ${site.name} classifies stage, computes indicative ₹/sq ft and assigns micro-markets, plus what to verify on the HARERA portal.`, alternates: { canonical: '/disclaimer' } };

export default function DisclaimerPage() {
  return (
    <StaticPage eyebrow="RERA & disclaimer" title="Read this before you invest." intro={site.disclaimer}>
      <h2>RERA</h2>
      <p>Every real-estate project in Haryana above the statutory threshold must be registered with the Haryana Real Estate Regulatory Authority (HARERA), Gurugram, before it is advertised or sold. Where we show a RERA number, it is the one published for the project. Check it yourself on the HARERA portal, confirm it covers the specific phase or tower, and check the registered completion date.</p>
      <p>{site.name}’s agent registration number will appear here once issued. [Placeholder: add the HARERA agent registration no.]</p>
      <h2 id="methodology">Methodology</h2>
      <ul>
        <li><strong>Source:</strong> public project listing pages and developer material, last compiled {new Date(datasetMeta.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Missing fields are left blank, never estimated.</li>
        <li><strong>Stage (Entry Rail):</strong> taken from the listed project status. If the listing text says the project is in a pre-launch or new-launch phase, we show that and say where it came from. For under-construction projects, the marker’s position is estimated from the stated possession date, assuming a 60-month build.</li>
        <li><strong>Early-entry badge:</strong> pre-launch or new launch (as listed), or under construction with stated possession at least 36 months away (“early construction”, our inference).</li>
        <li><strong>₹/sq ft:</strong> the developer’s published rate when available. Otherwise an indicative rate equal to the starting price divided by the smallest listed unit, marked with an asterisk. Values outside ₹4,000–₹60,000 are discarded as inconsistent.</li>
        <li><strong>Micro-market:</strong> assigned by {site.name} from the address and sector number.</li>
        <li><strong>Projections:</strong> calculator outputs depend entirely on your assumptions and are illustrative.</li>
      </ul>
      <h2>Not advice</h2>
      <p>Nothing on this site is a recommendation to buy or sell any property. Real estate is illiquid. Under-construction projects can be delayed or stalled, and past appreciation does not predict future returns. Speak to a qualified financial, legal and tax advisor.</p>
    </StaticPage>
  );
}
