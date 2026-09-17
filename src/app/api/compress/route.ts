import { NextRequest, NextResponse } from 'next/server';
import { CompressionService } from '@/modules/compression/services/compression-service';
import { CompressionProfileName, DocumentFormat } from '@/core/types/document';
import { DomainError } from '@/core/errors/domain-errors';

import { getMimeType } from '@/lib/utils';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const compressionService = new CompressionService();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const profile = (formData.get('profile') as CompressionProfileName) || 'recommended';

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'No file was uploaded in the form-data "file" field.',
          },
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initial extension detection (file detector validates actual magic bytes)
    const fileName = file.name || 'document';
    const extMatch = fileName.match(/\.([0-9a-z]+)$/i);
    const rawFormat = (extMatch ? extMatch[1].toLowerCase() : '') as DocumentFormat;

    const result = await compressionService.processDocument({
      fileName,
      format: rawFormat,
      buffer,
      profile,
    });

    const mimeType = getMimeType(rawFormat);
    const base64 = result.compressedBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        jobId: result.jobId,
        fileName,
        format: rawFormat,
        mimeType,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        bytesSaved: result.bytesSaved,
        reductionPercentage: result.reductionPercentage,
        wasCached: result.wasCached,
        wasInflatedPrevented: result.wasInflatedPrevented,
        executionDurationMs: result.executionDurationMs,
        base64,
        downloadUrl: '',
      },
    });
  } catch (err: unknown) {
    if (err instanceof DomainError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'COMPRESSION_FAILED',
          message,
        },
      },
      { status: 500 }
    );
  }
}
