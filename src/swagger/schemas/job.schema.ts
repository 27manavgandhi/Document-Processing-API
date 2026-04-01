export const JobSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    status: {
      type: 'string',
      enum: ['QUEUED', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      example: 'COMPLETED',
    },
    priority: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      example: 'MEDIUM',
    },
    fileName: {
      type: 'string',
      example: 'document.pdf',
    },
    fileMimeType: {
      type: 'string',
      example: 'application/pdf',
    },
    fileSize: {
      type: 'integer',
      example: 2048000,
    },
    fileUrl: {
      type: 'string',
      format: 'uri',
      example: 'https://example.com/document.pdf',
    },
    userId: {
      type: 'string',
      example: 'user-123',
    },
    result: {
      type: 'object',
      nullable: true,
      properties: {
        processedAt: {
          type: 'string',
          format: 'date-time',
        },
        processingTime: {
          type: 'integer',
          example: 15000,
        },
        documentInfo: {
          type: 'object',
        },
        analysis: {
          type: 'object',
        },
      },
    },
    errorMessage: {
      type: 'string',
      nullable: true,
    },
    attempts: {
      type: 'integer',
      example: 1,
    },
    maxAttempts: {
      type: 'integer',
      example: 3,
    },
    processingTime: {
      type: 'integer',
      nullable: true,
      example: 15000,
    },
    timestamps: {
      type: 'object',
      properties: {
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
        },
        queuedAt: {
          type: 'string',
          format: 'date-time',
        },
        startedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        completedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        failedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        cancelledAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
      },
    },
  },
};

export const CreateJobRequestSchema = {
  type: 'object',
  properties: {
    fileUrl: {
      type: 'string',
      format: 'uri',
      example: 'https://example.com/document.pdf',
    },
    fileName: {
      type: 'string',
      example: 'document.pdf',
    },
    userId: {
      type: 'string',
      example: 'user-123',
    },
    priority: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      example: 'MEDIUM',
    },
    webhookUrl: {
      type: 'string',
      format: 'uri',
      example: 'https://webhook.site/unique-id',
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
    },
  },
};

export const CreateJobResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: true,
    },
    data: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          format: 'uuid',
        },
        status: {
          type: 'string',
          example: 'QUEUED',
        },
        priority: {
          type: 'string',
          example: 'MEDIUM',
        },
        message: {
          type: 'string',
          example: 'Job created and queued for processing',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        queuedAt: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
  },
};