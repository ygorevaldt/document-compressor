import { DocumentFormat, CompressionProfileConfig, CompressionInput, CompressionOutput } from '@/core/types/document';

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

export interface ICompressionService {
  processDocument(input: CompressionInput): Promise<CompressionOutput>;
}
