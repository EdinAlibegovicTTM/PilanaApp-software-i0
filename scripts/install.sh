#!/bin/bash

echo "🚀 Installing Pilana App..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
echo "🔧 Setting up environment..."
cp .env.example .env.local

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Installation complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update .env.local with your API keys"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo "4. Login with: admin / password123"
echo ""
echo "🔑 Demo Credentials:"
echo "   Admin: admin / password123"
echo "   Manager: manager / password123" 
echo "   User: user / password123"
