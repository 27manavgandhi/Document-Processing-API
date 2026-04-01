import { ValidationError } from '../../utils/errors.util';
import { config } from '../../config';

export class FileSizeValidator {
  static validate(file: Express.Multer.File): void {
    const maxSize = config.upload.maxFileSizeBytes;

    if (!file.size) {
      throw new ValidationError('File size is required');
    }

    if (file.size > maxSize) {
      throw new ValidationError(
        `File size ${this.formatBytes(file.size)} exceeds maximum allowed size of ${this.formatBytes(maxSize)}`
      );
    }

    if (file.size === 0) {
      throw new ValidationError('File is empty');
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isWithinLimit(size: number): boolean {
    return size > 0 && size <= config.upload.maxFileSizeBytes;
  }
}