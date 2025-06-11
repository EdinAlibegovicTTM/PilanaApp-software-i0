import { type NextRequest, NextResponse } from "next/server"
import { createFormSubmission, getFormSubmissions } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const submissionData = await request.json()
    const savedSubmission = await createFormSubmission(submissionData)

    // TODO: Trigger Google Sheets export if configured
    // if (submissionData.googleSheetUrl) {
    //   await exportToGoogleSheets(savedSubmission, submissionData.googleSheetUrl)
    // }

    return NextResponse.json(savedSubmission)
  } catch (error) {
    console.error("Error saving submission:", error)
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get("formId")

    if (!formId) {
      return NextResponse.json({ error: "Form ID is required" }, { status: 400 })
    }

    const submissions = await getFormSubmissions(Number.parseInt(formId))
    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
