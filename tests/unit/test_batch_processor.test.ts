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

describe('BatchCompressionService Unit Tests', () => {
  let sqlite: Database.Database;
  let batchService: BatchCompressionService;
  const tempTestStorage = path.join(process.cwd(), 'storage', 'test-batch-runs');

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.exec(schema.CREATE_COMPRESSION_CACHE_TABLE);
    const db = drizzle(sqlite, { schema });
    const cache = new SqliteCompressionCache(db);
    const storage = new LocalStorageService({ baseStorageDir: tempTestStorage });
    const compressionService = new CompressionService({ cache, storage });
    batchService = new BatchCompressionService({ compressionService, storage, cache });
  });

  afterEach(() => {
    sqlite.close();
    if (fs.existsSync(tempTestStorage)) {
      fs.rmSync(tempTestStorage, { recursive: true, force: true });
    }
  });

  it('should process mixed batch with error isolation and zip bundling', async () => {
    const pdfPath = path.join(process.cwd(), 'tests', 'fixtures', 'image-sample.pdf');
    const docxPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
    const corruptedPath = path.join(process.cwd(), 'tests', 'fixtures', 'corrupted.pdf');

    const pdfBuffer = fs.readFileSync(pdfPath);
    const docxBuffer = fs.readFileSync(docxPath);
    const corruptedBuffer = fs.readFileSync(corruptedPath);

    const items = [
      { fileName: 'doc1.pdf', format: 'pdf' as const, buffer: pdfBuffer },
      { fileName: 'doc2.docx', format: 'docx' as const, buffer: docxBuffer },
      { fileName: 'corrupted.pdf', format: 'pdf' as const, buffer: corruptedBuffer },
    ];

    const batchResult = await batchService.processBatch(items, 'recommended');

    expect(batchResult.batchId).toBeDefined();
    expect(batchResult.totalFiles).toBe(3);
    expect(batchResult.items).toHaveLength(3);

    // Error isolation
    const pdfItem = batchResult.items.find((i) => i.fileName === 'doc1.pdf');
    const docxItem = batchResult.items.find((i) => i.fileName === 'doc2.docx');
    const corruptItem = batchResult.items.find((i) => i.fileName === 'corrupted.pdf');

    expect(pdfItem?.status).toBe('completed');
    expect(docxItem?.status).toBe('completed');
    expect(corruptItem?.status).toBe('failed');
    expect(corruptItem?.error).toBeDefined();

    // Aggregates
    expect(batchResult.totalOriginalBytes).toBeGreaterThan(0);
    expect(batchResult.totalCompressedBytes).toBeLessThan(batchResult.totalOriginalBytes);
    expect(batchResult.totalBytesSaved).toBe(
      batchResult.totalOriginalBytes - batchResult.totalCompressedBytes
    );
    expect(batchResult.overallReductionPercentage).toBeGreaterThan(0);

    // Zip bundle
    expect(batchResult.zipBuffer).toBeDefined();
    const zip = new AdmZip(batchResult.zipBuffer);
    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries).toContain('doc1-compressed.pdf');
    expect(entries).toContain('doc2-compressed.docx');
    expect(entries).not.toContain('corrupted-compressed.pdf');
  });
});
