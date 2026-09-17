/**
 * Domain types and value objects for Document Compressor
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

export interface DocumentMetadata {
  readonly id: string;
  readonly fileName: string;
  readonly format: DocumentFormat;
  readonly originalSize: number;
  readonly mimeType: string;
  readonly contentHash: string;
  readonly createdAt: Date;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CompressionJob {
  readonly id: string;
  readonly documentId: string;
  readonly profile: CompressionProfileName;
  readonly status: JobStatus;
  readonly progress: number;
  readonly cached: boolean;
  readonly error: string | null;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
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

export interface CompressionResult {
  readonly jobId: string;
  readonly fileName: string;
  readonly format: DocumentFormat;
  readonly originalSize: number;
  readonly compressedSize: number;
  readonly bytesSaved: number;
  readonly reductionPercentage: number;
  readonly wasCached: boolean;
  readonly wasInflatedPrevented: boolean;
  readonly downloadUrl: string;
  readonly executionDurationMs: number;
  readonly base64?: string;
  readonly mimeType?: string;
}
