import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/modules/cache/db/schema';
import { SqliteCompressionCache } from '@/modules/cache/repositories/sqlite-compression-cache';
import { LocalStorageService } from '@/modules/storage/services/local-storage-service';
import { CompressionService } from '@/modules/compression/services/compression-service';
import { CompressionInput } from '@/core/types/document';

describe('CompressionService Deduplication & Anti-Inflation Integration', () => {
  let sqlite: Database.Database;
  let cache: SqliteCompressionCache;
  let storage: LocalStorageService;
  let service: CompressionService;
  const tempTestStorage = path.join(process.cwd(), 'storage', 'test-runs');

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.exec(schema.CREATE_COMPRESSION_CACHE_TABLE);
    const db = drizzle(sqlite, { schema });
    cache = new SqliteCompressionCache(db);
    storage = new LocalStorageService({ baseStorageDir: tempTestStorage });
    service = new CompressionService({ cache, storage });
  });

  afterEach(() => {
    sqlite.close();
    if (fs.existsSync(tempTestStorage)) {
      fs.rmSync(tempTestStorage, { recursive: true, force: true });
    }
  });

  it('should hit cache on duplicate file processing and avoid re-compression', async () => {
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
    const buffer = fs.readFileSync(fixturePath);

    const input: CompressionInput = {
      fileName: 'sample.docx',
      format: 'docx',
      buffer,
      profile: 'recommended',
    };

    // First run (Cache Miss)
    const firstResult = await service.processDocument(input);
    expect(firstResult.wasCached).toBe(false);
    expect(firstResult.originalSize).toBe(buffer.length);

    // Second run with identical file and profile (Cache Hit)
    const secondResult = await service.processDocument(input);
    expect(secondResult.wasCached).toBe(true);
    expect(secondResult.compressedSize).toBe(firstResult.compressedSize);
    expect(secondResult.bytesSaved).toBe(firstResult.bytesSaved);
    expect(secondResult.reductionPercentage).toBe(firstResult.reductionPercentage);
  });

  it('should prevent inflation when file is already minimal or cannot be compressed', async () => {
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'minimal.pdf');
    const buffer = fs.readFileSync(fixturePath);

    const input: CompressionInput = {
      fileName: 'minimal.pdf',
      format: 'pdf',
      buffer,
      profile: 'recommended',
    };

    const result = await service.processDocument(input);
    // Even if compression could not reduce size, output must never be larger than input
    expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    if (result.wasInflatedPrevented) {
      expect(result.compressedSize).toBe(result.originalSize);
      expect(result.reductionPercentage).toBe(0);
      expect(result.bytesSaved).toBe(0);
    }
  });
});
