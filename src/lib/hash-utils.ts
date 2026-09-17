import crypto from 'crypto';
import { Readable } from 'stream';

/**
 * Computes SHA-256 hash of a buffer
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Computes SHA-256 hash from a readable stream
 */
export async function calculateSha256FromStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}
