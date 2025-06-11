import * as crypto from "crypto"
import * as fs from "fs"

interface EnvConfig {
  development: Record<string, string>
  production: Record<string, string>
}

function generateSecureSecret(length = 32): string {
  return crypto.randomBytes(length).toString("base64url")
}

function generateJWT(): string {
  return `pilana-jwt-${generateSecureSecret(24)}`
}

function generateNextAuthSecret(): string {
  return `pilana-nextauth-${generateSecureSecret(32)}`
}

function generateMockGoogleCredentials() {
  const projectId = `pilana-project-${crypto.randomUUID().slice(0, 8)}`
  const serviceAccountEmail = `pilana-service@${projectId}.iam.gserviceaccount.com`

  // Mock private key format (ne koristi u produkciji!)
  const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wjXGxIbfNz9cwyYOYcjDmz5Qg2H/DjHISMtBVQqyoYdgOrM8hPhKnVfqJur7zZlX
3tBaeCGKn4tDrEQqPcWzAoGBAOVfuiEiOchNlNviqAyBgUJUVdcGKXe+VKzubSu4
Lt6gizAxtrix4x4XtrmEz67JwSdekn6UovdNHLGBjHnAiQDxz13FgXBunyh9BbNc
mCM6pDgfZRgeGxRBKtP1LHgpAoGBALWndjwPk0onzcHXsrQjmwKBgQDjhFhU
-----END PRIVATE KEY-----`

  return {
    email: serviceAccountEmail,
    privateKey: mockPrivateKey,
    spreadsheetId: `1${crypto.randomUUID().replace(/-/g, "")}`,
    projectId,
  }
}

function generateOpenAIKey(): string {
  // Mock OpenAI key format (ne koristi u produkciji!)
  return `sk-proj-${crypto.randomBytes(24).toString("base64url")}T3BlbkFJ${crypto.randomBytes(24).toString("base64url")}`
}

function createEnvConfig(): EnvConfig {
  const jwtSecret = generateJWT()
  const nextAuthSecret = generateNextAuthSecret()
  const googleCreds = generateMockGoogleCredentials()
  const openaiKey = generateOpenAIKey()

  const baseConfig = {
    // App Configuration
    NEXT_PUBLIC_APP_NAME: "Pilana App",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NODE_ENV: "development",

    // Authentication
    JWT_SECRET: jwtSecret,
    NEXTAUTH_SECRET: nextAuthSecret,

    // Real-time Features
    NEXT_PUBLIC_WS_URL: "ws://localhost:3000",

    // File Upload
    NEXT_PUBLIC_MAX_FILE_SIZE: "10485760",
    NEXT_PUBLIC_ALLOWED_FILE_TYPES: "image/*,application/pdf,.doc,.docx",
  }

  return {
    development: {
      ...baseConfig,
      // Database (će biti zamenjen sa stvarnim Neon URL-om)
      DATABASE_URL: "postgresql://username:password@localhost:5432/pilana_dev?sslmode=prefer",
      POSTGRES_URL: "postgresql://username:password@localhost:5432/pilana_dev?sslmode=prefer",

      // Google Sheets API (mock podaci za development)
      GOOGLE_SERVICE_ACCOUNT_EMAIL: googleCreds.email,
      GOOGLE_PRIVATE_KEY: googleCreds.privateKey,
      GOOGLE_SHEETS_SPREADSHEET_ID: googleCreds.spreadsheetId,

      // AI Features (mock ključ za development)
      OPENAI_API_KEY: openaiKey,
      AI_PROVIDER: "openai",
    },
    production: {
      ...baseConfig,
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://your-app.vercel.app",
      NEXT_PUBLIC_WS_URL: "wss://your-app.vercel.app",

      // Production će koristiti stvarne vrednosti iz Vercel Environment Variables
      DATABASE_URL: "${DATABASE_URL}", // Neon će ovo automatski dodati
      POSTGRES_URL: "${POSTGRES_URL}", // Neon će ovo automatski dodati

      // Ovi će biti dodani ručno u Vercel dashboard
      GOOGLE_SERVICE_ACCOUNT_EMAIL: "${GOOGLE_SERVICE_ACCOUNT_EMAIL}",
      GOOGLE_PRIVATE_KEY: "${GOOGLE_PRIVATE_KEY}",
      GOOGLE_SHEETS_SPREADSHEET_ID: "${GOOGLE_SHEETS_SPREADSHEET_ID}",
      OPENAI_API_KEY: "${OPENAI_API_KEY}",
      AI_PROVIDER: "openai",
    },
  }
}

function writeEnvFiles(config: EnvConfig) {
  // Kreiraj .env.local za development
  const devEnvContent = Object.entries(config.development)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")

  fs.writeFileSync(".env.local", devEnvContent)
  console.log("✅ Kreiran .env.local za development")

  // Kreiraj .env.example
  const exampleEnvContent = Object.keys(config.development)
    .map((key) => `${key}=your-value-here`)
    .join("\n")

  fs.writeFileSync(".env.example", exampleEnvContent)
  console.log("✅ Kreiran .env.example")

  // Kreiraj instrukcije za production
  const productionInstructions = `
# 🚀 PRODUCTION ENVIRONMENT VARIABLES
# Dodajte ove u Vercel Dashboard → Settings → Environment Variables

${Object.entries(config.production)
  .filter(([key]) => !key.includes("${"))
  .map(([key, value]) => `${key}=${value}`)
  .join("\n")}

# 📝 NAPOMENE:
# - DATABASE_URL i POSTGRES_URL će Neon automatski dodati
# - Za Google Sheets API, napravite service account na console.cloud.google.com
# - Za OpenAI API, napravite ključ na platform.openai.com
# - JWT_SECRET i NEXTAUTH_SECRET su već generisani i sigurni za produkciju
`

  fs.writeFileSync("vercel-env-setup.txt", productionInstructions)
  console.log("✅ Kreiran vercel-env-setup.txt sa instrukcijama")
}

function generateCredentialsInfo(config: EnvConfig) {
  const info = `
# 🔐 GENERISANI PODACI ZA PILANA APP

## 🏠 Development Login Podaci:
Username: admin
Password: password123

## 🔑 Sigurnosni Ključevi (već generisani):
JWT_SECRET: ${config.development.JWT_SECRET}
NEXTAUTH_SECRET: ${config.development.NEXTAUTH_SECRET}

## 📊 Mock Google Sheets Podaci (za testiranje):
Service Account: ${config.development.GOOGLE_SERVICE_ACCOUNT_EMAIL}
Spreadsheet ID: ${config.development.GOOGLE_SHEETS_SPREADSHEET_ID}

## 🤖 Mock OpenAI Ključ (za testiranje):
API Key: ${config.development.OPENAI_API_KEY}

## ⚠️ VAŽNO:
- Ovi podaci su sigurni za development
- Za produkciju, koristite stvarne API ključeve
- Mock podaci neće raditi sa stvarnim servisima
- Aplikacija ima fallback opcije za sve spoljne servise

## 🚀 Sledeći koraci:
1. Pokrenite: npm install
2. Pokrenite: npm run dev
3. Otvorite: http://localhost:3000
4. Ulogujte se sa admin/password123
`

  fs.writeFileSync("generated-credentials.txt", info)
  console.log("✅ Kreiran generated-credentials.txt sa svim podacima")
}

// Pokreni generiranje
console.log("🔄 Generišem environment podatke...")
const config = createEnvConfig()
writeEnvFiles(config)
generateCredentialsInfo(config)

console.log(`
🎉 USPEŠNO GENERISANO!

📁 Kreirani fajlovi:
- .env.local (za development)
- .env.example (template)
- vercel-env-setup.txt (instrukcije za production)
- generated-credentials.txt (svi podaci)

🚀 Sledeći koraci:
1. npm install
2. npm run dev
3. Otvorite http://localhost:3000
4. Login: admin / password123

💡 Za production deployment:
1. Dodajte Neon integraciju u Vercel
2. Kopirajte podatke iz vercel-env-setup.txt u Vercel Environment Variables
3. Deploy!
`)
