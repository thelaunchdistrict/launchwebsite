import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/config/site';
import { stats } from '@/lib/data';
import { StaticPage } from '@/components/StaticPage';

export const metadata: Metadata = { title: 'About', description: `What ${site.name} is, how it works and how it makes money.`, alternates: { canonical: '/about' } };

export default function AboutPage() {
  const s = stats();
  return (
    <StaticPage eyebrow="About" title="Research first, brochure never." intro={`${site.name} helps investors find and evaluate early-stage projects in Gurugram, before the crowd and with the numbers in view.`}>
      <h2>What we do</h2>
      <p>We track {s.tracked} projects from {s.developers} developers across {s.markets} corridors, and lay out each one the way an investor reads it: how early it is, what a square foot costs against its corridor, when possession is due, and what is still unknown.</p>
      <h2>How we work</h2>
      <ul>
        <li>We compile project facts from public listing pages and developer material, and refresh them on a schedule.</li>
        <li>Missing values stay missing. Anything we infer (indicative ₹/sq ft, construction progress, micro-market) is labelled as inferred.</li>
        <li>Rankings are rule-based: stage first, then runway to possession. Nobody pays for placement.</li>
      </ul>
      <h2>How we make money</h2>
      <p>When you ask for early-access pricing, an advisor works with you and the developer on allotment. Like most channel partners in India, we may be paid a brokerage by the developer on a completed booking. You can always book directly with the developer instead.</p>
      <p><Link href="/disclaimer" className="link">Read our disclaimer and RERA note →</Link></p>
    </StaticPage>
  );
}
