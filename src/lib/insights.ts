import type { Incident } from '../data/incidents';

export async function generateInsight(incidents: Incident[]): Promise<string> {
  const summary = incidents
    .map(i => `- [${i.category}/${i.priority}] ${i.title} — ${i.location} (${i.complaintsCount} скарг)`)
    .join('\n');

  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: summary || 'Наразі немає активних інцидентів.' }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error ?? `AI insight request failed: ${res.status}`);
  }

  const { content } = await res.json();
  return (content as string).trim();
}
