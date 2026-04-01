export const HealthResponseSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['ok'],
      example: 'ok',
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-01T10:00:00Z',
    },
  },
};

export const DetailedHealthResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: true,
    },
    data: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'degraded', 'unhealthy'],
          example: 'healthy',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
        },
        uptime: {
          type: 'number',
          example: 3600,
        },
        services: {
          type: 'object',
          properties: {
            database: {
              $ref: '#/components/schemas/ServiceStatus',
            },
            redis: {
              $ref: '#/components/schemas/ServiceStatus',
            },
            queue: {
              $ref: '#/components/schemas/ServiceStatus',
            },
          },
        },
      },
    },
  },
};

export const ServiceStatusSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['up', 'down', 'degraded'],
      example: 'up',
    },
    responseTime: {
      type: 'number',
      example: 15,
    },
    message: {
      type: 'string',
    },
    details: {
      type: 'object',
      additionalProperties: true,
    },
  },
};