import { getDb } from '../server/mongo';
import { listUserIncidents, addIncident, getVotes, joinIncident } from '../server/incidentsRepo';

export default async function handler(req: any, res: any) {
  try {
    const db = await getDb(process.env as Record<string, string | undefined>);

    if (req.method === 'GET') {
      const cityId = String(req.query?.cityId ?? '');
      const [incidents, votes] = await Promise.all([
        cityId ? listUserIncidents(db, cityId) : Promise.resolve([]),
        getVotes(db),
      ]);
      res.status(200).json({ incidents, votes });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (body?.action === 'add') {
        await addIncident(db, body.cityId, body.incident);
        res.status(200).json({ ok: true });
        return;
      }

      if (body?.action === 'join') {
        const count = await joinIncident(db, body.incidentId);
        res.status(200).json({ ok: true, count });
        return;
      }

      res.status(400).json({ error: 'Unknown action' });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
}
