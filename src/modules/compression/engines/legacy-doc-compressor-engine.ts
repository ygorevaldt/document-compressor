import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ICompressorEngine } from '../contracts';
import { DocumentFormat, CompressionProfileConfig } from '@/core/types/document';
import { CompressionFailedError } from '@/core/errors/domain-errors';
import { DocxCompressorEngine } from './docx-compressor-engine';

const execFileAsync = promisify(execFile);

export class LegacyDocCompressorEngine implements ICompressorEngine {
  readonly supportedFormats: ReadonlyArray<DocumentFormat> = ['doc'];
  private readonly docxEngine = new DocxCompressorEngine();
  private sofficeCmd: string | null = null;
  private sofficeChecked = false;

  private async detectLibreOffice(): Promise<string | null> {
    if (this.sofficeChecked) {
      return this.sofficeCmd;
    }
    this.sofficeChecked = true;

    const candidates = ['soffice', 'libreoffice'];
    for (const cmd of candidates) {
      try {
        await execFileAsync(cmd, ['--version']);
        this.sofficeCmd = cmd;
        return cmd;
      } catch {
        // Continue searching
      }
    }

    this.sofficeCmd = null;
    return null;
  }

  async compress(
    buffer: Buffer,
    config: CompressionProfileConfig
  ): Promise<{ compressedBuffer: Buffer; compressedSize: number }> {
    const soffice = await this.detectLibreOffice();

    if (!soffice) {
      throw new CompressionFailedError(
        'LibreOffice (soffice) is required for legacy .doc processing but is not installed in this environment. Please run inside the container or upload in modern .docx format.'
      );
    }

    const tempDir = os.tmpdir();
    const tempIn = path.join(tempDir, `doc-in-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.doc`);
    const convertedDocx = path.join(tempDir, path.basename(tempIn, '.doc') + '.docx');
    const tempOut = path.join(tempDir, `doc-out-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.doc`);

    await fs.promises.writeFile(tempIn, buffer);

    try {
      // 1. Convert .doc -> .docx via LibreOffice
      await execFileAsync(soffice, ['--headless', '--convert-to', 'docx', '--outdir', tempDir, tempIn]);

      if (!fs.existsSync(convertedDocx)) {
        throw new Error('LibreOffice failed to convert .doc to .docx');
      }

      const docxBuffer = await fs.promises.readFile(convertedDocx);

      // 2. Compress the DOCX using our DocxCompressorEngine
      const compressedDocxResult = await this.docxEngine.compress(docxBuffer, config);
      await fs.promises.writeFile(convertedDocx, compressedDocxResult.compressedBuffer);

      // 3. Convert back to .doc
      await execFileAsync(soffice, ['--headless', '--convert-to', 'doc', '--outdir', tempDir, convertedDocx]);

      const outputDocPath = path.join(tempDir, path.basename(convertedDocx, '.docx') + '.doc');
      const compressedBuffer = await fs.promises.readFile(outputDocPath);

      return {
        compressedBuffer,
        compressedSize: compressedBuffer.length,
      };
    } finally {
      await Promise.all([
        fs.promises.unlink(tempIn).catch(() => {}),
        fs.promises.unlink(convertedDocx).catch(() => {}),
        fs.promises.unlink(tempOut).catch(() => {}),
      ]);
    }
  }
}
