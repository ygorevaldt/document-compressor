/**
 * Core Domain & Service Contracts for Document Compressor
 * Strict TypeScript Definitions - Modular Monolith
 */

export type DocumentFormat = 'pdf' | 'docx' | 'doc';

export type CompressionProfileName = 'recommended' | 'maximum' | 'high_fidelity';

export interface CompressionProfileConfig {
  readonly name: CompressionProfileName;
  readonly imageDpi?: number;
  readonly jpegQuality: number;
  readonly pngPalette: boolean;
  readonly xmlDeflateLevel: number;
  readonly stripMetadata: boolean;
}

export interface CompressionInput {
  readonly fileName: string;
  readonly format: DocumentFormat;
  readonly buffer: Buffer;
  readonly profile: CompressionProfileName;
}

export interface CompressionOutput {
  readonly jobId: string;
  readonly originalSize: number;
  readonly compressedSize: number;
  readonly bytesSaved: number;
  readonly reductionPercentage: number;
  readonly compressedBuffer: Buffer;
  readonly executionDurationMs: number;
  readonly wasCached: boolean;
  readonly wasInflatedPrevented: boolean;
}

/**
 * Engine contract for specific document format compressors
 */
export interface ICompressorEngine {
  readonly supportedFormats: ReadonlyArray<DocumentFormat>;
  compress(
    buffer: Buffer,
    config: CompressionProfileConfig
  ): Promise<{
    compressedBuffer: Buffer;
    compressedSize: number;
  }>;
}

/**
 * Persistence contract for SQLite deduplication caching
 */
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

  set(
    entry: Omit<CachedCompressionEntry, 'id' | 'hitCount' | 'createdAt' | 'lastAccessedAt'>
  ): Promise<CachedCompressionEntry>;

  incrementHitCount(id: string): Promise<void>;
}

/**
 * Storage service contract for saving and retrieving compressed artifacts
 */
export interface IStorageService {
  saveCompressedFile(
    contentHash: string,
    profile: CompressionProfileName,
    format: DocumentFormat,
    buffer: Buffer
  ): Promise<string>;

  getCompressedFile(storagePath: string): Promise<Buffer>;

  purgeTemporaryFiles(olderThanMs?: number): Promise<number>;
}

/**
 * Main application orchestrator for document compression
 */
export interface ICompressionService {
  processDocument(input: CompressionInput): Promise<CompressionOutput>;
}
