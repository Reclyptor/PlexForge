import { NextRequest, NextResponse } from 'next/server';
import { getSeriesFiles } from '@/services/scanner';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seriesDir: string }> }
) {
  try {
    const { seriesDir } = await params;
    
    if (!seriesDir) {
      return NextResponse.json({ error: 'Series directory is required' }, { status: 400 });
    }

    const files = await getSeriesFiles(seriesDir);
    
    return NextResponse.json(
      { series_directory: seriesDir, files },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error getting series files:', error);
    return NextResponse.json({ error: 'Failed to get series files' }, { status: 500 });
  }
}
