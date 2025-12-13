import { NextResponse } from 'next/server';
import { listSeriesDirectories } from '@/services/scanner';

export async function GET() {
  try {
    const series = await listSeriesDirectories();
    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error listing series:', error);
    return NextResponse.json({ error: 'Failed to list series directories' }, { status: 500 });
  }
}
