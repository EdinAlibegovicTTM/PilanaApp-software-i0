import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sheetUrl, sheetName = "Sheet1", range = "A1:Z1000" } = await request.json()

    if (!sheetUrl) {
      return NextResponse.json({ error: "Invalid request. Required: sheetUrl" }, { status: 400 })
    }

    const sheetsService = new GoogleSheetsService()
    const spreadsheetId = sheetsService.extractSpreadsheetId(sheetUrl)

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Invalid Google Sheet URL" }, { status: 400 })
    }

    // Format range with sheet name if provided
    const fullRange = sheetName ? `${sheetName}!${range}` : range

    // Read data from the sheet
    const values = await sheetsService.readFromSheet(spreadsheetId, fullRange)

    return NextResponse.json({
      success: true,
      data: values,
    })
  } catch (error: any) {
    console.error("Error reading from Google Sheets:", error)
    return NextResponse.json(
      {
        error: "Failed to read from Google Sheets",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
