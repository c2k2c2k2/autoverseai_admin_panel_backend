#!/bin/bash

# Vercel Deployment Script for NestJS Backend

echo "🚀 Starting Vercel deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm i -g vercel
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env with your actual values before deploying."
    exit 1
fi

# Build the project locally first to catch any errors
echo "🔨 Building project locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run database migrations on your production database"
echo "2. Update your frontend to use the new backend URL"
echo "3. Test the deployment using the health check endpoint"
echo ""
echo "🔗 Useful commands:"
echo "   vercel logs          - View deployment logs"
echo "   vercel env ls        - List environment variables"
echo "   vercel --help        - Get more help"
