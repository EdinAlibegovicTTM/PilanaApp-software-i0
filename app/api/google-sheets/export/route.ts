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

    const { sheetUrl, data, sheetName = "Sheet1", range = "A1" } = await request.json()

    if (!sheetUrl || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid request. Required: sheetUrl, data (array)" }, { status: 400 })
    }

    const sheetsService = new GoogleSheetsService()
    const spreadsheetId = sheetsService.extractSpreadsheetId(sheetUrl)

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Invalid Google Sheet URL" }, { status: 400 })
    }

    // Format range with sheet name if provided
    const fullRange = sheetName ? `${sheetName}!${range}` : range

    // Append data to the sheet
    const result = await sheetsService.appendToSheet(spreadsheetId, fullRange, data)

    return NextResponse.json({
      success: true,
      updatedRange: result.updates?.updatedRange,
      updatedCells: result.updates?.updatedCells,
    })
  } catch (error: any) {
    console.error("Error exporting to Google Sheets:", error)
    return NextResponse.json(
      {
        error: "Failed to export to Google Sheets",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
