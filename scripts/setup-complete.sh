#!/bin/bash

echo "🚀 PILANA APP - KOMPLETNA AUTOMATSKA INSTALACIJA"
echo "================================================"

# Generiši environment podatke
echo "1️⃣ Generišem environment podatke..."
npx tsx scripts/generate-env.ts

# Instaliraj dependencies
echo "2️⃣ Instaliram dependencies..."
npm install

# Proveri TypeScript
echo "3️⃣ Proveravam TypeScript..."
npx tsc --noEmit || echo "⚠️ TypeScript greške - nastavljam dalje"

# Pokušaj build
echo "4️⃣ Testiram build..."
npm run build || echo "⚠️ Build greške - možda nedostaju environment variables"

echo ""
echo "✅ INSTALACIJA ZAVRŠENA!"
echo ""
echo "📋 SLEDEĆI KORACI:"
echo "1. Pokrenite: npm run dev"
echo "2. Otvorite: http://localhost:3000"
echo "3. Login podaci: admin / password123"
echo ""
echo "📁 KREIRANI FAJLOVI:"
echo "- .env.local (development podaci)"
echo "- generated-credentials.txt (svi podaci)"
echo "- vercel-env-setup.txt (production setup)"
echo ""
echo "🚀 ZA PRODUCTION DEPLOYMENT:"
echo "1. Dodajte Neon integraciju u Vercel"
echo "2. Kopirajte podatke iz vercel-env-setup.txt"
echo "3. Deploy na Vercel!"
