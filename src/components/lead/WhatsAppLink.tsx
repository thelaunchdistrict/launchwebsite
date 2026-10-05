import { site } from '@/config/site';
import { Icon } from '../Icon';

/** WhatsApp deep link. The pre-filled text carries only the project name — no personal data in the URL. */
export function whatsappHref(projectName?: string, intent: 'price' | 'visit' = 'price') {
  const text = intent === 'visit'
    ? `Hi ${site.name}, I'd like to plan a site visit${projectName ? ` to ${projectName}` : ''}.`
    : projectName
    ? `Hi ${site.name}, I'd like the private price sheet for ${projectName}.`
    : `Hi ${site.name}, I'd like to discuss early-stage projects in Gurugram.`;
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function WhatsAppLink({ projectName, className = 'btn btn-ghost', label = 'WhatsApp' }: { projectName?: string; className?: string; label?: string }) {
  return (
    <a href={whatsappHref(projectName)} target="_blank" rel="noopener noreferrer" className={className}>
      <Icon name="whatsapp" />
      {label}
      <span className="sr-only"> (opens WhatsApp)</span>
    </a>
  );
}
