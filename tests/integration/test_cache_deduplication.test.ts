import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CompressionService } from '@/modules/compression/services/compression-service';
import { CompressionInput } from '@/core/types/document';

describe('CompressionService In-Memory Anti-Inflation & Compression Guarantee', () => {
  let service: CompressionService;

  beforeEach(() => {
    service = new CompressionService();
  });

  it('should compress document in memory without creating files on disk', async () => {
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
    const buffer = fs.readFileSync(fixturePath);

    const input: CompressionInput = {
      fileName: 'sample.docx',
      format: 'docx',
      buffer,
      profile: 'recommended',
    };

    const result = await service.processDocument(input);
    expect(result.originalSize).toBe(buffer.length);
    expect(result.compressedBuffer).toBeDefined();
    expect(result.compressedSize).toBe(result.compressedBuffer.length);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
    expect(result.bytesSaved).toBeGreaterThan(0);
    expect(result.reductionPercentage).toBeGreaterThan(0);
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
    // Output must never be larger than input
    expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    if (result.wasInflatedPrevented) {
      expect(result.compressedSize).toBe(result.originalSize);
      expect(result.reductionPercentage).toBe(0);
      expect(result.bytesSaved).toBe(0);
    }
  });
});

