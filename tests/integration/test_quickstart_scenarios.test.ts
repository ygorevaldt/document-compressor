import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { CompressionService } from '@/modules/compression/services/compression-service';
import { BatchCompressionService } from '@/modules/compression/services/batch-compression-service';

describe('Quickstart End-to-End Validation Scenarios', () => {
  let compressionService: CompressionService;
  let batchService: BatchCompressionService;

  beforeEach(() => {
    compressionService = new CompressionService();
    batchService = new BatchCompressionService({ compressionService });
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
    expect(result.compressedBuffer).toBeDefined();
    expect(result.compressedBuffer.length).toBe(result.compressedSize);
  });

  it('Scenario 2: In-Memory Stateless Flow with Valid Base64 Serialization', async () => {
    const docxPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
    const originalBuffer = fs.readFileSync(docxPath);

    const result = await compressionService.processDocument({
      fileName: 'sample.docx',
      format: 'docx',
      buffer: originalBuffer,
      profile: 'recommended',
    });

    const base64 = result.compressedBuffer.toString('base64');
    expect(base64).toBeDefined();
    expect(base64.length).toBeGreaterThan(0);

    const decoded = Buffer.from(base64, 'base64');
    expect(decoded.length).toBe(result.compressedSize);
  });

  it('Scenario 3: Batch Document Flow with Aggregate Reduction & In-Memory ZIP Bundle', async () => {
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
    expect(batch.zipBase64).toBeDefined();

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

