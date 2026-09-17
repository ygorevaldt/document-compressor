import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/modules/cache/db/schema';
import { SqliteCompressionCache } from '@/modules/cache/repositories/sqlite-compression-cache';
import { ICompressionCache } from '@/modules/cache/contracts';

describe('SqliteCompressionCache Contract Test', () => {
  let sqlite: Database.Database;
  let cache: ICompressionCache;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.exec(schema.CREATE_COMPRESSION_CACHE_TABLE);
    const db = drizzle(sqlite, { schema });
    cache = new SqliteCompressionCache(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  it('should return null when cache entry does not exist', async () => {
    const entry = await cache.get('non-existent-hash', 'recommended');
    expect(entry).toBeNull();
  });

  it('should store and retrieve a cache entry', async () => {
    const newEntry = {
      contentHash: 'hash-abc-123',
      profile: 'recommended' as const,
      fileFormat: 'pdf' as const,
      originalName: 'report.pdf',
      originalSize: 10000,
      compressedSize: 5000,
      bytesSaved: 5000,
      reductionPercentage: 50.0,
      storagePath: '/storage/compressed/hash-abc-123_recommended.pdf',
    };

    const saved = await cache.set(newEntry);
    expect(saved.id).toBeDefined();
    expect(saved.hitCount).toBe(1);
    expect(saved.contentHash).toBe(newEntry.contentHash);

    const retrieved = await cache.get('hash-abc-123', 'recommended');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.originalName).toBe('report.pdf');
    expect(retrieved?.reductionPercentage).toBe(50.0);
  });

  it('should increment hit count correctly', async () => {
    const newEntry = {
      contentHash: 'hash-hit-count',
      profile: 'maximum' as const,
      fileFormat: 'docx' as const,
      originalName: 'doc.docx',
      originalSize: 8000,
      compressedSize: 4000,
      bytesSaved: 4000,
      reductionPercentage: 50.0,
      storagePath: '/storage/compressed/hash-hit-count_maximum.docx',
    };

    const saved = await cache.set(newEntry);
    await cache.incrementHitCount(saved.id);

    const updated = await cache.get('hash-hit-count', 'maximum');
    expect(updated?.hitCount).toBe(2);
  });
});
