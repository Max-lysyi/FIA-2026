export const config = { runtime: 'edge' };

const API_URL = 'https://aethercode.my/v1/chat/completions';
const MODEL = process.env.AETHERCODE_MODEL || 'gpt-5.4-mini';

const SYSTEM_PROMPT = `Ти — аналітичний ШІ-модуль платформи CitySense для міської адміністрації.
Отримуєш список поточних інцидентів міста (категорія, пріоритет, локація, кількість скарг).
Напиши короткий (2-4 речення) аналітичний висновок українською: які проблеми найгостріші, чи є небезпечні кластери чи повторювані патерни, що варто зробити диспетчерам першочергово.
Пиши по суті, без вступних фраз на кшталт "Ось аналіз". Відповідай лише текстом висновку, без markdown.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.AETHERCODE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AETHERCODE_API_KEY is not configured' }), { status: 500 });
  }

  const { summary } = await req.json();
  if (!summary || typeof summary !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing summary' }), { status: 400 });
  }

  const aiResponse = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: summary },
      ],
      temperature: 0.4,
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    return new Response(JSON.stringify({ error: `Aethercode API error: ${aiResponse.status} ${errText}` }), { status: 502 });
  }

  const data = await aiResponse.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';

  return new Response(JSON.stringify({ content }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
