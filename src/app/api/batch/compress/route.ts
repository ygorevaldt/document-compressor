import { NextRequest, NextResponse } from 'next/server';
import { BatchCompressionService } from '@/modules/compression/services/batch-compression-service';
import { CompressionProfileName, DocumentFormat } from '@/core/types/document';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const batchService = new BatchCompressionService();
const MAX_BATCH_FILES = 10;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const profile = (formData.get('profile') as CompressionProfileName) || 'recommended';

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'No files uploaded in "files" field.',
          },
        },
        { status: 400 }
      );
    }

    if (files.length > MAX_BATCH_FILES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BATCH_SIZE_EXCEEDED',
            message: `Batch size exceeds limit of ${MAX_BATCH_FILES} files per request.`,
          },
        },
        { status: 400 }
      );
    }

    const items = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = file.name || 'document';
        const extMatch = fileName.match(/\.([0-9a-z]+)$/i);
        const format = (extMatch ? extMatch[1].toLowerCase() : '') as DocumentFormat;

        return {
          fileName,
          format,
          buffer,
        };
      })
    );

    const result = await batchService.processBatch(items, profile);

    return NextResponse.json({
      success: true,
      data: {
        batchId: result.batchId,
        totalFiles: result.totalFiles,
        totalOriginalBytes: result.totalOriginalBytes,
        totalCompressedBytes: result.totalCompressedBytes,
        totalBytesSaved: result.totalBytesSaved,
        overallReductionPercentage: result.overallReductionPercentage,
        zipDownloadUrl: result.zipDownloadUrl,
        items: result.items,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Batch compression pipeline failed.';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BATCH_FAILED',
          message,
        },
      },
      { status: 500 }
    );
  }
}
