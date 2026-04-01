import { logger, createJobLogger } from '../../../src/utils/logger.util';

describe('Logger Utility', () => {
  describe('logger', () => {
    it('should have all log levels', () => {
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should log info messages', () => {
      const logSpy = jest.spyOn(logger, 'info');
      logger.info('Test info message');
      expect(logSpy).toHaveBeenCalledWith('Test info message');
    });

    it('should log error messages', () => {
      const logSpy = jest.spyOn(logger, 'error');
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('createJobLogger', () => {
    const jobId = 'test-job-123';
    const correlationId = 'corr-123';

    it('should create logger with job context', () => {
      const jobLogger = createJobLogger(jobId, correlationId);
      expect(jobLogger).toBeDefined();
      expect(jobLogger.info).toBeDefined();
      expect(jobLogger.error).toBeDefined();
    });

    it('should log with job ID context', () => {
      const jobLogger = createJobLogger(jobId);
      const logSpy = jest.spyOn(logger, 'info');
      
      jobLogger.info('Job started');
      
      expect(logSpy).toHaveBeenCalledWith('Job started', expect.objectContaining({
        jobId,
      }));
    });

    it('should log errors with job context', () => {
      const jobLogger = createJobLogger(jobId);
      const logSpy = jest.spyOn(logger, 'error');
      const error = new Error('Processing failed');
      
      jobLogger.error('Job failed', error);
      
      expect(logSpy).toHaveBeenCalledWith(
        'Job failed',
        expect.objectContaining({
          jobId,
          error: 'Processing failed',
        })
      );
    });
  });
});