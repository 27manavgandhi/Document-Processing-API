# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose 2.x
- Node.js 20 LTS
- PostgreSQL 15+
- Redis 7+
- Kubernetes 1.28+ (for production)
- kubectl configured
- Helm 3+ (optional)

## Local Development Deployment

### 1. Clone Repository
```bash
git clone https://github.com/your-org/document-processing-api.git
cd document-processing-api
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your local settings
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Infrastructure
```bash
npm run docker:up
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Redis Commander on port 8081

### 5. Database Setup
```bash
npm run db:generate
npm run db:migrate
```

### 6. Start Development Servers
```bash
# Terminal 1 - API Server
npm run dev

# Terminal 2 - Worker Process
npm run dev:worker
```

### 7. Verify Deployment
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/health/detailed
```

Visit:
- API Docs: http://localhost:3000/api-docs
- Metrics: http://localhost:3000/metrics
- Redis UI: http://localhost:8081

## Docker Compose Deployment

### Production-like Environment
```bash
docker-compose -f docker/docker-compose.yml up -d
```

This starts:
- API Server (3 replicas)
- Worker Process (5 replicas)
- PostgreSQL with persistence
- Redis with persistence
- Redis Commander

### Verify
```bash
docker ps
docker logs document-processing-api
docker logs document-processing-worker
```

## Kubernetes Deployment

### 1. Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets
```bash
# Create secret from env file
kubectl create secret generic document-processing-secrets \
  --from-env-file=.env.production \
  -n document-processing
```

### 3. Apply ConfigMap
```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Deploy Database (if not using managed service)
```bash
# Using Helm for PostgreSQL
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql \
  --namespace document-processing \
  --set auth.postgresPassword=your-password \
  --set primary.persistence.size=20Gi
```

### 5. Deploy Redis
```bash
helm install redis bitnami/redis \
  --namespace document-processing \
  --set auth.enabled=false \
  --set master.persistence.size=10Gi
```

### 6. Deploy Application
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

### 7. Verify Deployment
```bash
kubectl get pods -n document-processing
kubectl get services -n document-processing
kubectl logs -f deployment/document-processing-api -n document-processing
```

### 8. Run Database Migrations
```bash
kubectl exec -it deployment/document-processing-api -n document-processing -- npx prisma migrate deploy
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] Run all tests (`npm run test:all`)
- [ ] Build Docker images
- [ ] Update version tags
- [ ] Review configuration changes
- [ ] Database migration plan ready
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Backup completed

### Deployment Steps
1. **Database Migration** (zero-downtime)
```bash
   # Run migrations before deploying code
   kubectl exec -it deployment/document-processing-api -n document-processing -- npx prisma migrate deploy
```

2. **Deploy API Servers** (rolling update)
```bash
   kubectl set image deployment/document-processing-api \
     api=your-registry/document-processing-api:v1.2.3 \
     -n document-processing
```

3. **Monitor Rollout**
```bash
   kubectl rollout status deployment/document-processing-api -n document-processing
```

4. **Deploy Workers**
```bash
   kubectl set image deployment/document-processing-worker \
     worker=your-registry/document-processing-worker:v1.2.3 \
     -n document-processing
```

5. **Verify Health**
```bash
   kubectl get pods -n document-processing
   curl https://api.your-domain.com/health
```

### Post-Deployment
- [ ] Verify health checks passing
- [ ] Check error rates in monitoring
- [ ] Verify queue processing
- [ ] Test critical API endpoints
- [ ] Monitor resource usage
- [ ] Check logs for errors

## Rollback Procedure

### Quick Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/document-processing-api -n document-processing
kubectl rollout undo deployment/document-processing-worker -n document-processing
```

### Rollback to Specific Version
```bash
kubectl rollout history deployment/document-processing-api -n document-processing
kubectl rollout undo deployment/document-processing-api --to-revision=3 -n document-processing
```

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port

### Optional
- `NODE_ENV` - Environment (development/production)
- `PORT` - API server port (default: 3000)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `JWT_SECRET` - Secret for JWT tokens
- `SENTRY_DSN` - Sentry error tracking DSN

## Monitoring Setup

### Prometheus
```bash
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --set server.service.type=LoadBalancer
```

### Grafana
```bash
helm install grafana grafana/grafana \
  --namespace monitoring \
  --set adminPassword=admin123
```

Import dashboards:
- Node.js Application Metrics
- PostgreSQL Database
- Redis Performance
- BullMQ Queue Metrics

## Backup and Restore

### Database Backup
```bash
# Automated daily backups
kubectl create cronjob postgres-backup \
  --schedule="0 2 * * *" \
  --image=postgres:15-alpine \
  -- pg_dump -h postgres-service -U postgres document_processing > backup.sql
```

### Restore from Backup
```bash
kubectl exec -it postgres-pod -- psql -U postgres -d document_processing -f /backup/backup.sql
```

## Scaling

### Manual Scaling
```bash
# Scale API servers
kubectl scale deployment document-processing-api --replicas=5 -n document-processing

# Scale workers
kubectl scale deployment document-processing-worker --replicas=10 -n document-processing
```

### Auto-Scaling (HPA already configured)
- API: 3-10 replicas based on CPU/memory
- Workers: 5-20 replicas based on CPU

## Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n document-processing
kubectl logs <pod-name> -n document-processing
```

### Database Connection Issues
```bash
# Test connection
kubectl exec -it deployment/document-processing-api -n document-processing -- npx prisma db push --preview-feature
```

### Queue Not Processing
```bash
# Check Redis
kubectl exec -it redis-pod -n document-processing -- redis-cli ping
kubectl logs deployment/document-processing-worker -n document-processing
```

### High Memory Usage
```bash
kubectl top pods -n document-processing
kubectl describe hpa -n document-processing
```

## Security Hardening

1. **Network Policies**
   - Restrict inter-pod communication
   - Allow only necessary ingress/egress

2. **Pod Security**
   - Run as non-root user
   - Read-only root filesystem
   - Drop all capabilities

3. **Secrets Management**
   - Use external secrets operator
   - Rotate secrets regularly
   - Encrypt etcd at rest

4. **TLS/SSL**
   - Force HTTPS on ingress
   - TLS between services
   - Certificate auto-renewal

## Cost Optimization

1. **Resource Requests/Limits**
   - Right-size pod resources
   - Use vertical pod autoscaler

2. **Spot Instances**
   - Use for worker nodes
   - Graceful handling of interruptions

3. **Caching**
   - Maximize cache hit rate
   - Reduce database queries

4. **Auto-Scaling**
   - Scale down during low traffic
   - Schedule scaling for known patterns