import AdmZip from 'adm-zip';
import sharp from 'sharp';
import path from 'path';
import { ICompressorEngine } from '../contracts';
import { DocumentFormat, CompressionProfileConfig } from '@/core/types/document';
import { CompressionFailedError } from '@/core/errors/domain-errors';

export class DocxCompressorEngine implements ICompressorEngine {
  readonly supportedFormats: ReadonlyArray<DocumentFormat> = ['docx'];

  async compress(
    buffer: Buffer,
    config: CompressionProfileConfig
  ): Promise<{ compressedBuffer: Buffer; compressedSize: number }> {
    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const outputZip = new AdmZip();

      for (const entry of entries) {
        // Prevent processing directory entries
        if (entry.isDirectory) {
          continue;
        }

        const entryName = entry.entryName;
        const ext = path.extname(entryName).toLowerCase();
        let entryData = entry.getData();

        // Optimize embedded media in word/media/
        if (entryName.startsWith('word/media/')) {
          if (['.jpg', '.jpeg'].includes(ext)) {
            try {
              let pipeline = sharp(entryData);
              if (config.name === 'maximum') {
                // Resize if oversized on maximum compression
                pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
              }
              const optimized = await pipeline
                .jpeg({
                  quality: config.jpegQuality,
                  mozjpeg: true,
                })
                .toBuffer();

              if (optimized.length < entryData.length) {
                entryData = optimized;
              }
            } catch {
              // Keep original image if sharp cannot process
            }
          } else if (ext === '.png') {
            try {
              let pipeline = sharp(entryData);
              if (config.name === 'maximum') {
                pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
              }
              const optimized = await pipeline
                .png({
                  quality: config.jpegQuality,
                  palette: config.pngPalette,
                  compressionLevel: 9,
                })
                .toBuffer();

              if (optimized.length < entryData.length) {
                entryData = optimized;
              }
            } catch {
              // Keep original image if sharp cannot process
            }
          }
        }

        // Add file to output zip with maximum compression
        outputZip.addFile(entryName, entryData);
      }

      const compressedBuffer = outputZip.toBuffer();
      return {
        compressedBuffer,
        compressedSize: compressedBuffer.length,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new CompressionFailedError(`DOCX compression failed: ${message}`);
    }
  }
}
