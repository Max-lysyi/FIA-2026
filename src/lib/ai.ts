import type { IncidentCategory, IncidentPriority } from '../data/incidents';

export interface AIClassification {
  category: IncidentCategory;
  priority: IncidentPriority;
  department: string;
  improvedText: string;
}

const CATEGORIES: IncidentCategory[] = ['ecology', 'critical', 'transport', 'utility', 'infrastructure'];
const PRIORITIES: IncidentPriority[] = ['low', 'medium', 'high', 'critical'];

export async function classifyIncident(text: string): Promise<AIClassification> {
  const response = await fetch('/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error ?? `AI request failed: ${response.status}`);
  }

  const { content } = await response.json();
  const jsonMatch = (content as string).match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const category: IncidentCategory = CATEGORIES.includes(parsed.category) ? parsed.category : 'infrastructure';
  const priority: IncidentPriority = PRIORITIES.includes(parsed.priority) ? parsed.priority : 'medium';

  return {
    category,
    priority,
    department: typeof parsed.department === 'string' && parsed.department.trim() ? parsed.department : 'ЖКГ',
    improvedText: typeof parsed.improvedText === 'string' && parsed.improvedText.trim() ? parsed.improvedText : text,
  };
}
