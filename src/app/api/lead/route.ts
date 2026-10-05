import { site } from '@/config/site';

/**
 * Lead capture. Storage is configurable:
 *   LEAD_STORE=webhook + LEAD_WEBHOOK_URL=… → POST JSON to Zapier / Make / Google Apps Script (→ Sheet) / CRM
 *   LEAD_STORE=file (default, dev only)      → append to .leads/leads.jsonl
 * Both can run together: if a webhook URL is set it is always called.
 */
const MAX = { name: 80, phone: 20, text: 120 };
const str = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

// Naive per-instance rate limit: 5 submissions / 10 min / IP.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (str(body.company, 50)) return Response.json({ ok: true }); // honeypot: pretend success

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (limited(ip)) return Response.json({ error: 'Too many requests. Please try again later or use WhatsApp.' }, { status: 429 });

  const phone = str(body.phone, MAX.phone).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const lead = {
    receivedAt: new Date().toISOString(),
    name: str(body.name, MAX.name),
    phone,
    budget: str(body.budget, MAX.text),
    timeline: str(body.timeline, MAX.text),
    project: str(body.project, MAX.text),
    projectName: str(body.projectName, MAX.text),
    source: str(body.source, 40),
    page: str(body.page, 200),
    consent: body.consent === true,
    brand: site.name,
  };
  if (lead.name.length < 2) return Response.json({ error: 'Please enter your name.' }, { status: 422 });
  if (!/^[6-9]\d{9}$/.test(phone)) return Response.json({ error: 'Please enter a valid 10-digit Indian mobile number.' }, { status: 422 });
  if (!lead.consent) return Response.json({ error: 'Consent is required.' }, { status: 422 });

  const store = (process.env.LEAD_STORE as 'file' | 'webhook' | undefined) ?? site.leads.defaultStore;
  const webhook = process.env.LEAD_WEBHOOK_URL;
  try {
    if (webhook) {
      const r = await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(process.env.LEAD_WEBHOOK_SECRET ? { authorization: `Bearer ${process.env.LEAD_WEBHOOK_SECRET}` } : {}) },
        body: JSON.stringify(lead),
      });
      if (!r.ok) throw new Error(`webhook ${r.status}`);
    }
    if (store === 'file' && process.env.NODE_ENV !== 'production') {
      // Local development only: Workers and other serverless hosts have no writable disk.
      const { appendFile, mkdir } = await import('node:fs/promises');
      const dir = `${process.cwd()}/.leads`;
      await mkdir(dir, { recursive: true });
      await appendFile(`${dir}/leads.jsonl`, JSON.stringify(lead) + '\n');
    } else if (!webhook) {
      // Nowhere durable to write: log so it is at least visible in platform logs, and tell the operator.
      console.warn('[lead] no LEAD_WEBHOOK_URL configured — lead logged only', { ...lead, phone: `******${phone.slice(-4)}` });
    }
  } catch (e) {
    console.error('[lead] store failed', e);
    return Response.json({ error: 'We could not save your request. Please use WhatsApp instead.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
