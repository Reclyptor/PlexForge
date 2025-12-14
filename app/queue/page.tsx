'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SeriesBatch } from '@/types';

export default function QueuePage() {
  const [batches, setBatches] = useState<SeriesBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const response = await fetch('/api/batches/list?status=queued');
      const data = await response.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete batch');
      }

      await loadBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const handleRepublish = async (batchId: string) => {
    try {
      const response = await fetch(`/api/batches/${batchId}/republish`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to republish batch');
      }
    } catch (error) {
      console.error('Error republishing batch:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#888] font-mono uppercase tracking-widest text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="bg-black border-b border-[#333]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">
                Execution Queue
              </h1>
              <p className="text-xs font-mono text-[#888] mt-1 uppercase tracking-wider">
                {batches.length} BATCH{batches.length !== 1 ? 'ES' : ''} READY
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-2 text-xs font-bold text-white hover:bg-[#222] border border-[#333] uppercase tracking-wider transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {batches.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#333] rounded-lg">
            <svg className="w-12 h-12 mx-auto text-[#444] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[#666] mb-6 font-mono text-sm uppercase tracking-wide">
              No batches in queue
            </p>
            <Link
              href="/"
              className="text-white hover:text-[#ccc] text-xs font-bold uppercase tracking-wider underline underline-offset-4"
            >
              Start sorting a series
            </Link>
          </div>
        ) : (
          <>
            {/* Batches Table */}
            <div className="bg-[#0a0a0a] border border-[#333] overflow-hidden">
              <table className="w-full">
                <thead className="bg-black border-b border-[#333]">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-[#888] uppercase tracking-widest border-r border-[#333]">
                      Series
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-[#888] uppercase tracking-widest border-r border-[#333]">
                      Files
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-[#888] uppercase tracking-widest border-r border-[#333]">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold text-[#888] uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {batches.map((batch) => (
                    <tr key={batch._id?.toString()} className="hover:bg-[#111] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap border-r border-[#222]">
                        <div className="text-sm font-bold text-white uppercase tracking-tight">
                          {batch.directory}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-[#ccc] border-r border-[#222]">
                        {batch.items.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-[#666] border-r border-[#222]">
                        {batch.createdAt ? new Date(batch.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
                        <button
                          onClick={() => batch._id && handleRepublish(batch._id.toString())}
                          className="text-[#888] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
                        >
                          Republish
                        </button>
                        <button
                          onClick={() => batch._id && handleDeleteBatch(batch._id.toString())}
                          className="text-[#888] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
