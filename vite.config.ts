import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getDb } from './server/mongo.js'
import { listUserIncidents, addIncident, getVotes, joinIncident } from './server/incidentsRepo.js'

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

const INSIGHTS_SYSTEM_PROMPT = `Ти — аналітичний ШІ-модуль платформи CitySense для міської адміністрації.
Отримуєш список поточних інцидентів міста (категорія, пріоритет, локація, кількість скарг).
Напиши короткий (2-4 речення) аналітичний висновок українською: які проблеми найгостріші, чи є небезпечні кластери чи повторювані патерни, що варто зробити диспетчерам першочергово.
Пиши по суті, без вступних фраз на кшталт "Ось аналіз". Відповідай лише текстом висновку, без markdown.`

// Dev-only stand-in for the Vercel serverless function at api/insights.ts.
function insightsDevProxy(env: Record<string, string>): Plugin {
  return {
    name: 'insights-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/insights', async (req, res) => {
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
        const { summary } = JSON.parse(Buffer.concat(chunks).toString() || '{}')

        if (!summary || typeof summary !== 'string') {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing summary' }))
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
                { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
                { role: 'user', content: summary },
              ],
              temperature: 0.4,
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

// Dev-only stand-in for the Vercel serverless function at api/incidents.ts,
// backed by the same MongoDB Atlas cluster.
function incidentsDevProxy(env: Record<string, string>): Plugin {
  return {
    name: 'incidents-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/incidents', async (req, res) => {
        try {
          const db = await getDb(env)
          const url = new URL(req.url || '', 'http://localhost')

          if (req.method === 'GET') {
            const cityId = url.searchParams.get('cityId') ?? ''
            const [incidents, votes] = await Promise.all([
              cityId ? listUserIncidents(db, cityId) : Promise.resolve([]),
              getVotes(db),
            ])
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ incidents, votes }))
            return
          }

          if (req.method === 'POST') {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            const body = JSON.parse(Buffer.concat(chunks).toString() || '{}')

            if (body.action === 'add') {
              await addIncident(db, body.cityId, body.incident)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
              return
            }
            if (body.action === 'join') {
              const count = await joinIncident(db, body.incidentId)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, count }))
              return
            }
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Unknown action' }))
            return
          }

          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      tailwindcss(),
      react(),
      aiDevProxy(env),
      insightsDevProxy(env),
      incidentsDevProxy(env),
    ],
  }
})
