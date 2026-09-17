import { randomUUID } from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { CachedCompressionEntry, ICompressionCache } from '../contracts';
import { DocumentFormat, CompressionProfileName } from '@/core/types/document';
import { AppDatabase, getDatabase } from '../db/connection';
import { compressionCacheTable } from '../db/schema';

export class SqliteCompressionCache implements ICompressionCache {
  private readonly db: AppDatabase;

  constructor(db?: AppDatabase) {
    this.db = db || getDatabase();
  }

  /**
   * Retrieves a cached compression entry by content hash and profile
   */
  async get(
    contentHash: string,
    profile: CompressionProfileName
  ): Promise<CachedCompressionEntry | null> {
    const results = await this.db
      .select()
      .from(compressionCacheTable)
      .where(
        and(
          eq(compressionCacheTable.contentHash, contentHash),
          eq(compressionCacheTable.profile, profile)
        )
      )
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];

    // Update last_accessed_at timestamp
    const now = Date.now();
    await this.db
      .update(compressionCacheTable)
      .set({ lastAccessedAt: now })
      .where(eq(compressionCacheTable.id, row.id));

    return {
      id: row.id,
      contentHash: row.contentHash,
      profile: row.profile as CompressionProfileName,
      fileFormat: row.fileFormat as DocumentFormat,
      originalName: row.originalName,
      originalSize: row.originalSize,
      compressedSize: row.compressedSize,
      bytesSaved: row.bytesSaved,
      reductionPercentage: row.reductionPercentage,
      storagePath: row.storagePath,
      hitCount: row.hitCount,
      createdAt: row.createdAt,
      lastAccessedAt: now,
    };
  }

  /**
   * Retrieves a cached compression entry by its primary key ID
   */
  async getById(id: string): Promise<CachedCompressionEntry | null> {
    const results = await this.db
      .select()
      .from(compressionCacheTable)
      .where(eq(compressionCacheTable.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      contentHash: row.contentHash,
      profile: row.profile as CompressionProfileName,
      fileFormat: row.fileFormat as DocumentFormat,
      originalName: row.originalName,
      originalSize: row.originalSize,
      compressedSize: row.compressedSize,
      bytesSaved: row.bytesSaved,
      reductionPercentage: row.reductionPercentage,
      storagePath: row.storagePath,
      hitCount: row.hitCount,
      createdAt: row.createdAt,
      lastAccessedAt: row.lastAccessedAt,
    };
  }

  /**
   * Stores a new compression entry or updates an existing one on conflict
   */
  async set(
    entry: Omit<CachedCompressionEntry, 'id' | 'hitCount' | 'createdAt' | 'lastAccessedAt'>
  ): Promise<CachedCompressionEntry> {
    const id = randomUUID();
    const now = Date.now();

    const record = {
      id,
      contentHash: entry.contentHash,
      profile: entry.profile,
      fileFormat: entry.fileFormat,
      originalName: entry.originalName,
      originalSize: entry.originalSize,
      compressedSize: entry.compressedSize,
      bytesSaved: entry.bytesSaved,
      reductionPercentage: entry.reductionPercentage,
      storagePath: entry.storagePath,
      hitCount: 1,
      createdAt: now,
      lastAccessedAt: now,
    };

    await this.db
      .insert(compressionCacheTable)
      .values(record)
      .onConflictDoUpdate({
        target: [compressionCacheTable.contentHash, compressionCacheTable.profile],
        set: {
          originalName: entry.originalName,
          originalSize: entry.originalSize,
          compressedSize: entry.compressedSize,
          bytesSaved: entry.bytesSaved,
          reductionPercentage: entry.reductionPercentage,
          storagePath: entry.storagePath,
          lastAccessedAt: now,
        },
      });

    return {
      id,
      contentHash: entry.contentHash,
      profile: entry.profile,
      fileFormat: entry.fileFormat,
      originalName: entry.originalName,
      originalSize: entry.originalSize,
      compressedSize: entry.compressedSize,
      bytesSaved: entry.bytesSaved,
      reductionPercentage: entry.reductionPercentage,
      storagePath: entry.storagePath,
      hitCount: 1,
      createdAt: now,
      lastAccessedAt: now,
    };
  }

  /**
   * Increments the hit count for an existing cached entry
   */
  async incrementHitCount(id: string): Promise<void> {
    const now = Date.now();
    await this.db
      .update(compressionCacheTable)
      .set({
        hitCount: sql`${compressionCacheTable.hitCount} + 1`,
        lastAccessedAt: now,
      })
      .where(eq(compressionCacheTable.id, id));
  }
}
