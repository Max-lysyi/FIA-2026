import type { Db } from 'mongodb';
import type { Incident } from '../src/data/incidents.js';

export async function listUserIncidents(db: Db, cityId: string): Promise<Incident[]> {
  const docs = await db
    .collection('incidents')
    .find({ cityId })
    .sort({ _seq: -1 })
    .toArray();

  return docs.map(({ _id, _seq, cityId: _c, ...incident }) => incident as Incident);
}

export async function addIncident(db: Db, cityId: string, incident: Incident): Promise<void> {
  await db.collection('incidents').insertOne({ ...incident, cityId, _seq: Date.now() });
}

export async function getVotes(db: Db): Promise<Record<string, number>> {
  const docs = await db.collection('votes').find({}).toArray();
  return Object.fromEntries(docs.map(d => [d.incidentId as string, d.count as number]));
}

export async function joinIncident(db: Db, incidentId: string): Promise<number> {
  const result = await db.collection('votes').findOneAndUpdate(
    { incidentId },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return (result?.count as number | undefined) ?? 1;
}
