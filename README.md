# Document Processing API

Enterprise-grade asynchronous document processing system built with Node.js, TypeScript, PostgreSQL, Redis, and BullMQ.

## Features

- ✅ Asynchronous job processing with queue architecture
- ✅ Multiple concurrent job handling
- ✅ Automatic retry with exponential backoff
- ✅ Real-time job status tracking
- ✅ Webhook callbacks on completion
- ✅ Rate limiting and security hardening
- ✅ Comprehensive logging and monitoring
- ✅ Docker containerization
- ✅ Production-ready architecture

## Tech Stack

- **Runtime**: Node.js 20.x LTS
- **Language**: TypeScript 5.x
- **Framework**: Express.js
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache/Queue**: Redis 7 with BullMQ
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js >= 20.0.0
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

## Quick Start

### 1. Clone and Install
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Start Infrastructure
```bash
npm run docker:up
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Redis Commander UI on port 8081

### 4. Database Setup
```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Development Servers

Terminal 1 - API Server:
```bash
npm run dev
```

Terminal 2 - Worker Process:
```bash
npm run dev:worker
```

## API Endpoints

### Health Check
```bash
GET /health
GET /api/v1/health/detailed
```

### Job Management
```bash
# Create job with file upload
POST /api/v1/jobs
Content-Type: multipart/form-data
Body: file, userId (optional), webhookUrl (optional)

# Create job with URL
POST /api/v1/jobs
Content-Type: application/json
Body: { "fileUrl": "https://example.com/doc.pdf", "userId": "user123" }

# Get job status
GET /api/v1/jobs/:jobId

# List jobs
GET /api/v1/jobs?page=1&limit=10&status=COMPLETED&userId=user123
```

## Testing

### Create a Job
```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -F "file=@/path/to/document.pdf" \
  -F "userId=test-user"
```

### Check Job Status
```bash
curl http://localhost:3000/api/v1/jobs/{jobId}
```

### List Jobs
```bash
curl "http://localhost:3000/api/v1/jobs?page=1&limit=10"
```

## Architecture
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│  API Server  │─────▶│  PostgreSQL │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Redis     │
                     │   (Queue)    │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Worker     │
                     │   Process    │
                     └──────────────┘
```

## Project Structure
```
src/
├── config/          # Configuration management
├── controllers/     # HTTP request handlers
├── services/        # Business logic
├── workers/         # Background job processors
├── queues/          # Queue management
├── middleware/      # Express middleware
├── validators/      # Input validation schemas
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── routes/          # API route definitions
├── app.ts           # Express app setup
├── server.ts        # HTTP server
└── worker.ts        # Worker process entry point
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`: Redis server host
- `REDIS_PORT`: Redis server port
- `PORT`: API server port
- `QUEUE_CONCURRENCY`: Number of concurrent workers
- `LOG_LEVEL`: Logging level (debug|info|warn|error)

## Scripts
```bash
npm run dev              # Start API server in dev mode
npm run dev:worker       # Start worker in dev mode
npm run build            # Build TypeScript to JavaScript
npm run start            # Start production API server
npm run start:worker     # Start production worker
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run db:migrate       # Run database migrations
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:logs      # View Docker logs
```

## Docker Deployment

Build and run with Docker:
```bash
docker-compose -f docker/docker-compose.yml up -d
```

This starts:
- PostgreSQL
- Redis
- API Server (port 3000)
- Worker Process

## Monitoring

- **Logs**: Check `logs/` directory
- **Redis UI**: http://localhost:8081
- **Health Check**: http://localhost:3000/api/v1/health/detailed

## Security Features

- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/min per IP)
- Input validation with Zod
- SQL injection prevention (Prisma)
- File upload validation

## Performance

- Connection pooling (PostgreSQL & Redis)
- Job queue with BullMQ
- Configurable concurrency
- Exponential backoff retry
- Graceful shutdown handling

## License

MIT