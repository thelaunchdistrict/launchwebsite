import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap py-24">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3">Off the map.</h1>
      <p className="mt-4 text-ink-2">That page doesn’t exist, or the project has been delisted.</p>
      <div className="mt-8 flex gap-3"><Link href="/projects" className="btn btn-primary">Browse projects</Link><Link href="/" className="btn btn-ghost">Home</Link></div>
    </div>
  );
}
