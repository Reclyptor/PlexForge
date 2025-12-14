import { NextRequest, NextResponse } from 'next/server';
import { batchRepository } from '@/repositories/batch.repository';
import { publishBatchQueued } from '@/services/kafka';
import type { SeriesBatch, QueuedItem, Assignment } from '@/types';

interface BatchSubmission {
  directory: string;
  assignments: Array<{
    path: string;
    assignment: Assignment;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchSubmission = await request.json();
    const { directory, assignments } = body;

    if (!directory || !assignments) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const items: QueuedItem[] = assignments.map(item => ({
      path: item.path,
      assignment: item.assignment,
    }));

    const batch: SeriesBatch = {
      directory,
      items,
      status: 'queued',
      createdAt: new Date(),
    };

    const batchId = await batchRepository.createBatch(batch);

    await publishBatchQueued(batchId, directory);

    return NextResponse.json({
      success: true,
      id: batchId,
    });

  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
