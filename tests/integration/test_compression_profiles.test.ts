import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { DocxCompressorEngine } from '@/modules/compression/engines/docx-compressor-engine';
import { COMPRESSION_PROFILES } from '@/modules/compression/profiles/compression-profiles';

describe('Compression Profiles Integration Test', () => {
  it('should achieve smaller size with Maximum profile compared to High Fidelity', async () => {
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx');
    const buffer = fs.readFileSync(fixturePath);

    const engine = new DocxCompressorEngine();

    const maxResult = await engine.compress(buffer, COMPRESSION_PROFILES.maximum);
    const hiFiResult = await engine.compress(buffer, COMPRESSION_PROFILES.high_fidelity);

    // Maximum profile must yield smaller byte size than High Fidelity
    expect(maxResult.compressedSize).toBeLessThan(hiFiResult.compressedSize);

    // Both must remain valid OpenXML documents
    const maxZip = new AdmZip(maxResult.compressedBuffer);
    const hiFiZip = new AdmZip(hiFiResult.compressedBuffer);

    expect(maxZip.getEntry('word/document.xml')).not.toBeNull();
    expect(hiFiZip.getEntry('word/document.xml')).not.toBeNull();
  });
});
