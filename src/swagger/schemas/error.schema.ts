export const ErrorSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: false,
    },
    error: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Validation failed',
        },
        code: {
          type: 'string',
          example: 'VALIDATION_ERROR',
        },
        details: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
    meta: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T10:00:00Z',
        },
        correlationId: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
  },
};

export const ValidationErrorSchema = {
  ...ErrorSchema,
  example: {
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: {
        fileUrl: 'Invalid URL format',
      },
    },
    meta: {
      timestamp: '2024-01-01T10:00:00Z',
    },
  },
};

export const NotFoundErrorSchema = {
  ...ErrorSchema,
  example: {
    success: false,
    error: {
      message: "Job with identifier '123' not found",
      code: 'NOT_FOUND',
    },
    meta: {
      timestamp: '2024-01-01T10:00:00Z',
    },
  },
};

export const RateLimitErrorSchema = {
  ...ErrorSchema,
  example: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'TOO_MANY_REQUESTS',
    },
    meta: {
      timestamp: '2024-01-01T10:00:00Z',
    },
  },
};