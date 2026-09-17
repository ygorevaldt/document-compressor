import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { detectDocumentFormat } from '@/lib/file-detector';
import {
  CorruptedDocumentError,
  PasswordProtectedDocumentError,
  InvalidDocumentFormatError,
} from '@/core/errors/domain-errors';

describe('File Detector Unit Tests', () => {
  it('should detect valid PDF format', () => {
    const fixture = fs.readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'minimal.pdf'));
    const detected = detectDocumentFormat(fixture, 'test.pdf');
    expect(detected.format).toBe('pdf');
    expect(detected.mimeType).toBe('application/pdf');
  });

  it('should detect valid DOCX format', () => {
    const fixture = fs.readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'sample.docx'));
    const detected = detectDocumentFormat(fixture, 'test.docx');
    expect(detected.format).toBe('docx');
    expect(detected.mimeType).toContain('wordprocessingml');
  });

  it('should throw CorruptedDocumentError on empty buffer', () => {
    expect(() => detectDocumentFormat(Buffer.alloc(0), 'empty.pdf')).toThrow(
      CorruptedDocumentError
    );
  });

  it('should throw CorruptedDocumentError on corrupted header', () => {
    const fixture = fs.readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'corrupted.pdf'));
    expect(() => detectDocumentFormat(fixture, 'corrupted.pdf')).toThrow(
      CorruptedDocumentError
    );
  });

  it('should throw PasswordProtectedDocumentError on encrypted PDF', () => {
    const fixture = fs.readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'encrypted.pdf'));
    expect(() => detectDocumentFormat(fixture, 'encrypted.pdf')).toThrow(
      PasswordProtectedDocumentError
    );
  });

  it('should throw InvalidDocumentFormatError on unsupported format', () => {
    const dummyTxt = Buffer.from('plain text content');
    expect(() => detectDocumentFormat(dummyTxt, 'notes.txt')).toThrow(
      InvalidDocumentFormatError
    );
  });
});
