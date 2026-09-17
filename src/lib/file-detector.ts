import path from 'path';
import { DocumentFormat } from '@/core/types/document';
import {
  InvalidDocumentFormatError,
  CorruptedDocumentError,
  PasswordProtectedDocumentError,
} from '@/core/errors/domain-errors';

export interface DetectedDocumentInfo {
  readonly format: DocumentFormat;
  readonly mimeType: string;
}

const MIME_TYPES: Record<DocumentFormat, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
};

/**
 * Validates document buffer, detects format and mimeType from magic bytes,
 * and checks for password protection / corruption.
 */
export function detectDocumentFormat(buffer: Buffer, fileName: string): DetectedDocumentInfo {
  if (!buffer || buffer.length === 0) {
    throw new CorruptedDocumentError('Document is empty (0 bytes).');
  }

  const ext = path.extname(fileName).toLowerCase().replace('.', '');

  // 1. PDF Detection: Magic bytes '%PDF-' (0x25 0x50 0x44 0x46 0x2d)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    // Check for PDF encryption dictionary
    const contentSample = buffer.toString('latin1');
    if (contentSample.includes('/Encrypt')) {
      throw new PasswordProtectedDocumentError();
    }

    return {
      format: 'pdf',
      mimeType: MIME_TYPES.pdf,
    };
  }

  // 2. DOCX Detection: ZIP magic bytes PK\x03\x04 (0x50 0x4B 0x03 0x04)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    const contentSample = buffer.toString('latin1');
    if (contentSample.includes('EncryptedPackage')) {
      throw new PasswordProtectedDocumentError();
    }

    if (ext === 'docx') {
      return {
        format: 'docx',
        mimeType: MIME_TYPES.docx,
      };
    }
  }

  // 3. Legacy DOC Detection: Compound File Binary Format magic bytes (0xD0 0xCF 0x11 0xE0)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return {
      format: 'doc',
      mimeType: MIME_TYPES.doc,
    };
  }

  // If extension is known but headers don't match -> file is corrupted or spoofed
  if (['pdf', 'docx', 'doc'].includes(ext)) {
    throw new CorruptedDocumentError(`File has .${ext} extension but invalid file header or signatures.`);
  }

  // Unknown/unsupported extension
  throw new InvalidDocumentFormatError(ext || 'unknown');
}
