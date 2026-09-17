import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DocxCompressorEngine } from '@/modules/compression/engines/docx-compressor-engine';
import { PdfCompressorEngine } from '@/modules/compression/engines/pdf-compressor-engine';
import { CompressionProfileConfig } from '@/core/types/document';

const testConfig: CompressionProfileConfig = {
  name: 'recommended',
  jpegQuality: 80,
  pngPalette: true,
  xmlDeflateLevel: 9,
  stripMetadata: true,
};

describe('ICompressorEngine Contracts', () => {
  describe('DocxCompressorEngine', () => {
    it('should implement ICompressorEngine interface and support docx', async () => {
      const engine = new DocxCompressorEngine();
      expect(engine.supportedFormats).toContain('docx');

      const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
      const buffer = fs.readFileSync(fixturePath);

      const result = await engine.compress(buffer, testConfig);
      expect(result).toHaveProperty('compressedBuffer');
      expect(result).toHaveProperty('compressedSize');
      expect(Buffer.isBuffer(result.compressedBuffer)).toBe(true);
      expect(result.compressedSize).toBe(result.compressedBuffer.length);
    });
  });

  describe('PdfCompressorEngine', () => {
    it('should implement ICompressorEngine interface and support pdf', async () => {
      const engine = new PdfCompressorEngine();
      expect(engine.supportedFormats).toContain('pdf');

      const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'minimal.pdf');
      const buffer = fs.readFileSync(fixturePath);

      const result = await engine.compress(buffer, testConfig);
      expect(result).toHaveProperty('compressedBuffer');
      expect(result).toHaveProperty('compressedSize');
      expect(Buffer.isBuffer(result.compressedBuffer)).toBe(true);
      expect(result.compressedSize).toBe(result.compressedBuffer.length);
    });
  });
});
