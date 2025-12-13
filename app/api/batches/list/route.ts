import { NextRequest, NextResponse } from 'next/server';
import { batchRepository } from '@/repositories/batch.repository';
import type { SeriesBatch } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const query: Partial<SeriesBatch> = {};
    if (status) {
      (query as any).status = status;
    }
    
    const batches = await batchRepository.listBatches(query, limit);
    
    return NextResponse.json({ batches });
  } catch (error) {
    console.error('Error listing batches:', error);
    return NextResponse.json({ error: 'Failed to list batches' }, { status: 500 });
  }
}
