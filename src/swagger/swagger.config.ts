import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Document Processing API',
      version: '1.0.0',
      description: 'Enterprise-grade asynchronous document processing system',
      contact: {
        name: 'API Support',
        email: '27manavgandhi@gmail.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.documentprocessing.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Jobs',
        description: 'Job management endpoints',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            status: {
              type: 'string',
              enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
              example: 'QUEUED',
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
              example: 2048,
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
            },
            errorMessage: {
              type: 'string',
              nullable: true,
            },
            attempts: {
              type: 'integer',
              example: 0,
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
          },
        },
        CreateJobRequest: {
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
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
                code: {
                  type: 'string',
                },
                details: {
                  type: 'object',
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                correlationId: {
                  type: 'string',
                },
              },
            },
          },
        },
        Error: {
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
                },
                code: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);