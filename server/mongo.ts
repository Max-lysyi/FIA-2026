import dns from 'node:dns';
import { MongoClient, type Db } from 'mongodb';

// The local resolver in some dev/sandbox environments doesn't answer SRV
// queries, which mongodb+srv:// URIs require to discover cluster hosts.
// Fall back to a public resolver so the srv lookup succeeds everywhere.
dns.setServers(['8.8.8.8', '1.1.1.1']);

let clientPromise: Promise<MongoClient> | null = null;

export function getDb(env: Record<string, string | undefined>): Promise<Db> {
  const uri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB || 'citysense';
  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise.then(client => client.db(dbName));
}
