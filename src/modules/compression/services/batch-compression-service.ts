import { randomUUID } from 'crypto';
import path from 'path';
import AdmZip from 'adm-zip';
import { ICompressionService } from '../contracts';
import { CompressionProfileName, DocumentFormat } from '@/core/types/document';
import { IStorageService } from '@/modules/storage/contracts';
import { ICompressionCache } from '@/modules/cache/contracts';
import { CompressionService } from './compression-service';
import { LocalStorageService } from '@/modules/storage/services/local-storage-service';
import { SqliteCompressionCache } from '@/modules/cache/repositories/sqlite-compression-cache';

export interface BatchItemInput {
  readonly fileName: string;
  readonly format: DocumentFormat;
  readonly buffer: Buffer;
}

export interface BatchItemResult {
  readonly fileName: string;
  readonly format: DocumentFormat;
  readonly status: 'completed' | 'failed';
  readonly originalSize?: number;
  readonly compressedSize?: number;
  readonly bytesSaved?: number;
  readonly reductionPercentage?: number;
  readonly downloadUrl?: string;
  readonly error?: string;
}

export interface BatchCompressionResult {
  readonly batchId: string;
  readonly totalFiles: number;
  readonly totalOriginalBytes: number;
  readonly totalCompressedBytes: number;
  readonly totalBytesSaved: number;
  readonly overallReductionPercentage: number;
  readonly zipBuffer?: Buffer;
  readonly zipDownloadUrl?: string;
  readonly items: BatchItemResult[];
}

export interface BatchServiceOptions {
  compressionService?: ICompressionService;
  storage?: IStorageService;
  cache?: ICompressionCache;
}

export class BatchCompressionService {
  private readonly compressionService: ICompressionService;
  private readonly storage: IStorageService;

  constructor(options?: BatchServiceOptions) {
    this.storage = options?.storage || new LocalStorageService();
    this.compressionService =
      options?.compressionService ||
      new CompressionService({
        cache: options?.cache || new SqliteCompressionCache(),
        storage: this.storage,
      });
  }

  async processBatch(
    items: ReadonlyArray<BatchItemInput>,
    profile: CompressionProfileName = 'recommended'
  ): Promise<BatchCompressionResult> {
    const batchId = randomUUID();
    const results: BatchItemResult[] = [];
    const zip = new AdmZip();

    let totalOriginalBytes = 0;
    let totalCompressedBytes = 0;
    let successfulCount = 0;

    for (const item of items) {
      totalOriginalBytes += item.buffer.length;

      try {
        const output = await this.compressionService.processDocument({
          fileName: item.fileName,
          format: item.format,
          buffer: item.buffer,
          profile,
        });

        results.push({
          fileName: item.fileName,
          format: item.format,
          status: 'completed',
          originalSize: output.originalSize,
          compressedSize: output.compressedSize,
          bytesSaved: output.bytesSaved,
          reductionPercentage: output.reductionPercentage,
          downloadUrl: `/api/download/${output.jobId}`,
        });

        totalCompressedBytes += output.compressedSize;
        successfulCount++;

        // Add file to ZIP archive for bulk download
        const parsed = path.parse(item.fileName);
        const entryName = `${parsed.name}-compressed.${item.format}`;
        zip.addFile(entryName, output.compressedBuffer);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Compression failed';
        results.push({
          fileName: item.fileName,
          format: item.format,
          status: 'failed',
          originalSize: item.buffer.length,
          compressedSize: item.buffer.length,
          bytesSaved: 0,
          reductionPercentage: 0,
          error: message,
        });

        totalCompressedBytes += item.buffer.length;
      }
    }

    const totalBytesSaved = Math.max(0, totalOriginalBytes - totalCompressedBytes);
    const overallReductionPercentage =
      totalOriginalBytes > 0
        ? parseFloat(((totalBytesSaved / totalOriginalBytes) * 100).toFixed(2))
        : 0;

    let zipBuffer: Buffer | undefined;
    let zipDownloadUrl: string | undefined;

    if (successfulCount > 0) {
      zipBuffer = zip.toBuffer();
      // Store batch zip in temporary storage for download
      const tempPath = await (this.storage as LocalStorageService).saveTempFile(zipBuffer, 'zip');
      const tempFileName = path.basename(tempPath);
      zipDownloadUrl = `/api/download/batch/${tempFileName}`;
    }

    return {
      batchId,
      totalFiles: items.length,
      totalOriginalBytes,
      totalCompressedBytes,
      totalBytesSaved,
      overallReductionPercentage,
      zipBuffer,
      zipDownloadUrl,
      items: results,
    };
  }
}
