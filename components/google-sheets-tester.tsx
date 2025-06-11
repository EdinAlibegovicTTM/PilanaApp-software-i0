"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoogleSheetsDemo } from "@/lib/google-sheets-demo"
import { FileSpreadsheet, CheckCircle, XCircle } from "lucide-react"

export function GoogleSheetsTester() {
  const [sheetUrl, setSheetUrl] = useState("")
  const [testData, setTestData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    message: "Test message from Pilana App",
  })
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTest = async () => {
    if (!sheetUrl.trim()) {
      setResult({
        success: false,
        message: "Please enter a Google Sheets URL",
      })
      return
    }

    setIsLoading(true)
    try {
      const exportResult = await GoogleSheetsDemo.testExport(testData, sheetUrl)
      setResult(exportResult)
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <span>Google Sheets Export Tester</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="sheet-url">Google Sheets URL</Label>
          <Input
            id="sheet-url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
            className="mt-2"
          />
          <p className="text-sm text-gray-500 mt-1">Paste the URL of your Google Sheet where you want to export data</p>
        </div>

        <div>
          <Label>Test Data (JSON)</Label>
          <div className="mt-2 p-3 bg-gray-50 rounded border text-sm font-mono">
            {JSON.stringify(testData, null, 2)}
          </div>
          <p className="text-sm text-gray-500 mt-1">This sample data will be exported to your sheet</p>
        </div>

        <Button onClick={handleTest} disabled={isLoading} className="w-full">
          {isLoading ? "Testing Export..." : "Test Google Sheets Export"}
        </Button>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <div className="flex items-center space-x-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How to set up Google Sheets:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Create a new Google Sheet</li>
            <li>Share it with "Anyone with the link can edit"</li>
            <li>Copy the sheet URL and paste it above</li>
            <li>Click "Test Export" to see the demo</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">For production use, you'll need Google Sheets API credentials</p>
        </div>
      </CardContent>
    </Card>
  )
}
