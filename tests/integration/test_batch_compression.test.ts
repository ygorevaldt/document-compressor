import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/modules/cache/db/schema';
import { SqliteCompressionCache } from '@/modules/cache/repositories/sqlite-compression-cache';
import { LocalStorageService } from '@/modules/storage/services/local-storage-service';
import { CompressionService } from '@/modules/compression/services/compression-service';
import { BatchCompressionService } from '@/modules/compression/services/batch-compression-service';

describe('Batch Compression Integration', () => {
  let sqlite: Database.Database;
  let batchService: BatchCompressionService;
  const tempTestStorage = path.join(process.cwd(), 'storage', 'test-batch-integration');

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

  it('should process multiple valid files and return aggregate metrics', async () => {
    const pdfPath = path.join(process.cwd(), 'tests', 'fixtures', 'image-sample.pdf');
    const docxPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');

    const pdfBuffer = fs.readFileSync(pdfPath);
    const docxBuffer = fs.readFileSync(docxPath);

    const items = [
      { fileName: 'document-a.pdf', format: 'pdf' as const, buffer: pdfBuffer },
      { fileName: 'document-b.docx', format: 'docx' as const, buffer: docxBuffer },
    ];

    const result = await batchService.processBatch(items, 'maximum');

    expect(result.totalFiles).toBe(2);
    expect(result.items.filter((i) => i.status === 'completed')).toHaveLength(2);
    expect(result.totalBytesSaved).toBeGreaterThan(0);
    expect(result.overallReductionPercentage).toBeGreaterThan(0);
  });
});
