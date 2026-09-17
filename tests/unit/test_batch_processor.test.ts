import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { CompressionService } from '@/modules/compression/services/compression-service';
import { BatchCompressionService } from '@/modules/compression/services/batch-compression-service';

describe('BatchCompressionService Unit Tests', () => {
  let batchService: BatchCompressionService;

  beforeEach(() => {
    const compressionService = new CompressionService();
    batchService = new BatchCompressionService({ compressionService });
  });

  it('should process mixed batch with error isolation and in-memory zip bundling', async () => {
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
    expect(pdfItem?.base64).toBeDefined();
    expect(docxItem?.status).toBe('completed');
    expect(docxItem?.base64).toBeDefined();
    expect(corruptItem?.status).toBe('failed');
    expect(corruptItem?.error).toBeDefined();

    // Aggregates
    expect(batchResult.totalOriginalBytes).toBeGreaterThan(0);
    expect(batchResult.totalCompressedBytes).toBeLessThan(batchResult.totalOriginalBytes);
    expect(batchResult.totalBytesSaved).toBe(
      batchResult.totalOriginalBytes - batchResult.totalCompressedBytes
    );
    expect(batchResult.overallReductionPercentage).toBeGreaterThan(0);

    // Zip bundle in-memory
    expect(batchResult.zipBuffer).toBeDefined();
    expect(batchResult.zipBase64).toBeDefined();
    const zip = new AdmZip(batchResult.zipBuffer);
    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries).toContain('doc1-compressed.pdf');
    expect(entries).toContain('doc2-compressed.docx');
    expect(entries).not.toContain('corrupted-compressed.pdf');
  });
});

