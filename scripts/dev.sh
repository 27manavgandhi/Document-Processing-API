#!/bin/bash

set -e

echo "🚀 Starting Document Processing API in Development Mode"
echo "======================================================="

echo ""
echo "🔍 Checking if Docker services are running..."
if ! docker ps | grep -q "doc-processing-db"; then
    echo "⚠️  PostgreSQL not running. Starting Docker services..."
    docker-compose -f docker/docker-compose.yml up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 10
fi

echo ""
echo "✅ Docker services are running"

echo ""
echo "🗄️  Checking database..."
npx prisma generate
npx prisma migrate deploy

echo ""
echo "🎯 Starting development servers..."
echo ""
echo "Terminal 1: API Server"
echo "Terminal 2: Worker Process"
echo ""

trap 'kill 0' EXIT

npm run dev &
API_PID=$!

sleep 3

npm run dev:worker &
WORKER_PID=$!

echo ""
echo "✅ Services started!"
echo ""
echo "📍 API Server: http://localhost:3000"
echo "📍 API Docs: http://localhost:3000/api-docs"
echo "📍 Queue Dashboard: http://localhost:3000/admin/queues"
echo "📍 Metrics: http://localhost:3000/metrics"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait