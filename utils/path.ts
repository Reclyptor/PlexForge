import path from 'path';

export function getBasePendingPath(): string {
  const basePath = process.env.NAS_INPUT_PATH;
  if (!basePath) {
    throw new Error('NAS_INPUT_PATH environment variable is required');
  }
  return basePath;
}

// For backwards compatibility - use getBasePendingPath() in new code
export const BASE_PENDING_PATH = process.env.NAS_INPUT_PATH ?? '';

export function encodeFilePath(filePath: string): string {
  return Buffer.from(filePath)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function decodeFilePath(encoded: string): string {
  let base64 = encoded
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  while (base64.length % 4) {
    base64 += '=';
  }
  
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function getSeriesPath(seriesDirectory: string): string {
  const basePath = getBasePendingPath();
  const fullPath = path.join(basePath, seriesDirectory);
  const normalized = path.normalize(fullPath);
  
  const relativePath = path.relative(basePath, normalized);
  
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Invalid series directory: path traversal detected');
  }
  
  return normalized;
}

export function isPathSafe(filePath: string): boolean {
  const basePath = getBasePendingPath();
  const normalized = path.resolve(path.normalize(filePath));
  const normalizedBase = path.resolve(path.normalize(basePath));
  
  const baseWithSep = normalizedBase.endsWith(path.sep) 
    ? normalizedBase 
    : normalizedBase + path.sep;
  
  return normalized === normalizedBase || normalized.startsWith(baseWithSep);
}
