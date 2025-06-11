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

    const { form, formId } = await request.json()

    if (!form && !formId) {
      return NextResponse.json({ error: "Form data or Form ID is required" }, { status: 400 })
    }

    let formToAnalyze = form

    // If only formId provided, get form from storage (mock for now)
    if (!formToAnalyze && formId) {
      formToAnalyze = {
        id: formId,
        name: "Sample Form",
        fields: [
          { label: "Name", required: true, type: "text" },
          { label: "Email", required: true, type: "email" },
          { label: "Message", required: false, type: "textarea" },
        ],
      }
    }

    const aiService = AIService.getInstance()
    const analysis = await aiService.analyzeForm(formToAnalyze)

    // Add analysis metadata
    const enhancedAnalysis = {
      ...analysis,
      analyzedAt: new Date().toISOString(),
      analyzedBy: user.username,
      userRole: user.role,
      version: "1.0",
    }

    // Log form analysis
    console.log(
      `📊 Form Analyzed - User: ${user.username}, Form: ${formToAnalyze.name || formId}, Score: ${analysis.score}`,
    )

    return NextResponse.json({
      success: true,
      analysis: enhancedAnalysis,
      message: "Form analysis completed successfully!",
    })
  } catch (error) {
    console.error("❌ AI form analysis error:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze form",
        message: "Please try again or contact support.",
      },
      { status: 500 },
    )
  }
}
