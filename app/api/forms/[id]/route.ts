import { type NextRequest, NextResponse } from "next/server"
import { updateForm, deleteForm, getFormById, logFormChange } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formId = Number.parseInt(params.id)
    const form = await getFormById(formId)

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error("Error fetching form:", error)
    return NextResponse.json({ error: "Failed to fetch form" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formId = Number.parseInt(params.id)
    const updates = await request.json()
    const { userId, ...formUpdates } = updates

    const updatedForm = await updateForm(formId, formUpdates)

    // Log the update
    if (userId) {
      await logFormChange(formId, userId, "updated", { changes: Object.keys(formUpdates) })
    }

    return NextResponse.json(updatedForm)
  } catch (error) {
    console.error("Error updating form:", error)
    return NextResponse.json({ error: "Failed to update form" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    await deleteForm(formId)

    // Log the deletion
    if (userId) {
      await logFormChange(formId, Number.parseInt(userId), "deleted", { form_id: formId })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting form:", error)
    return NextResponse.json({ error: "Failed to delete form" }, { status: 500 })
  }
}
