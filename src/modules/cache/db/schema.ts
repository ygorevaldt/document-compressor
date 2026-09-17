import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Raw SQL table creation query for direct SQLite migration without CLI dependencies
 */
export const CREATE_COMPRESSION_CACHE_TABLE = `
CREATE TABLE IF NOT EXISTS compression_cache (
    id TEXT PRIMARY KEY NOT NULL,
    content_hash TEXT NOT NULL,
    profile TEXT NOT NULL,
    file_format TEXT NOT NULL,
    original_name TEXT NOT NULL,
    original_size INTEGER NOT NULL,
    compressed_size INTEGER NOT NULL,
    bytes_saved INTEGER NOT NULL,
    reduction_percentage REAL NOT NULL,
    storage_path TEXT NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    last_accessed_at INTEGER NOT NULL,
    CONSTRAINT uq_hash_profile UNIQUE (content_hash, profile)
);

CREATE INDEX IF NOT EXISTS idx_cache_hash_profile ON compression_cache(content_hash, profile);
CREATE INDEX IF NOT EXISTS idx_cache_last_accessed ON compression_cache(last_accessed_at);
`;

/**
 * Drizzle ORM Schema Definition for compression_cache table
 */
export const compressionCacheTable = sqliteTable(
  'compression_cache',
  {
    id: text('id').primaryKey(),
    contentHash: text('content_hash').notNull(),
    profile: text('profile').notNull(),
    fileFormat: text('file_format').notNull(),
    originalName: text('original_name').notNull(),
    originalSize: integer('original_size').notNull(),
    compressedSize: integer('compressed_size').notNull(),
    bytesSaved: integer('bytes_saved').notNull(),
    reductionPercentage: real('reduction_percentage').notNull(),
    storagePath: text('storage_path').notNull(),
    hitCount: integer('hit_count').notNull().default(1),
    createdAt: integer('created_at').notNull(),
    lastAccessedAt: integer('last_accessed_at').notNull(),
  },
  (table) => ({
    uqHashProfile: uniqueIndex('uq_hash_profile').on(table.contentHash, table.profile),
    idxCacheHashProfile: index('idx_cache_hash_profile').on(table.contentHash, table.profile),
    idxCacheLastAccessed: index('idx_cache_last_accessed').on(table.lastAccessedAt),
  })
);

export type CompressionCacheRecord = typeof compressionCacheTable.$inferSelect;
export type InsertCompressionCacheRecord = typeof compressionCacheTable.$inferInsert;
