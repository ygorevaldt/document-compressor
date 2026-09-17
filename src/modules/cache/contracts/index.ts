import { DocumentFormat, CompressionProfileName } from '@/core/types/document';

export interface CachedCompressionEntry {
  readonly id: string;
  readonly contentHash: string;
  readonly profile: CompressionProfileName;
  readonly fileFormat: DocumentFormat;
  readonly originalName: string;
  readonly originalSize: number;
  readonly compressedSize: number;
  readonly bytesSaved: number;
  readonly reductionPercentage: number;
  readonly storagePath: string;
  readonly hitCount: number;
  readonly createdAt: number;
  readonly lastAccessedAt: number;
}

export interface ICompressionCache {
  get(
    contentHash: string,
    profile: CompressionProfileName
  ): Promise<CachedCompressionEntry | null>;

  getById(id: string): Promise<CachedCompressionEntry | null>;

  set(
    entry: Omit<CachedCompressionEntry, 'id' | 'hitCount' | 'createdAt' | 'lastAccessedAt'>
  ): Promise<CachedCompressionEntry>;

  incrementHitCount(id: string): Promise<void>;
}
