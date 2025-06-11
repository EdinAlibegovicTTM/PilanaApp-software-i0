import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "pilana-super-secret-key-2024-development-only"

export interface TokenPayload {
  userId: number
  username: string
  role: string
  email?: string
  permissions?: string[]
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  permissions: string[]
  created_at: string
  last_login?: string
}

// Demo users with enhanced permissions
const DEMO_USERS: User[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@pilanaapp.com",
    role: "admin",
    permissions: ["create", "read", "update", "delete", "manage_users", "analytics", "ai_features"],
    created_at: "2024-01-01T00:00:00Z",
    last_login: new Date().toISOString(),
  },
  {
    id: 2,
    username: "manager",
    email: "manager@pilanaapp.com",
    role: "manager",
    permissions: ["create", "read", "update", "analytics", "ai_features"],
    created_at: "2024-01-01T00:00:00Z",
    last_login: new Date().toISOString(),
  },
  {
    id: 3,
    username: "user",
    email: "user@pilanaapp.com",
    role: "user",
    permissions: ["create", "read", "update"],
    created_at: "2024-01-01T00:00:00Z",
    last_login: new Date().toISOString(),
  },
]

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h",
    issuer: "pilana-app",
  })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  // Demo password for all users
  const DEMO_PASSWORD = "password123"

  if (password !== DEMO_PASSWORD) {
    return null
  }

  const user = DEMO_USERS.find((u) => u.username === username)
  if (!user) {
    return null
  }

  // Update last login
  user.last_login = new Date().toISOString()
  return user
}

export function getUserById(id: number): User | null {
  return DEMO_USERS.find((u) => u.id === id) || null
}

export function getAllUsers(): User[] {
  return DEMO_USERS
}

export function hasPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission) || user.role === "admin"
}
