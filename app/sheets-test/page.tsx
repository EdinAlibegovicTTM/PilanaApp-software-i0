import { GoogleSheetsTester } from "@/components/google-sheets-tester"

export default function SheetsTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Sheets Integration Test</h1>
          <p className="text-gray-600">Test the Google Sheets export functionality with your own spreadsheet</p>
        </div>

        <GoogleSheetsTester />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Visit <code className="bg-gray-100 px-2 py-1 rounded">/sheets-test</code> to access this tester
          </p>
        </div>
      </div>
    </div>
  )
}
