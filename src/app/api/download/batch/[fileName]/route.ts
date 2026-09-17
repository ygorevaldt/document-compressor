import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { DocumentNotFoundError } from '@/core/errors/domain-errors';
import { LocalStorageService } from '@/modules/storage/services/local-storage-service';

const storage = new LocalStorageService();

export async function GET(
  _request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const rawFileName = params.fileName;
    // Sanitize path to prevent traversal attacks
    const sanitized = path.basename(rawFileName);
    const filePath = path.join(storage.getTempDir(), sanitized);

    if (!fs.existsSync(filePath)) {
      throw new DocumentNotFoundError(sanitized);
    }

    const buffer = await fs.promises.readFile(filePath);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="compressed-documents.zip"',
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

    const message = err instanceof Error ? err.message : 'Failed to retrieve batch archive.';
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
