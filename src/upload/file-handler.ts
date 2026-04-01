import crypto from 'crypto';
import { createReadStream } from 'fs';
import { logger } from '../utils/logger.util';

interface FileChecksums {
  md5: string;
  sha256: string;
}

export class FileHandler {
  static async generateChecksums(filePath: string): Promise<FileChecksums> {
    return new Promise((resolve, reject) => {
      const md5Hash = crypto.createHash('md5');
      const sha256Hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (chunk) => {
        md5Hash.update(chunk);
        sha256Hash.update(chunk);
      });

      stream.on('end', () => {
        resolve({
          md5: md5Hash.digest('hex'),
          sha256: sha256Hash.digest('hex'),
        });
      });

      stream.on('error', (error) => {
        logger.error('Checksum generation failed', error);
        reject(error);
      });
    });
  }

  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }

  static validateMimeType(mimeType: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    return allowedTypes.includes(mimeType);
  }
}