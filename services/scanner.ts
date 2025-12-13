import fs from 'fs/promises';
import path from 'path';
import { getBasePendingPath, getSeriesPath } from '../utils/path';
import type { FileInfo, SeriesDirectory } from '../types';

const VIDEO_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.m4v', '.mov', '.wmv', '.flv'];

export function isVideoFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

async function scanDirectoryRecursive(directoryPath: string, baseDir: string): Promise<FileInfo[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files: FileInfo[] = [];
  
  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    
    if (entry.isFile() && isVideoFile(entry.name)) {
      const relativePath = path.relative(baseDir, fullPath);
      files.push({
        path: fullPath,
        name: entry.name,
        relativePath,
      });
    } else if (entry.isDirectory()) {
      const subFiles = await scanDirectoryRecursive(fullPath, baseDir);
      files.push(...subFiles);
    }
  }
  
  return files;
}

export async function scanDirectory(directoryPath: string): Promise<FileInfo[]> {
  const files = await scanDirectoryRecursive(directoryPath, directoryPath);
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return files;
}

async function countVideoFiles(directoryPath: string): Promise<number> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  let count = 0;
  
  for (const entry of entries) {
    if (entry.isFile() && isVideoFile(entry.name)) {
      count++;
    } else if (entry.isDirectory()) {
      const fullPath = path.join(directoryPath, entry.name);
      count += await countVideoFiles(fullPath);
    }
  }
  
  return count;
}

export async function listSeriesDirectories(): Promise<SeriesDirectory[]> {
  const basePath = getBasePendingPath();
  const entries = await fs.readdir(basePath, { withFileTypes: true });
  const directoryEntries = entries.filter(entry => entry.isDirectory());
  
  const directories = await Promise.all(
    directoryEntries.map(async (entry) => {
      const seriesPath = getSeriesPath(entry.name);
      const count = await countVideoFiles(seriesPath);
      return { name: entry.name, path: seriesPath, count };
    })
  );
  
  directories.sort((a, b) => a.name.localeCompare(b.name));
  return directories;
}

export async function getSeriesFiles(seriesDirectory: string): Promise<FileInfo[]> {
  const seriesPath = getSeriesPath(seriesDirectory);
  return scanDirectory(seriesPath);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getFileStats(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}
