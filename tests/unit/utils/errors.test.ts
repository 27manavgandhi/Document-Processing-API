import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
  ServiceUnavailableError,
  JobProcessingError,
} from '../../../src/utils/errors.util';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an app error with default status code', () => {
      const error = new AppError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should create an app error with custom status code', () => {
      const error = new AppError('Bad request', 400, 'BAD_REQUEST');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('NotFoundError', () => {
    it('should create a not found error with identifier', () => {
      const error = new NotFoundError('Job', '123');

      expect(error.message).toBe("Job with identifier '123' not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create a not found error without identifier', () => {
      const error = new NotFoundError('Resource');

      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an unauthorized error', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create a forbidden error', () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
    });
  });

  describe('TooManyRequestsError', () => {
    it('should create a rate limit error', () => {
      const error = new TooManyRequestsError();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create a service unavailable error', () => {
      const error = new ServiceUnavailableError('Database');

      expect(error.message).toBe('Service Database is currently unavailable');
      expect(error.statusCode).toBe(503);
    });
  });

  describe('JobProcessingError', () => {
    it('should create a job processing error', () => {
      const error = new JobProcessingError('Processing failed', 'job-123');

      expect(error.message).toBe('Processing failed');
      expect(error.details).toEqual({ jobId: 'job-123' });
    });
  });
});