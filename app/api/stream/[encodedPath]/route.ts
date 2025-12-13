import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { decodeFilePath, isPathSafe } from '@/utils/path';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ encodedPath: string }> }
) {
  try {
    const { encodedPath } = await params;
    const filePath = decodeFilePath(encodedPath);
    
    if (!isPathSafe(filePath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let stat;
    try {
      stat = statSync(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (needsTranscoding(filePath)) {
      const { searchParams } = request.nextUrl;
      const startTime = searchParams.get('t');
      
      const transcodedStream = transcodeToMp4(filePath, startTime);
      const webStream = Readable.toWeb(transcodedStream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'none',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      let start: number;
      let end: number;
      
      if (parts[0] === '') {
        const suffix = parseInt(parts[1], 10);
        if (isNaN(suffix) || suffix <= 0) {
          return NextResponse.json({ error: 'Invalid range request' }, { status: 416 });
        }
        start = Math.max(0, fileSize - suffix);
        end = fileSize - 1;
      } else {
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        if (isNaN(start) || isNaN(end) || start < 0 || end >= fileSize || start > end) {
          return NextResponse.json({ error: 'Invalid range request' }, { status: 416 });
        }
      }
      
      const chunkSize = end - start + 1;
      const stream = createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(stream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': getContentType(filePath),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } else {
      const stream = createReadStream(filePath);
      const webStream = Readable.toWeb(stream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': getContentType(filePath),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 500 });
  }
}

function needsTranscoding(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.mkv', '.avi', '.wmv', '.flv'].includes(ext);
}

function transcodeToMp4(filePath: string, startTime?: string | null): Readable {
  const args: string[] = [];

  if (startTime && !isNaN(parseFloat(startTime))) {
    args.push('-ss', startTime);
  }

  args.push(
    '-i', filePath,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', 'frag_keyframe+empty_moov',
    '-f', 'mp4',
    'pipe:1'
  );

  const ffmpeg = spawn('ffmpeg', args, {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  ffmpeg.stderr.on('data', (data) => {
    const line = data.toString().split('\n')[0];
    if (line && !line.includes('frame=')) {
      console.error(`FFmpeg: ${line}`);
    }
  });

  ffmpeg.on('error', (error) => {
    console.error('FFmpeg spawn error:', error);
  });

  return ffmpeg.stdout;
}

function getContentType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop();
  
  const mimeTypes: Record<string, string> = {
    'mp4': 'video/mp4',
    'mkv': 'video/x-matroska',
    'avi': 'video/x-msvideo',
    'm4v': 'video/x-m4v',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
  };

  return mimeTypes[ext || ''] || 'video/mp4';
}
