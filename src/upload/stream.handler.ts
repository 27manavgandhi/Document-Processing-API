import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { logger } from '../utils/logger.util';

export class StreamHandler {
  static async streamFile(
    sourcePath: string,
    destinationPath: string
  ): Promise<void> {
    try {
      const readStream = createReadStream(sourcePath);
      const writeStream = createWriteStream(destinationPath);

      await pipeline(readStream, writeStream);

      logger.info('File streamed successfully', {
        source: sourcePath,
        destination: destinationPath,
      });
    } catch (error) {
      logger.error('File streaming failed', error as Error, {
        source: sourcePath,
        destination: destinationPath,
      });
      throw error;
    }
  }

  static async streamWithTransform(
    sourcePath: string,
    destinationPath: string,
    transformFn: (chunk: Buffer) => Buffer
  ): Promise<void> {
    try {
      const readStream = createReadStream(sourcePath);
      const writeStream = createWriteStream(destinationPath);

      readStream.on('data', (chunk: Buffer) => {
        const transformed = transformFn(chunk);
        writeStream.write(transformed);
      });

      await new Promise<void>((resolve, reject) => {
        readStream.on('end', () => {
          writeStream.end();
          resolve();
        });
        readStream.on('error', reject);
        writeStream.on('error', reject);
      });

      logger.info('File streamed with transform', {
        source: sourcePath,
        destination: destinationPath,
      });
    } catch (error) {
      logger.error('File streaming with transform failed', error as Error);
      throw error;
    }
  }

  static createChunkProcessor(
    chunkSize: number = 1024 * 1024
  ): (filePath: string, processor: (chunk: Buffer) => Promise<void>) => Promise<void> {
    return async (filePath: string, processor: (chunk: Buffer) => Promise<void>) => {
      const stream = createReadStream(filePath, { highWaterMark: chunkSize });

      for await (const chunk of stream) {
        await processor(chunk as Buffer);
      }
    };
  }
}