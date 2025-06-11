import { type NextRequest, NextResponse } from "next/server"
import { createFormSubmission, getFormSubmissions, getFormById } from "@/lib/database"
import { GoogleSheetsService } from "@/lib/google-sheets"

export async function POST(request: NextRequest) {
  try {
    const submissionData = await request.json()
    const savedSubmission = await createFormSubmission(submissionData)

    // Export to Google Sheets if configured
    try {
      const form = await getFormById(submissionData.form_id)

      if (form && form.main_google_sheet_url) {
        const sheetsService = new GoogleSheetsService()
        const spreadsheetId = sheetsService.extractSpreadsheetId(form.main_google_sheet_url)

        if (spreadsheetId) {
          // Prepare data for export
          const headers = form.fields.map((field: any) => field.label || field.name || field.id)
          const values = form.fields.map((field: any) => {
            const fieldId = field.id
            return submissionData.data[fieldId] || ""
          })

          // Add timestamp
          headers.push("Submission Time")
          values.push(new Date().toISOString())

          // Export to sheet
          await sheetsService.appendToSheet(spreadsheetId, "Sheet1!A1", [values])
        }
      }
    } catch (sheetError) {
      console.error("Error exporting to Google Sheets:", sheetError)
      // Continue with the submission even if sheet export fails
    }

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
