import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { DocxCompressorEngine } from '@/modules/compression/engines/docx-compressor-engine';
import { CompressionProfileConfig } from '@/core/types/document';

const profileConfig: CompressionProfileConfig = {
  name: 'recommended',
  jpegQuality: 80,
  pngPalette: true,
  xmlDeflateLevel: 9,
  stripMetadata: true,
};

describe('DOCX Compression Integration', () => {
  it('should compress sample.docx and reduce file size while preserving text', async () => {
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
    const originalBuffer = fs.readFileSync(fixturePath);
    const originalSize = originalBuffer.length;

    const engine = new DocxCompressorEngine();
    const result = await engine.compress(originalBuffer, profileConfig);

    expect(result.compressedSize).toBeLessThan(originalSize);
    expect(result.compressedBuffer.length).toBe(result.compressedSize);

    // Verify it is a valid zip and still contains the document text
    const compressedZip = new AdmZip(result.compressedBuffer);
    const docXmlEntry = compressedZip.getEntry('word/document.xml');
    expect(docXmlEntry).not.toBeNull();

    const docXmlText = compressedZip.readAsText('word/document.xml');
    expect(docXmlText).toContain('Hello from sample DOCX document with media!');
  });
});
