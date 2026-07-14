export const config = { runtime: 'edge' };

const API_URL = 'https://aethercode.my/v1/chat/completions';
const MODEL = process.env.AETHERCODE_MODEL || 'gpt-5.4-mini';

const SYSTEM_PROMPT = `Ти — ШІ-модуль платформи CitySense, що обробляє звернення мешканців про міські інциденти (українською, можливо суржиком).
За текстом звернення визнач:
- category: одне з ["ecology","critical","transport","utility","infrastructure"]
- priority: одне з ["low","medium","high","critical"]
- department: назва відповідальної комунальної служби українською (наприклад "Водоканал", "ДСНС", "Служба дорожнього руху", "ЖКГ", "Екологічна служба")
- improvedText: технічно грамотний, розгорнутий опис проблеми для диспетчера, українською, 1-3 речення, на основі того, що написав користувач

Відповідай ЛИШЕ JSON без пояснень, у форматі:
{"category":"...","priority":"...","department":"...","improvedText":"..."}`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.AETHERCODE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AETHERCODE_API_KEY is not configured' }), { status: 500 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
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
        { role: 'user', content: text },
      ],
      temperature: 0.3,
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
