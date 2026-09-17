import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';
import { ICompressionService, ICompressorEngine } from '../contracts';
import {
  CompressionInput,
  CompressionOutput,
  DocumentFormat,
} from '@/core/types/document';
import { detectDocumentFormat } from '@/lib/file-detector';
import { FileSizeExceededError, InvalidDocumentFormatError } from '@/core/errors/domain-errors';
import { getProfileConfig } from '../profiles/compression-profiles';
import { DocxCompressorEngine } from '../engines/docx-compressor-engine';
import { PdfCompressorEngine } from '../engines/pdf-compressor-engine';
import { LegacyDocCompressorEngine } from '../engines/legacy-doc-compressor-engine';

export interface CompressionServiceOptions {
  engines?: Partial<Record<DocumentFormat, ICompressorEngine>>;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit

export class CompressionService implements ICompressionService {
  private readonly engines: Record<DocumentFormat, ICompressorEngine>;

  constructor(options?: CompressionServiceOptions) {
    this.engines = {
      pdf: options?.engines?.pdf || new PdfCompressorEngine(),
      docx: options?.engines?.docx || new DocxCompressorEngine(),
      doc: options?.engines?.doc || new LegacyDocCompressorEngine(),
    };
  }

  async processDocument(input: CompressionInput): Promise<CompressionOutput> {
    const startTime = performance.now();

    // 1. File Size Validation
    if (input.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeExceededError(input.buffer.length, MAX_FILE_SIZE_BYTES);
    }

    // 2. Format & Signature Validation
    const detected = detectDocumentFormat(input.buffer, input.fileName);
    const format = detected.format;
    const profile = input.profile || 'recommended';

    // 3. Select Profile & Engine
    const profileConfig = getProfileConfig(profile);
    const engine = this.engines[format];

    if (!engine) {
      throw new InvalidDocumentFormatError(format);
    }

    // 4. Execute Engine Compression in-memory
    const engineResult = await engine.compress(input.buffer, profileConfig);

    // 5. Anti-Inflation Protection
    let finalBuffer: Buffer;
    let finalSize: number;
    let bytesSaved: number;
    let reductionPercentage: number;
    let wasInflatedPrevented: boolean;

    if (engineResult.compressedSize >= input.buffer.length) {
      // Return original file to guarantee files never grow larger
      finalBuffer = input.buffer;
      finalSize = input.buffer.length;
      bytesSaved = 0;
      reductionPercentage = 0;
      wasInflatedPrevented = true;
    } else {
      finalBuffer = engineResult.compressedBuffer;
      finalSize = engineResult.compressedSize;
      bytesSaved = input.buffer.length - engineResult.compressedSize;
      reductionPercentage = parseFloat(((bytesSaved / input.buffer.length) * 100).toFixed(2));
      wasInflatedPrevented = false;
    }

    return {
      jobId: randomUUID(),
      originalSize: input.buffer.length,
      compressedSize: finalSize,
      bytesSaved,
      reductionPercentage,
      compressedBuffer: finalBuffer,
      executionDurationMs: Math.max(1, Math.round(performance.now() - startTime)),
      wasCached: false,
      wasInflatedPrevented,
    };
  }
}

