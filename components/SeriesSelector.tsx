'use client';

import Link from 'next/link';
import type { SeriesDirectory } from '@/types';

interface SeriesSelectorProps {
  series: SeriesDirectory[];
}

export function SeriesSelector({ series }: SeriesSelectorProps) {
  if (series.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-[#333] rounded-lg">
        <svg className="w-12 h-12 mx-auto text-[#444] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="text-[#666] font-mono text-sm uppercase tracking-wide">
          No series directories found in the pending folder
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {series.map((s) => (
        <Link
          key={s.name}
          href={`/sort/${encodeURIComponent(s.name)}`}
          className="group block bg-[#0a0a0a] border border-[#333] hover:border-white transition-colors p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-2 group-hover:text-white transition-colors">
                {s.name}
              </h3>
              <div className="flex items-center text-xs font-mono text-[#666]">
                <svg className="w-3 h-3 mr-2 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span>{s.count} VIDEO FILE{s.count !== 1 ? 'S' : ''}</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-[#444] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}
