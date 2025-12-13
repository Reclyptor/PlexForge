'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { FileInfo, VideoEntry } from '@/types';
import { buildAssignment } from '@/utils/naming';
import { SortableRow } from '@/components/SortableRow';

const OUTPUT_DIRECTORIES = ['Season', 'Special', 'Extra'] as const;

export default function SortSeriesPage({ params }: { params: Promise<{ seriesDir: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const seriesDir = decodeURIComponent(resolvedParams.seriesDir);
  
  const seriesName = seriesDir === '.' ? 'Root Directory' : seriesDir.replace(/\/$/, '').split('/').pop() || seriesDir;

  const [videoEntries, setVideoEntries] = useState<VideoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    loadFiles();
  }, [seriesDir]);

  const sortEntries = (entries: VideoEntry[]): VideoEntry[] => {
    return [...entries].sort((a, b) => {
      const rank = (entry: VideoEntry) => {
        if (entry.outputDirectory === 'Season') return 0;
        if (entry.outputDirectory === 'Special') return 1;
        return 2;
      };
      
      const rankA = rank(a);
      const rankB = rank(b);
      if (rankA !== rankB) return rankA - rankB;

      if (a.outputDirectory === 'Season' && b.outputDirectory === 'Season') {
        if (a.seasonNumber !== b.seasonNumber) return a.seasonNumber - b.seasonNumber;
      }

      // Preserve relative order within groups
      return a.position - b.position;
    });
  };

  const loadFiles = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/series/${encodeURIComponent(seriesDir)}/files?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await response.json();
      const loadedFiles = data.files || [];
      
      const entries: VideoEntry[] = loadedFiles.map((file: FileInfo, idx: number) => {
        let seasonNum = 1;
        let outputDir = 'Season';
        
        if (file.relativePath) {
          const lower = file.relativePath.toLowerCase();
          if (lower.includes('special')) {
            outputDir = 'Special';
            seasonNum = 1;
          } else if (lower.includes('extra')) {
            outputDir = 'Extra';
          } else {
            const match = file.relativePath.match(/Season\s*(\d+)/i);
            if (match) {
              seasonNum = parseInt(match[1], 10);
            }
          }
        }

        return {
          file,
          episodeTitle: '',
          outputDirectory: outputDir,
          seasonNumber: seasonNum,
          position: idx,
        };
      });
      
      setVideoEntries(sortEntries(entries));
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const updateEntry = (index: number, field: keyof VideoEntry, value: string | number) => {
    const newEntries = [...videoEntries];
    const entry = { ...newEntries[index] };

    if (field === 'seasonNumber' && typeof value === 'number') {
      entry.seasonNumber = value;
    } else if (field === 'episodeTitle' && typeof value === 'string') {
      entry.episodeTitle = value;
    } else if (field === 'outputDirectory' && typeof value === 'string') {
      entry.outputDirectory = value;
    }

    newEntries[index] = entry;
    
    if (field === 'outputDirectory' || field === 'seasonNumber') {
      setVideoEntries(sortEntries(newEntries));
    } else {
      setVideoEntries(newEntries);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  };

  const getGroupKey = (entry: VideoEntry): string => {
    return entry.outputDirectory === 'Season'
      ? `Season_${entry.seasonNumber}`
      : entry.outputDirectory;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newEntries = [...videoEntries];
    const [removed] = newEntries.splice(draggedIndex, 1);
    newEntries.splice(targetIndex, 0, removed);
    
    // Only renumber positions within the dragged entry's group
    const draggedGroupKey = getGroupKey(removed);
    let groupPosition = 0;
    newEntries.forEach((entry) => {
      if (getGroupKey(entry) === draggedGroupKey) {
        entry.position = groupPosition++;
      }
    });
    
    setVideoEntries(sortEntries(newEntries));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const episodeCounters: Record<string, number> = {};

      const assignments = videoEntries.map((entry) => {
        const groupKey = getGroupKey(entry);
        const effectiveIndex = episodeCounters[groupKey] || 0;
        episodeCounters[groupKey] = effectiveIndex + 1;

        const { assignment } = buildAssignment(seriesName, entry, effectiveIndex);

        return {
          path: entry.file.path,
          assignment,
        };
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directory: seriesDir,
          assignments,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to queue batch');
      }

      router.push('/queue');
    } catch (error) {
      console.error('Error queuing batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const episodeCounters: Record<string, number> = {};
  let lastHeader: string | null = null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <header className="bg-black border-b border-[#333] sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">
              {seriesName}
            </h1>
            <span className="text-xs font-mono text-[#888] border border-[#333] px-2 py-1">
              {videoEntries.length} FILES
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 text-xs font-bold text-white hover:bg-[#222] border border-[#333] uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-white text-black hover:bg-[#ccc] disabled:bg-[#333] disabled:text-[#666] text-xs font-bold uppercase tracking-wider transition-all"
            >
              {loading ? 'QUEUING...' : 'QUEUE BATCH'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-[40px_320px_1fr] gap-0 border-t border-[#333] bg-black text-[10px] font-bold text-[#888] uppercase tracking-widest">
          <div className="py-2 text-center border-r border-[#333]">#</div>
          <div className="py-2 px-3 border-r border-[#333]">Source Video</div>
          <div className="py-2 px-3">Target Configuration</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-black">
        {videoEntries.map((entry, index) => {
          const groupKey = getGroupKey(entry);
          const effectiveIndex = episodeCounters[groupKey] || 0;
          episodeCounters[groupKey] = effectiveIndex + 1;

          let currentHeader = '';
          if (entry.outputDirectory === 'Season') {
            currentHeader = `SEASON ${entry.seasonNumber.toString().padStart(2, '0')}`;
          } else if (entry.outputDirectory === 'Special') {
            currentHeader = 'SPECIALS';
          } else {
            currentHeader = 'EXTRAS';
          }
          
          const showHeader = currentHeader !== lastHeader;
          lastHeader = currentHeader;

          return (
            <div key={entry.file.path}>
              {showHeader && (
                <div className="bg-[#111] text-[#666] text-[10px] font-bold uppercase tracking-widest px-4 py-1 border-b border-[#222]">
                  {currentHeader}
                </div>
              )}
              <SortableRow
                entry={entry}
                index={index}
                episodeIndex={effectiveIndex}
                seriesName={seriesName}
                availableDirectories={OUTPUT_DIRECTORIES}
                isDragging={draggedIndex === index}
                isDropTarget={dragOverIndex === index}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onUpdate={updateEntry}
              />
            </div>
          );
        })}

        {videoEntries.length === 0 && (
          <div className="flex items-center justify-center h-64 text-[#444] text-xs uppercase tracking-widest font-bold">
            NO MEDIA FILES FOUND
          </div>
        )}
      </div>
    </div>
  );
}
