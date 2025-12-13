import type { ObjectId } from 'mongodb';

export interface FileInfo {
  path: string;
  name: string;
  relativePath: string;
}

export interface SeriesDirectory {
  name: string;
  path: string;
  count: number;
}

export interface EpisodeAssignment {
  _id?: ObjectId;
  type: 'episode';
  series: string;
  season: number;
  episode: number;
  title: string;
  source: string;
  destination: string;
}

export interface SpecialAssignment {
  _id?: ObjectId;
  type: 'special';
  series: string;
  season: 0;
  episode: number;
  title: string;
  source: string;
  destination: string;
}

export interface ExtraAssignment {
  _id?: ObjectId;
  type: 'extra';
  series: string;
  source: string;
  destination: string;
}

export type Assignment = EpisodeAssignment | SpecialAssignment | ExtraAssignment;

export interface QueuedItem {
  _id?: ObjectId;
  path: string;
  assignment: Assignment;
}

export interface SeriesBatch {
  _id?: ObjectId;
  directory: string;
  items: QueuedItem[];
  status: 'queued';
  createdAt: Date;
}

export interface VideoEntry {
  file: FileInfo;
  episodeTitle: string;
  outputDirectory: string;
  seasonNumber: number;
  position: number;
}
