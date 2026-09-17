import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { SqliteCompressionCache } from '@/modules/cache/repositories/sqlite-compression-cache';
import { LocalStorageService } from '@/modules/storage/services/local-storage-service';
import { DocumentNotFoundError } from '@/core/errors/domain-errors';

const cache = new SqliteCompressionCache();
const storage = new LocalStorageService();

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      throw new DocumentNotFoundError('empty-id');
    }

    const entry = await cache.getById(id);
    if (!entry) {
      throw new DocumentNotFoundError(id);
    }

    const buffer = await storage.getCompressedFile(entry.storagePath);
    const contentType = CONTENT_TYPES[entry.fileFormat] || 'application/octet-stream';

    // Construct download filename e.g. "quarterly-report-compressed.pdf"
    const parsed = path.parse(entry.originalName);
    const baseName = parsed.name || 'document';
    const downloadFileName = `${baseName}-compressed.${entry.fileFormat}`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    if (err instanceof DocumentNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: 404 }
      );
    }

    const message = err instanceof Error ? err.message : 'Failed to retrieve download file.';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message,
        },
      },
      { status: 500 }
    );
  }
}
