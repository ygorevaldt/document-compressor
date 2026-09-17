import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LocalStorageService } from '@/modules/storage/services/local-storage-service';
import { CleanupService } from '@/modules/storage/services/cleanup-service';

describe('CleanupService Unit Tests', () => {
  const tempDir = path.join(process.cwd(), 'storage', 'test-cleanup');
  let storage: LocalStorageService;
  let cleanup: CleanupService;

  beforeEach(() => {
    storage = new LocalStorageService({ baseStorageDir: tempDir });
    cleanup = new CleanupService({ storageService: storage });
  });

  afterEach(() => {
    cleanup.stopScheduledCleanup();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should purge old temporary files and leave recent files', async () => {
    const oldFilePath = await storage.saveTempFile(Buffer.from('old content'), 'tmp');
    const newFilePath = await storage.saveTempFile(Buffer.from('new content'), 'tmp');

    // Manually set mtime on old file to 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(oldFilePath, twoHoursAgo, twoHoursAgo);

    // Purge files older than 1 hour
    const purged = await cleanup.runCleanup(60 * 60 * 1000);
    expect(purged).toBe(1);

    expect(fs.existsSync(oldFilePath)).toBe(false);
    expect(fs.existsSync(newFilePath)).toBe(true);
  });

  it('should start and stop scheduled cleanup without errors', () => {
    expect(() => cleanup.startScheduledCleanup(10000)).not.toThrow();
    expect(() => cleanup.stopScheduledCleanup()).not.toThrow();
  });
});
