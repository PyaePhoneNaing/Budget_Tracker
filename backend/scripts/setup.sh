#!/bin/bash

echo "🚀 Setting up Budget Tracker Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate

echo "✅ Setup complete!"
echo "📝 Don't forget to:"
echo "   1. Update .env with your database credentials"
echo "   2. Make sure PostgreSQL and Redis are running"
echo "   3. Run 'npm run dev' to start the server"
