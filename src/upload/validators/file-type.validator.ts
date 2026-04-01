import { ValidationError } from '../../utils/errors.util';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
];

export class FileTypeValidator {
  static validate(file: Express.Multer.File): void {
    if (!file.mimetype) {
      throw new ValidationError('File MIME type is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new ValidationError(
        `File type ${file.mimetype} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }
  }

  static isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.includes(mimeType);
  }

  static validateExtension(fileName: string): void {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

    if (!allowedExtensions.includes(ext)) {
      throw new ValidationError(
        `File extension ${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}`
      );
    }
  }
}