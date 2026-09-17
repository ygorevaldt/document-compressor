import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/modules/cache/db/schema';
import { SqliteCompressionCache } from '@/modules/cache/repositories/sqlite-compression-cache';
import { LocalStorageService } from '@/modules/storage/services/local-storage-service';
import { CompressionService } from '@/modules/compression/services/compression-service';
import { BatchCompressionService } from '@/modules/compression/services/batch-compression-service';
import { calculateSha256 } from '@/lib/hash-utils';

describe('Quickstart End-to-End Validation Scenarios', () => {
  let sqlite: Database.Database;
  let cache: SqliteCompressionCache;
  let storage: LocalStorageService;
  let compressionService: CompressionService;
  let batchService: BatchCompressionService;
  const tempTestStorage = path.join(process.cwd(), 'storage', 'test-quickstart');

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.exec(schema.CREATE_COMPRESSION_CACHE_TABLE);
    const db = drizzle(sqlite, { schema });
    cache = new SqliteCompressionCache(db);
    storage = new LocalStorageService({ baseStorageDir: tempTestStorage });
    compressionService = new CompressionService({ cache, storage });
    batchService = new BatchCompressionService({ compressionService, storage, cache });
  });

  afterEach(() => {
    sqlite.close();
    if (fs.existsSync(tempTestStorage)) {
      fs.rmSync(tempTestStorage, { recursive: true, force: true });
    }
  });

  it('Scenario 1: Single Document Flow with Recommended Profile', async () => {
    const docxPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
    const originalBuffer = fs.readFileSync(docxPath);

    const result = await compressionService.processDocument({
      fileName: 'sample.docx',
      format: 'docx',
      buffer: originalBuffer,
      profile: 'recommended',
    });

    expect(result.originalSize).toBe(originalBuffer.length);
    expect(result.compressedSize).toBeLessThan(originalBuffer.length);
    expect(result.bytesSaved).toBeGreaterThan(0);
    expect(result.reductionPercentage).toBeGreaterThan(0);
    expect(result.wasCached).toBe(false);
    expect(result.compressedBuffer).toBeDefined();
  });

  it('Scenario 2: Deduplication Verification Flow with Cache Hit & Hit Count', async () => {
    const docxPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
    const originalBuffer = fs.readFileSync(docxPath);
    const contentHash = calculateSha256(originalBuffer);

    // Run 1: Cache Miss
    const result1 = await compressionService.processDocument({
      fileName: 'sample.docx',
      format: 'docx',
      buffer: originalBuffer,
      profile: 'recommended',
    });
    expect(result1.wasCached).toBe(false);

    // Verify cache entry in database
    const cachedEntry1 = await cache.get(contentHash, 'recommended');
    expect(cachedEntry1).not.toBeNull();
    expect(cachedEntry1?.hitCount).toBe(1);

    // Run 2: Cache Hit
    const result2 = await compressionService.processDocument({
      fileName: 'sample.docx',
      format: 'docx',
      buffer: originalBuffer,
      profile: 'recommended',
    });
    expect(result2.wasCached).toBe(true);
    expect(result2.compressedSize).toBe(result1.compressedSize);
    expect(result2.executionDurationMs).toBeLessThan(200);

    // Verify hit_count incremented to 2
    const cachedEntry2 = await cache.get(contentHash, 'recommended');
    expect(cachedEntry2?.hitCount).toBe(2);
  });

  it('Scenario 3: Batch Document Flow with Aggregate Reduction & ZIP Bundle', async () => {
    const pdfPath = path.join(process.cwd(), 'tests', 'fixtures', 'image-sample.pdf');
    const docxPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');

    const pdfBuffer = fs.readFileSync(pdfPath);
    const docxBuffer = fs.readFileSync(docxPath);

    const batch = await batchService.processBatch(
      [
        { fileName: 'report.pdf', format: 'pdf', buffer: pdfBuffer },
        { fileName: 'notes.docx', format: 'docx', buffer: docxBuffer },
      ],
      'recommended'
    );

    expect(batch.totalFiles).toBe(2);
    expect(batch.totalOriginalBytes).toBe(pdfBuffer.length + docxBuffer.length);
    expect(batch.totalCompressedBytes).toBeLessThan(batch.totalOriginalBytes);
    expect(batch.overallReductionPercentage).toBeGreaterThan(0);
    expect(batch.zipBuffer).toBeDefined();

    const zip = new AdmZip(batch.zipBuffer);
    expect(zip.getEntries()).toHaveLength(2);
  });

  it('Scenario 4: Anti-Inflation Protection on minimal document', async () => {
    const minimalPath = path.join(process.cwd(), 'tests', 'fixtures', 'minimal.pdf');
    const buffer = fs.readFileSync(minimalPath);

    const result = await compressionService.processDocument({
      fileName: 'minimal.pdf',
      format: 'pdf',
      buffer,
      profile: 'recommended',
    });

    expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
  });
});
