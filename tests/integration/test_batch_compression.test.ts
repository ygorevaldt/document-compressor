import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CompressionService } from '@/modules/compression/services/compression-service';
import { BatchCompressionService } from '@/modules/compression/services/batch-compression-service';

describe('Batch Compression Integration', () => {
  let batchService: BatchCompressionService;

  beforeEach(() => {
    const compressionService = new CompressionService();
    batchService = new BatchCompressionService({ compressionService });
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
    expect(result.zipBuffer).toBeDefined();
    expect(result.zipBase64).toBeDefined();
  });
});

