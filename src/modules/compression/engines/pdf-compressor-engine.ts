import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { PDFDocument, PDFRawStream, PDFName, PDFNumber, PDFArray } from 'pdf-lib';
import sharp from 'sharp';
import { ICompressorEngine } from '../contracts';
import { DocumentFormat, CompressionProfileConfig } from '@/core/types/document';
import { CompressionFailedError } from '@/core/errors/domain-errors';

const execFileAsync = promisify(execFile);

interface GhostscriptRunner {
  type: 'native' | 'docker';
  command: string;
}

export class PdfCompressorEngine implements ICompressorEngine {
  readonly supportedFormats: ReadonlyArray<DocumentFormat> = ['pdf'];

  private gsRunner: GhostscriptRunner | null = null;
  private gsChecked = false;

  private async detectGhostscript(): Promise<GhostscriptRunner | null> {
    if (this.gsChecked) {
      return this.gsRunner;
    }
    this.gsChecked = true;

    // 1. Check for native Ghostscript installation
    const candidates = ['gs', 'gswin64c', 'gswin32c'];
    for (const cmd of candidates) {
      try {
        await execFileAsync(cmd, ['--version']);
        this.gsRunner = { type: 'native', command: cmd };
        return this.gsRunner;
      } catch {
        // Not found, try next
      }
    }

    // 2. Check for Docker Ghostscript runner
    try {
      await execFileAsync('docker', ['--version']);
      this.gsRunner = { type: 'docker', command: 'docker' };
      return this.gsRunner;
    } catch {
      // Docker not available
    }

    this.gsRunner = null;
    return null;
  }

  async compress(
    buffer: Buffer,
    config: CompressionProfileConfig
  ): Promise<{ compressedBuffer: Buffer; compressedSize: number }> {
    try {
      const gs = await this.detectGhostscript();
      if (gs) {
        try {
          return await this.compressWithGhostscript(gs, buffer, config);
        } catch {
          // Fall back to pure Node pipeline on Ghostscript error
        }
      }

      return await this.compressWithPdfLib(buffer, config);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new CompressionFailedError(`PDF compression failed: ${message}`);
    }
  }

  /**
   * Primary Ghostscript + QPDF pipeline for Docker / server runtime or host Docker runner
   */
  private async compressWithGhostscript(
    runner: GhostscriptRunner,
    buffer: Buffer,
    config: CompressionProfileConfig
  ): Promise<{ compressedBuffer: Buffer; compressedSize: number }> {
    const tempDir = os.tmpdir();
    const tempInName = `gs-in-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.pdf`;
    const tempOutName = `gs-out-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.pdf`;
    const tempIn = path.join(tempDir, tempInName);
    const tempOut = path.join(tempDir, tempOutName);

    await fs.promises.writeFile(tempIn, buffer);

    try {
      const pdfSetting =
        config.name === 'maximum'
          ? '/screen'
          : config.name === 'high_fidelity'
          ? '/prepress'
          : '/ebook';

      const dpi = config.imageDpi || (config.name === 'maximum' ? 72 : config.name === 'high_fidelity' ? 300 : 150);

      if (runner.type === 'docker') {
        const containerIn = `/work/${tempInName}`;
        const containerOut = `/work/${tempOutName}`;
        const mount = `${tempDir}:/work`;

        const args = [
          'run',
          '--rm',
          '-v',
          mount,
          'minidocks/ghostscript',
          'gs',
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          `-dPDFSETTINGS=${pdfSetting}`,
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dDetectDuplicateImages=true',
          '-dCompressFonts=true',
          `-dColorImageResolution=${dpi}`,
          `-dGrayImageResolution=${dpi}`,
          `-sOutputFile=${containerOut}`,
          containerIn,
        ];

        await execFileAsync('docker', args);
      } else {
        const args = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          `-dPDFSETTINGS=${pdfSetting}`,
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dDetectDuplicateImages=true',
          '-dCompressFonts=true',
          `-dColorImageResolution=${dpi}`,
          `-dGrayImageResolution=${dpi}`,
          `-sOutputFile=${tempOut}`,
          tempIn,
        ];

        await execFileAsync(runner.command, args);
      }

      const compressedBuffer = await fs.promises.readFile(tempOut);
      return {
        compressedBuffer,
        compressedSize: compressedBuffer.length,
      };
    } finally {
      // Cleanup temporary files
      await Promise.all([
        fs.promises.unlink(tempIn).catch(() => {}),
        fs.promises.unlink(tempOut).catch(() => {}),
      ]);
    }
  }

  /**
   * Pure Node.js & TypeScript pipeline using pdf-lib and sharp
   */
  private async compressWithPdfLib(
    buffer: Buffer,
    config: CompressionProfileConfig
  ): Promise<{ compressedBuffer: Buffer; compressedSize: number }> {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    // Strip metadata if enabled
    if (config.stripMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('Document Compressor');
      pdfDoc.setCreator('Document Compressor');
    }

    // Inspect and optimize embedded image streams
    const context = pdfDoc.context;
    const objects = context.enumerateIndirectObjects();

    for (const [ref, obj] of objects) {
      if (obj instanceof PDFRawStream) {
        const dict = obj.dict;
        const subtype = dict.get(PDFName.of('Subtype'));
        const filter = dict.get(PDFName.of('Filter'));

        const isDct =
          filter === PDFName.of('DCTDecode') ||
          (filter instanceof PDFArray && filter.asArray().some((f) => f === PDFName.of('DCTDecode')));

        if (subtype === PDFName.of('Image') && isDct) {
          try {
            const rawImageData = Buffer.from(obj.getContents());
            let pipeline = sharp(rawImageData);

            if (config.name === 'maximum') {
              pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
            }

            const optimizedImage = await pipeline
              .jpeg({
                quality: config.jpegQuality,
                mozjpeg: true,
              })
              .toBuffer();

            if (optimizedImage.length < rawImageData.length) {
              const uint8Array = new Uint8Array(optimizedImage);
              dict.set(PDFName.of('Length'), PDFNumber.of(uint8Array.length));
              const newStream = PDFRawStream.of(dict, uint8Array);
              context.assign(ref, newStream);
            }
          } catch {
            // Ignore unparseable image stream and continue
          }
        }
      }
    }

    const savedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const compressedBuffer = Buffer.from(savedBytes);
    return {
      compressedBuffer,
      compressedSize: compressedBuffer.length,
    };
  }
}
