import { google } from "googleapis"

export class GoogleSheetsService {
  private static instance: GoogleSheetsService
  private sheets: any
  private initialized = false

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
      this.initialized = true
      console.log("Google Sheets API initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Google Sheets:", error)
    }
  }

  isInitialized(): boolean {
    return this.initialized
  }

  async appendToSheet(spreadsheetId: string, range: string, values: any[][]) {
    try {
      if (!this.sheets) {
        await this.initializeSheets()
        if (!this.sheets) {
          throw new Error("Google Sheets not initialized")
        }
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED", // Changed from RAW to USER_ENTERED for better formatting
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
        await this.initializeSheets()
        if (!this.sheets) {
          throw new Error("Google Sheets not initialized")
        }
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

  async updateCells(spreadsheetId: string, range: string, values: any[][]) {
    try {
      if (!this.sheets) {
        await this.initializeSheets()
        if (!this.sheets) {
          throw new Error("Google Sheets not initialized")
        }
      }

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        resource: {
          values,
        },
      })

      return response.data
    } catch (error) {
      console.error("Error updating Google Sheet cells:", error)
      throw error
    }
  }

  async getSheetInfo(spreadsheetId: string) {
    try {
      if (!this.sheets) {
        await this.initializeSheets()
        if (!this.sheets) {
          throw new Error("Google Sheets not initialized")
        }
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      })

      return response.data
    } catch (error) {
      console.error("Error getting Google Sheet info:", error)
      throw error
    }
  }

  extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  getSheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  }
}

// Export a singleton instance
export const googleSheetsService = GoogleSheetsService.getInstance()
