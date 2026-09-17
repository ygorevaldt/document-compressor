import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { PdfCompressorEngine } from '@/modules/compression/engines/pdf-compressor-engine';
import { CompressionProfileConfig } from '@/core/types/document';

const profileConfig: CompressionProfileConfig = {
  name: 'recommended',
  jpegQuality: 80,
  pngPalette: true,
  xmlDeflateLevel: 9,
  stripMetadata: true,
};

describe('PDF Compression Integration', () => {
  it('should compress image-sample.pdf and maintain valid PDF structure', async () => {
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'image-sample.pdf');
    const originalBuffer = fs.readFileSync(fixturePath);

    const engine = new PdfCompressorEngine();
    const result = await engine.compress(originalBuffer, profileConfig);

    expect(result.compressedBuffer).toBeDefined();
    expect(result.compressedSize).toBe(result.compressedBuffer.length);

    // Verify it is a valid PDF
    const originalDoc = await PDFDocument.load(originalBuffer);
    const compressedDoc = await PDFDocument.load(result.compressedBuffer);

    // 100% page preservation
    expect(compressedDoc.getPageCount()).toBe(originalDoc.getPageCount());
  });

  it('should preserve page count and integrity on minimal.pdf', async () => {
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'minimal.pdf');
    const originalBuffer = fs.readFileSync(fixturePath);

    const engine = new PdfCompressorEngine();
    const result = await engine.compress(originalBuffer, profileConfig);

    expect(result.compressedBuffer).toBeDefined();
    const compressedDoc = await PDFDocument.load(result.compressedBuffer);
    expect(compressedDoc.getPageCount()).toBe(1);
  });
});
