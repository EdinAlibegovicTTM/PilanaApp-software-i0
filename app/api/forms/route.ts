import { type NextRequest, NextResponse } from "next/server"
import { createForm, getFormsByUser, getPublishedForms, logFormChange } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const publishedOnly = searchParams.get("publishedOnly") === "true"

    let forms
    if (userId) {
      forms = await getFormsByUser(Number.parseInt(userId), publishedOnly)
    } else {
      forms = await getPublishedForms()
    }

    return NextResponse.json(forms)
  } catch (error) {
    console.error("Error fetching forms:", error)
    return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Generate external ID if not provided
    if (!formData.external_id) {
      formData.external_id = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const savedForm = await createForm(formData)

    // Log the creation
    await logFormChange(savedForm.id, formData.created_by, "created", { form_name: savedForm.name })

    return NextResponse.json(savedForm)
  } catch (error) {
    console.error("Error creating form:", error)
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 })
  }
}
