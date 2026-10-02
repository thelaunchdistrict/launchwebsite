/** Fire a conversion event if analytics are enabled. Safe to call anywhere on the client. */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
  w.gtag?.('event', event, params);
  if (event === 'generate_lead') w.fbq?.('track', 'Lead', params);
}
