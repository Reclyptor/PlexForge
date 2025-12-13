import type { FileInfo, Assignment, VideoEntry } from '../types';

interface NamingOptions {
  seriesName: string;
  outputDirectory: string;
  seasonNumber?: number;
  episodeIndex: number;
  episodeTitle?: string;
  file: FileInfo;
}

interface AssignmentResult {
  destinationPath: string;
  assignment: Assignment;
}

export function buildAssignment(
  seriesName: string,
  entry: VideoEntry,
  episodeIndex: number
): AssignmentResult {
  const isExtra = entry.outputDirectory === 'Extra';
  const isSpecial = entry.outputDirectory === 'Special';

  const destinationFilename = generateDestinationFilename({
    seriesName,
    outputDirectory: entry.outputDirectory,
    seasonNumber: entry.seasonNumber,
    episodeIndex,
    episodeTitle: entry.episodeTitle,
    file: entry.file,
  });

  let destinationPath: string;
  let assignment: Assignment;

  if (isExtra) {
    const subDir = entry.file.relativePath.includes('/')
      ? entry.file.relativePath.substring(0, entry.file.relativePath.lastIndexOf('/'))
      : '';
    destinationPath = subDir
      ? `${seriesName}/Extras/${subDir}/${destinationFilename}`
      : `${seriesName}/Extras/${destinationFilename}`;
    assignment = {
      type: 'extra',
      series: seriesName,
      source: `${seriesName}/${entry.file.relativePath}`,
      destination: destinationPath,
    };
  } else if (isSpecial) {
    destinationPath = `${seriesName}/Specials/${destinationFilename}`;
    assignment = {
      type: 'special',
      series: seriesName,
      season: 0,
      episode: episodeIndex + 1,
      title: entry.episodeTitle || '',
      source: `${seriesName}/${entry.file.relativePath}`,
      destination: destinationPath,
    };
  } else {
    const seasonDir = `Season ${entry.seasonNumber.toString().padStart(2, '0')}`;
    destinationPath = `${seriesName}/${seasonDir}/${destinationFilename}`;
    assignment = {
      type: 'episode',
      series: seriesName,
      season: entry.seasonNumber,
      episode: episodeIndex + 1,
      title: entry.episodeTitle || '',
      source: `${seriesName}/${entry.file.relativePath}`,
      destination: destinationPath,
    };
  }

  return { destinationPath, assignment };
}

export function generateDestinationFilename({
  seriesName,
  outputDirectory,
  seasonNumber,
  episodeIndex,
  episodeTitle,
  file,
}: NamingOptions): string {
  const isExtra = outputDirectory.toLowerCase().includes('extra');
  const isSpecial = outputDirectory.toLowerCase().includes('special');

  if (isExtra) {
    if (episodeTitle) {
      const fileExt = file.name.split('.').pop() || 'mkv';
      return `${episodeTitle}.${fileExt}`;
    }
    return file.name;
  }

  let seasonNum = seasonNumber !== undefined ? seasonNumber : 1;
  if (isSpecial) {
    seasonNum = 0;
  } else if (seasonNumber === undefined) {
    const match = outputDirectory.match(/(\d+)/);
    if (match) {
      seasonNum = parseInt(match[1], 10);
    }
  }
  
  const seasonStr = seasonNum.toString().padStart(2, '0');
  const episodeStr = (episodeIndex + 1).toString().padStart(2, '0');
  const fileExt = file.name.split('.').pop() || 'mkv';

  if (episodeTitle) {
    return `${seriesName} - S${seasonStr}E${episodeStr} - ${episodeTitle}.${fileExt}`;
  }
  
  return `${seriesName} - S${seasonStr}E${episodeStr}.${fileExt}`;
}
