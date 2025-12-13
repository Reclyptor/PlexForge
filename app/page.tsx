import Link from 'next/link';
import { SeriesSelector } from '@/components/SeriesSelector';
import { listSeriesDirectories } from '@/services/scanner';

export const dynamic = 'force-dynamic';

async function getSeries() {
  try {
    return await listSeriesDirectories();
  } catch (error) {
    console.error('Error fetching series:', error);
    return [];
  }
}

export default async function Home() {
  const series = await getSeries();

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="bg-black border-b border-[#333]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white uppercase">
                PlexForge
              </h1>
              <p className="text-xs font-mono text-[#888] mt-1 uppercase tracking-wider">
                Media Series Sorting & Management
              </p>
            </div>
            <Link
              href="/queue"
              className="px-6 py-2 bg-white text-black hover:bg-[#ccc] text-xs font-bold uppercase tracking-wider transition-all rounded-sm"
            >
              View Queue
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-2">
              Select Series to Sort
            </h2>
            <p className="text-sm text-[#888] font-mono">
              Choose a series directory to begin organizing files
            </p>
          </div>
          <div className="text-xs font-mono text-[#666] border border-[#333] px-3 py-1 bg-[#0a0a0a]">
            {series.length} SERIES FOUND
          </div>
        </div>

        <SeriesSelector series={series} />
      </main>
    </div>
  );
}
