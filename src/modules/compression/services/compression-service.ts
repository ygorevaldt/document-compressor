import { performance } from 'perf_hooks';
import { ICompressionService, ICompressorEngine } from '../contracts';
import {
  CompressionInput,
  CompressionOutput,
  DocumentFormat,
} from '@/core/types/document';
import { ICompressionCache } from '@/modules/cache/contracts';
import { IStorageService } from '@/modules/storage/contracts';
import { SqliteCompressionCache } from '@/modules/cache/repositories/sqlite-compression-cache';
import { LocalStorageService } from '@/modules/storage/services/local-storage-service';
import { calculateSha256 } from '@/lib/hash-utils';
import { detectDocumentFormat } from '@/lib/file-detector';
import { FileSizeExceededError, InvalidDocumentFormatError } from '@/core/errors/domain-errors';
import { getProfileConfig } from '../profiles/compression-profiles';
import { DocxCompressorEngine } from '../engines/docx-compressor-engine';
import { PdfCompressorEngine } from '../engines/pdf-compressor-engine';
import { LegacyDocCompressorEngine } from '../engines/legacy-doc-compressor-engine';

export interface CompressionServiceOptions {
  cache?: ICompressionCache;
  storage?: IStorageService;
  engines?: Partial<Record<DocumentFormat, ICompressorEngine>>;
}

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB limit

export class CompressionService implements ICompressionService {
  private readonly cache: ICompressionCache;
  private readonly storage: IStorageService;
  private readonly engines: Record<DocumentFormat, ICompressorEngine>;

  constructor(options?: CompressionServiceOptions) {
    this.cache = options?.cache || new SqliteCompressionCache();
    this.storage = options?.storage || new LocalStorageService();
    this.engines = {
      pdf: options?.engines?.pdf || new PdfCompressorEngine(),
      docx: options?.engines?.docx || new DocxCompressorEngine(),
      doc: options?.engines?.doc || new LegacyDocCompressorEngine(),
    };
  }

  async processDocument(input: CompressionInput): Promise<CompressionOutput> {
    const startTime = performance.now();

    // 1. File Size Validation (<= 500MB)
    if (input.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeExceededError(input.buffer.length, MAX_FILE_SIZE_BYTES);
    }

    // 2. Format & Signature Validation
    const detected = detectDocumentFormat(input.buffer, input.fileName);
    const format = detected.format;

    // 3. Compute SHA-256 Hash
    const contentHash = calculateSha256(input.buffer);
    const profile = input.profile || 'recommended';

    // 4. Cache Check (Deduplication)
    const cached = await this.cache.get(contentHash, profile);
    if (cached) {
      await this.cache.incrementHitCount(cached.id);
      const compressedBuffer = await this.storage.getCompressedFile(cached.storagePath);

      return {
        jobId: cached.id,
        originalSize: cached.originalSize,
        compressedSize: cached.compressedSize,
        bytesSaved: cached.bytesSaved,
        reductionPercentage: cached.reductionPercentage,
        compressedBuffer,
        executionDurationMs: Math.max(1, Math.round(performance.now() - startTime)),
        wasCached: true,
        wasInflatedPrevented: cached.bytesSaved === 0 && cached.compressedSize === cached.originalSize,
      };
    }

    // 5. Select Profile & Engine
    const profileConfig = getProfileConfig(profile);
    const engine = this.engines[format];

    if (!engine) {
      throw new InvalidDocumentFormatError(format);
    }

    // 6. Execute Engine Compression
    const engineResult = await engine.compress(input.buffer, profileConfig);

    // 7. Anti-Inflation Protection
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

    // 8. Persist Compressed Artifact
    const storagePath = await this.storage.saveCompressedFile(
      contentHash,
      profile,
      format,
      finalBuffer
    );

    // 9. Store Metadata in SQLite Cache
    const cacheEntry = await this.cache.set({
      contentHash,
      profile,
      fileFormat: format,
      originalName: input.fileName,
      originalSize: input.buffer.length,
      compressedSize: finalSize,
      bytesSaved,
      reductionPercentage,
      storagePath,
    });

    return {
      jobId: cacheEntry.id,
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
