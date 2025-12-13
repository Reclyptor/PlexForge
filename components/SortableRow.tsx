'use client';

import React, { useState } from 'react';
import type { VideoEntry } from '@/types';
import { encodeFilePath } from '@/utils/path';
import { buildAssignment } from '@/utils/naming';

interface SortableRowProps {
  entry: VideoEntry;
  index: number;
  episodeIndex: number;
  seriesName: string;
  availableDirectories: readonly string[];
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onUpdate: (index: number, field: keyof VideoEntry, value: string | number) => void;
}

export function SortableRow({
  entry,
  index,
  episodeIndex,
  seriesName,
  availableDirectories,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onUpdate,
}: SortableRowProps) {
  const [seekTime, setSeekTime] = useState<string>('');
  
  const encodedPath = encodeFilePath(entry.file.path);
  const streamUrl = `/api/stream/${encodedPath}${seekTime ? `?t=${seekTime}` : ''}`;
  
  const { destinationPath, assignment } = buildAssignment(seriesName, entry, episodeIndex);
  const payload = { path: entry.file.path, assignment };

  const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.currentTarget as HTMLInputElement).value;
      if (val && !isNaN(parseFloat(val))) {
        setSeekTime(val);
      } else if (val === '') {
        setSeekTime('');
      }
    }
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`group grid grid-cols-[40px_320px_1fr] border-b border-[#222] bg-black hover:bg-[#111] transition-colors ${
        isDragging ? 'opacity-40' : ''
      } ${isDropTarget ? 'bg-[#1a1a1a] border-y border-white' : ''}`}
    >
      <div className="border-r border-[#222] flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-[#222] text-[#666] group-hover:text-white font-mono text-xs font-bold transition-colors">
        {episodeIndex + 1}
      </div>

      <div className="border-r border-[#222] p-2 flex flex-col gap-2">
          <div className="relative aspect-video w-full bg-[#111] border border-[#333] overflow-hidden group/video">
          <video
            key={entry.file.path}
            src={streamUrl}
            controls
            preload="metadata"
            className="w-full h-full object-contain"
          />
          
          <div className="absolute bottom-12 left-2 opacity-0 group-hover/video:opacity-100 transition-opacity z-10">
            <input
               type="text"
               placeholder="Jump to (s)"
               onKeyDown={handleJump}
               className="bg-black/90 text-white text-[10px] px-2 py-1 w-20 border border-[#444] rounded focus:outline-none focus:border-white font-mono uppercase tracking-wide"
            />
          </div>
        </div>
        <div className="text-[10px] font-mono text-[#888] truncate px-1" title={entry.file.name}>
          {entry.file.name}
        </div>
      </div>

      <div className="p-0 relative flex flex-col h-full">
        <div className="flex border-b border-[#222]">
          <select
            value={entry.outputDirectory}
            onChange={(e) => onUpdate(index, 'outputDirectory', e.target.value)}
            className="w-32 bg-black text-xs font-bold text-[#ccc] border-r border-[#222] px-2 focus:outline-none focus:bg-[#111] focus:text-white cursor-pointer appearance-none text-center h-10 uppercase tracking-tight hover:bg-[#111] transition-colors"
          >
            {availableDirectories.map(dir => (
              <option key={dir} value={dir} className="bg-black text-[#ccc]">
                {dir}
              </option>
            ))}
          </select>
          {entry.outputDirectory === 'Season' && (
            <input
              type="number"
              min="1"
              value={entry.seasonNumber}
              onChange={(e) => onUpdate(index, 'seasonNumber', parseInt(e.target.value) || 1)}
              className="w-16 bg-black text-xs font-bold text-[#ccc] border-r border-[#222] px-2 focus:outline-none focus:bg-[#111] focus:text-white text-center h-10 hover:bg-[#111] transition-colors no-spinner"
              title="Season Number"
            />
          )}
          <input
            type="text"
            value={entry.episodeTitle}
            onChange={(e) => onUpdate(index, 'episodeTitle', e.target.value)}
            className="flex-1 bg-transparent px-4 py-2 text-sm font-bold text-white placeholder-[#444] focus:outline-none focus:bg-[#111] transition-colors h-10 border-none"
            placeholder="ENTER EPISODE TITLE..."
          />
        </div>
        
        <div className="px-4 py-2 border-b border-[#222] bg-[#050505]">
            <div className="text-[10px] font-mono text-[#aaa] truncate w-full" title={destinationPath}>
            {destinationPath}
          </div>
        </div>

        <div className="flex-1 p-2 bg-[#080808] overflow-auto min-h-[60px]">
          <pre className="text-[10px] font-mono text-[#666] whitespace-pre-wrap break-all leading-tight">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
