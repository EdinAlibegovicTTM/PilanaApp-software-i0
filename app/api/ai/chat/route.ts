import { type NextRequest, NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const aiService = AIService.getInstance()
    const response = await aiService.chatResponse(message, {
      ...context,
      user: {
        id: user.userId,
        role: user.role,
        permissions: user.permissions,
      },
    })

    // Log AI interaction
    console.log(`🤖 AI Chat - User: ${user.username}, Message: ${message.substring(0, 50)}...`)

    return NextResponse.json({
      ...response,
      timestamp: new Date().toISOString(),
      user: user.username,
    })
  } catch (error) {
    console.error("❌ AI chat error:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        content: "I'm experiencing technical difficulties. Please try again later.",
        suggestions: ["Try again", "Contact support", "Check connection"],
      },
      { status: 500 },
    )
  }
}
