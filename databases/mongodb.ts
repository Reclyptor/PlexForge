import { MongoClient, Db, Document } from 'mongodb';

const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri, options);
  return client.connect();
}

let clientPromise: Promise<MongoClient> | null = null;

function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = getClientPromise();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  
  if (!process.env.MONGODB_DATABASE) {
    throw new Error('MONGODB_DATABASE environment variable is required');
  }
  
  return client.db(process.env.MONGODB_DATABASE);
}

export async function getCollection<T extends Document>(collectionName: string) {
  const db = await getDb();
  return db.collection<T>(collectionName);
}

export const COLLECTIONS = {
  QUEUE: 'queue',
} as const;

export async function createIndexes() {
  const db = await getDb();
  
  await db.collection(COLLECTIONS.QUEUE).createIndexes([
    { key: { status: 1 } },
    { key: { seriesDirectory: 1 } },
  ]);
}

export default getClient;
