import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/databases/mongodb';
import type { SeriesBatch } from '@/types';

export class BatchRepository {
  async createBatch(batch: SeriesBatch): Promise<string> {
    const collection = await getCollection<SeriesBatch>(COLLECTIONS.QUEUE);
    const result = await collection.insertOne(batch);
    return result.insertedId.toString();
  }

  async findBatch(id: string): Promise<SeriesBatch | null> {
    const collection = await getCollection<SeriesBatch>(COLLECTIONS.QUEUE);
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async listBatches(filter: Partial<SeriesBatch> = {}, limit: number = 50): Promise<SeriesBatch[]> {
    const collection = await getCollection<SeriesBatch>(COLLECTIONS.QUEUE);
    return collection.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async deleteBatch(id: string): Promise<boolean> {
    const collection = await getCollection<SeriesBatch>(COLLECTIONS.QUEUE);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  async updateBatch(id: string, updates: Partial<SeriesBatch>): Promise<boolean> {
    const collection = await getCollection<SeriesBatch>(COLLECTIONS.QUEUE);
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return result.matchedCount === 1;
  }
}

export const batchRepository = new BatchRepository();
