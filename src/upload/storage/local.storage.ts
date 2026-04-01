import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../../utils/logger.util';

export class LocalStorage {
  private uploadDir: string;

  constructor(uploadDir: string = './uploads') {
    this.uploadDir = uploadDir;
  }

  async save(file: Express.Multer.File, fileName: string): Promise<string> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });

      const filePath = path.join(this.uploadDir, fileName);
      await fs.copyFile(file.path, filePath);

      logger.info('File saved to local storage', { fileName, filePath });

      return filePath;
    } catch (error) {
      logger.error('Failed to save file to local storage', error as Error, { fileName });
      throw error;
    }
  }

  async get(fileName: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      const data = await fs.readFile(filePath);

      logger.debug('File retrieved from local storage', { fileName });

      return data;
    } catch (error) {
      logger.error('Failed to get file from local storage', error as Error, { fileName });
      throw error;
    }
  }

  async delete(fileName: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);

      logger.info('File deleted from local storage', { fileName });
    } catch (error) {
      logger.error('Failed to delete file from local storage', error as Error, { fileName });
      throw error;
    }
  }

  async exists(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const localStorage = new LocalStorage();