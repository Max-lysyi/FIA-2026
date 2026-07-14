import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const AETHERCODE_URL = 'https://aethercode.my/v1/chat/completions'

const SYSTEM_PROMPT = `Ти — ШІ-модуль платформи CitySense, що обробляє звернення мешканців про міські інциденти (українською, можливо суржиком).
За текстом звернення визнач:
- category: одне з ["ecology","critical","transport","utility","infrastructure"]
- priority: одне з ["low","medium","high","critical"]
- department: назва відповідальної комунальної служби українською (наприклад "Водоканал", "ДСНС", "Служба дорожнього руху", "ЖКГ", "Екологічна служба")
- improvedText: технічно грамотний, розгорнутий опис проблеми для диспетчера, українською, 1-3 речення, на основі того, що написав користувач

Відповідай ЛИШЕ JSON без пояснень, у форматі:
{"category":"...","priority":"...","department":"...","improvedText":"..."}`

// Dev-only stand-in for the Vercel serverless function at api/classify.ts,
// so the AI Co-pilot works under plain `vite dev` without needing `vercel dev`.
function aiDevProxy(env: Record<string, string>): Plugin {
  return {
    name: 'ai-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/classify', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const apiKey = env.AETHERCODE_API_KEY
        if (!apiKey) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'AETHERCODE_API_KEY is not configured' }))
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const { text } = JSON.parse(Buffer.concat(chunks).toString() || '{}')

        if (!text || typeof text !== 'string') {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing text' }))
          return
        }

        try {
          const aiResponse = await fetch(AETHERCODE_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: env.AETHERCODE_MODEL || 'gpt-5.4-mini',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: text },
              ],
              temperature: 0.3,
            }),
          })

          if (!aiResponse.ok) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: `Aethercode API error: ${aiResponse.status} ${await aiResponse.text()}` }))
            return
          }

          const data = await aiResponse.json() as { choices?: { message?: { content?: string } }[] }
          const content = data.choices?.[0]?.message?.content ?? ''
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ content }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    react(),
    aiDevProxy(loadEnv(mode, process.cwd(), '')),
  ],
}))
