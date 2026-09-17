import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as schema from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

let dbInstance: AppDatabase | null = null;
let sqliteInstance: Database.Database | null = null;

export interface DatabaseOptions {
  readonly dbPath?: string;
}

/**
 * Initializes and returns a SQLite database instance with Drizzle ORM
 * Automatically ensures tables and indexes are created.
 */
export function initializeDatabase(options?: DatabaseOptions): {
  db: AppDatabase;
  sqlite: Database.Database;
} {
  let dbPath: string;
  if (options?.dbPath) {
    dbPath = options.dbPath;
  } else if (process.env.DATABASE_PATH) {
    dbPath = process.env.DATABASE_PATH;
  } else if (process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL) {
    // Ephemeral cloud/production database outside project repo
    dbPath = path.join(os.tmpdir(), 'document-compressor', 'data', 'compressor.db');
  } else {
    // Local development database
    dbPath = path.join(process.cwd(), 'data', 'compressor.db');
  }

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');

  // Execute schema migration
  sqlite.exec(schema.CREATE_COMPRESSION_CACHE_TABLE);

  const db = drizzle(sqlite, { schema });

  sqliteInstance = sqlite;
  dbInstance = db;

  return { db, sqlite };
}

/**
 * Gets the active database instance, creating one if not yet initialized
 */
export function getDatabase(): AppDatabase {
  if (!dbInstance) {
    const { db } = initializeDatabase();
    return db;
  }
  return dbInstance;
}

/**
 * Closes the active database connection if open
 */
export function closeDatabase(): void {
  if (sqliteInstance && sqliteInstance.open) {
    sqliteInstance.close();
  }
  sqliteInstance = null;
  dbInstance = null;
}
