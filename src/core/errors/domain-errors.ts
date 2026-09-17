/**
 * Strongly typed domain errors for Document Compressor
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidDocumentFormatError extends DomainError {
  readonly code = 'INVALID_DOCUMENT_FORMAT';
  readonly statusCode = 400;

  constructor(format: string) {
    super(`Unsupported document format: "${format}". Allowed formats are .pdf, .docx, and .doc.`);
  }
}

export class FileSizeExceededError extends DomainError {
  readonly code = 'FILE_SIZE_EXCEEDED';
  readonly statusCode = 413;

  constructor(sizeBytes: number, maxBytes: number) {
    super(`File size (${(sizeBytes / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of ${(maxBytes / (1024 * 1024)).toFixed(2)}MB.`);
  }
}

export class CorruptedDocumentError extends DomainError {
  readonly code = 'CORRUPTED_DOCUMENT';
  readonly statusCode = 400;

  constructor(details?: string) {
    super(`The uploaded document appears to be corrupted or invalid.${details ? ` Details: ${details}` : ''}`);
  }
}

export class PasswordProtectedDocumentError extends DomainError {
  readonly code = 'PASSWORD_PROTECTED_DOCUMENT';
  readonly statusCode = 400;

  constructor() {
    super('The document is password-protected or encrypted and cannot be compressed.');
  }
}

export class CompressionFailedError extends DomainError {
  readonly code = 'COMPRESSION_FAILED';
  readonly statusCode = 500;

  constructor(reason: string) {
    super(`Compression pipeline failed: ${reason}`);
  }
}

export class DocumentNotFoundError extends DomainError {
  readonly code = 'DOCUMENT_NOT_FOUND';
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Document with ID "${id}" was not found.`);
  }
}
