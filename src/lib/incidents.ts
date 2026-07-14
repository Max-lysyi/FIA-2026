import type { Incident } from '../data/incidents';

export async function fetchCityIncidents(cityId: string): Promise<{ incidents: Incident[]; votes: Record<string, number> }> {
  const res = await fetch(`/api/incidents?cityId=${encodeURIComponent(cityId)}`);
  if (!res.ok) throw new Error(`Failed to load incidents: ${res.status}`);
  return res.json();
}

export async function submitIncident(cityId: string, incident: Incident): Promise<void> {
  const res = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', cityId, incident }),
  });
  if (!res.ok) throw new Error(`Failed to submit incident: ${res.status}`);
}

export async function joinIncidentVote(incidentId: string): Promise<number> {
  const res = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'join', incidentId }),
  });
  if (!res.ok) throw new Error(`Failed to join incident: ${res.status}`);
  const data = await res.json();
  return data.count as number;
}
