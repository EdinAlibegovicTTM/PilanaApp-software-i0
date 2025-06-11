// Demo funkcija za testiranje Google Sheets export-a
export class GoogleSheetsDemo {
  static async testExport(formData: any, sheetUrl: string) {
    try {
      // Izvuci spreadsheet ID iz URL-a
      const spreadsheetId = this.extractSpreadsheetId(sheetUrl)
      if (!spreadsheetId) {
        throw new Error("Invalid Google Sheets URL")
      }

      // Pripremi podatke za export
      const exportData = this.prepareExportData(formData)

      console.log("Exporting to Google Sheets:", {
        spreadsheetId,
        data: exportData,
        timestamp: new Date().toISOString(),
      })

      // Za demo, samo log podatke
      // U production verziji, ovde bi bio stvarni API poziv
      return {
        success: true,
        message: `Data exported to Google Sheets: ${spreadsheetId}`,
        exportedRows: exportData.length,
      }
    } catch (error) {
      console.error("Google Sheets export error:", error)
      return {
        success: false,
        message: error.message,
      }
    }
  }

  static extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  static prepareExportData(formData: any) {
    // Konvertuj form podatke u format za Google Sheets
    const headers = Object.keys(formData)
    const values = Object.values(formData)

    return [
      headers, // Header red
      values, // Podaci
    ]
  }
}
