import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Authenticate user with enhanced system
    const user = await authenticateUser(username, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Generate JWT token with permissions
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      permissions: user.permissions,
    }

    const accessToken = generateToken(tokenPayload)

    // Log successful login
    console.log(`✅ User ${username} logged in successfully at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        permissions: user.permissions,
        lastLogin: user.last_login,
      },
      token: accessToken,
      expiresIn: "24h",
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
