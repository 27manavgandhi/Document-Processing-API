#!/bin/bash

set -e

echo "🚀 Document Processing API - Setup Script"
echo "=========================================="

echo ""
echo "📦 Step 1: Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20 or higher required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

echo ""
echo "📦 Step 2: Installing dependencies..."
npm install

echo ""
echo "📦 Step 3: Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    echo "⚠️  .env already exists, skipping..."
fi

echo ""
echo "🐳 Step 4: Starting Docker services..."
docker-compose -f docker/docker-compose.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🗄️  Step 5: Setting up database..."
npx prisma generate
npx prisma migrate deploy

echo ""
echo "🌱 Step 6: Seeding database (optional)..."
npm run db:seed || echo "⚠️  Seeding skipped or failed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Review .env file and update if needed"
echo "  2. Run 'npm run dev' to start API server"
echo "  3. Run 'npm run dev:worker' in another terminal to start worker"
echo "  4. Visit http://localhost:3000/api-docs for API documentation"
echo ""