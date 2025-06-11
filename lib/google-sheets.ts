import { google } from "googleapis"

export class GoogleSheetsService {
  private static instance: GoogleSheetsService
  private sheets: any

  constructor() {
    this.initializeSheets()
  }

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService()
    }
    return GoogleSheetsService.instance
  }

  private async initializeSheets() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.warn("Google Sheets credentials not configured")
        return
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      })

      this.sheets = google.sheets({ version: "v4", auth })
    } catch (error) {
      console.error("Failed to initialize Google Sheets:", error)
    }
  }

  async appendToSheet(spreadsheetId: string, range: string, values: any[][]) {
    try {
      if (!this.sheets) {
        throw new Error("Google Sheets not initialized")
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        resource: {
          values,
        },
      })

      return response.data
    } catch (error) {
      console.error("Error appending to Google Sheet:", error)
      throw error
    }
  }

  async readFromSheet(spreadsheetId: string, range: string) {
    try {
      if (!this.sheets) {
        throw new Error("Google Sheets not initialized")
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      })

      return response.data.values || []
    } catch (error) {
      console.error("Error reading from Google Sheet:", error)
      throw error
    }
  }

  extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }
}

export async function exportSubmissionToSheet(
  googleSheetUrl: string,
  submission: any,
  range = "Sheet1!A1"
) {
  const service = GoogleSheetsService.getInstance()
  const spreadsheetId = service.extractSpreadsheetId(googleSheetUrl)
  if (!spreadsheetId) {
    throw new Error("Invalid Google Sheet URL")
  }

  const values = [[new Date().toISOString(), JSON.stringify(submission)]]
  return service.appendToSheet(spreadsheetId, range, values)
}
