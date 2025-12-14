import { NextRequest, NextResponse } from 'next/server';
import { batchRepository } from '@/repositories/batch.repository';
import { publishBatchQueued } from '@/services/kafka';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await batchRepository.findBatch(id);

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    await publishBatchQueued(id, batch.directory);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error republishing batch:', error);
    return NextResponse.json({ error: 'Failed to republish batch' }, { status: 500 });
  }
}

