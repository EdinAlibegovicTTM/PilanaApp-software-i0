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

    const { formType, description, options } = await request.json()

    if (!description && !formType) {
      return NextResponse.json({ error: "Form type or description is required" }, { status: 400 })
    }

    const aiService = AIService.getInstance()
    const generatedForm = await aiService.generateFormFromDescription(description, formType)

    // Add user metadata
    generatedForm.createdBy = user.userId
    generatedForm.createdByUsername = user.username
    generatedForm.metadata = {
      ...generatedForm.metadata,
      generatedAt: new Date().toISOString(),
      userRole: user.role,
      aiProvider: "enhanced_fallback",
    }

    // Log form generation
    console.log(`🎨 Form Generated - User: ${user.username}, Type: ${formType}, Fields: ${generatedForm.fields.length}`)

    return NextResponse.json({
      ...generatedForm,
      success: true,
      message: "Form generated successfully!",
    })
  } catch (error) {
    console.error("❌ AI form generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate form",
        message: "Please try again with a different description.",
      },
      { status: 500 },
    )
  }
}
