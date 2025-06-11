"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, Settings, Camera } from "lucide-react"
import QRScanner from "./qr-scanner"
import { GoogleSheetsService } from "@/lib/google-sheets"

interface Product {
  code: string
  name: string
  stock: number
  volume: number
  unit: string
  delivered: string
  notes: string
}

export default function QrProductScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [sheetUrl, setSheetUrl] = useState<string>("")
  const [sheetRange, setSheetRange] = useState<string>("Sheet1!A:Z")
  const [qrColumn, setQrColumn] = useState<string>("A")
  const [error, setError] = useState<string | null>(null)

  const handleScan = (data: string) => {
    setIsScanning(false)
    setScannedCode(data)
    fetchProductData(data)
  }

  const fetchProductData = async (qrCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!sheetUrl) {
        throw new Error("Please configure Google Sheet URL first")
      }

      const sheetsService = new GoogleSheetsService()
      const spreadsheetId = sheetsService.extractSpreadsheetId(sheetUrl)

      if (!spreadsheetId) {
        throw new Error("Invalid Google Sheet URL")
      }

      // Fetch data from API
      const response = await fetch("/api/google-sheets/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetUrl,
          sheetName: sheetRange.split("!")[0] || "Sheet1",
          range: sheetRange.split("!")[1] || "A:Z",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch data from Google Sheets")
      }

      const result = await response.json()

      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error("No data found in the specified sheet")
      }

      // Find the QR code column index
      const headers = result.data[0]
      const qrColumnIndex = headers.findIndex(
        (header: string) => header.toLowerCase().includes("qr") || header.toLowerCase().includes("code"),
      )

      // If QR column not found, use the first column
      const qrColIdx = qrColumnIndex >= 0 ? qrColumnIndex : 0

      // Filter rows that match the QR code
      const matchingRows = result.data.slice(1).filter((row: any[]) => {
        return row[qrColIdx] && row[qrColIdx].toString() === qrCode
      })

      if (matchingRows.length === 0) {
        throw new Error(`No products found with QR code: ${qrCode}`)
      }

      // Map the data to our product structure
      const foundProducts = matchingRows.map((row: any[]) => {
        // Try to intelligently map columns based on headers
        const nameIdx = headers.findIndex(
          (h: string) => h.toLowerCase().includes("name") || h.toLowerCase().includes("product"),
        )
        const stockIdx = headers.findIndex(
          (h: string) =>
            h.toLowerCase().includes("stock") ||
            h.toLowerCase().includes("quantity") ||
            h.toLowerCase().includes("qty"),
        )
        const volumeIdx = headers.findIndex(
          (h: string) => h.toLowerCase().includes("volume") || h.toLowerCase().includes("weight"),
        )
        const unitIdx = headers.findIndex(
          (h: string) => h.toLowerCase().includes("unit") || h.toLowerCase().includes("measure"),
        )

        return {
          code: row[qrColIdx] || qrCode,
          name: nameIdx >= 0 ? row[nameIdx] || "" : "Unknown Product",
          stock: stockIdx >= 0 ? Number.parseFloat(row[stockIdx]) || 0 : 0,
          volume: volumeIdx >= 0 ? Number.parseFloat(row[volumeIdx]) || 0 : 0,
          unit: unitIdx >= 0 ? row[unitIdx] || "pcs" : "pcs",
          delivered: "",
          notes: "",
        }
      })

      setProducts(foundProducts)
    } catch (err: any) {
      console.error("Error fetching product data:", err)
      setError(err.message || "Failed to fetch product data")
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setScannedCode(null)
    setProducts([])
    setError(null)
  }

  const handleDeliveredChange = (index: number, value: string) => {
    const updatedProducts = [...products]
    updatedProducts[index].delivered = value
    setProducts(updatedProducts)
  }

  const handleNotesChange = (index: number, value: string) => {
    const updatedProducts = [...products]
    updatedProducts[index].notes = value
    setProducts(updatedProducts)
  }

  const handleSaveToSheet = async () => {
    if (!sheetUrl || products.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const sheetsService = new GoogleSheetsService()
      const spreadsheetId = sheetsService.extractSpreadsheetId(sheetUrl)

      if (!spreadsheetId) {
        throw new Error("Invalid Google Sheet URL")
      }

      // Prepare data for export - create a new sheet for deliveries
      const deliveryData = products.map((product) => [
        new Date().toISOString(), // Timestamp
        scannedCode, // QR Code
        product.code, // Product Code
        product.name, // Product Name
        product.delivered, // Delivered Amount
        product.unit, // Unit
        product.notes, // Notes
      ])

      // Add headers if this is first delivery
      const headers = [["Timestamp", "QR Code", "Product Code", "Product Name", "Delivered", "Unit", "Notes"]]

      // Export to a "Deliveries" sheet
      const response = await fetch("/api/google-sheets/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetUrl,
          sheetName: "Deliveries",
          range: "A1",
          data: [...headers, ...deliveryData],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save data to Google Sheets")
      }

      alert("Delivery data saved successfully!")
      handleReset()
    } catch (err: any) {
      console.error("Error saving to Google Sheets:", err)
      setError(err.message || "Failed to save data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">QR Product Scanner</h2>
        <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
          <Settings className="w-4 h-4 mr-2" />
          {showConfig ? "Hide" : "Show"} Configuration
        </Button>
      </div>

      {showConfig && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">QR Scanner Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Google Sheet URL</Label>
                <Input
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Paste the full URL to your Google Sheet</p>
              </div>
              <div>
                <Label className="text-xs">Sheet Range</Label>
                <Input
                  value={sheetRange}
                  onChange={(e) => setSheetRange(e.target.value)}
                  placeholder="Sheet1!A:Z"
                  className="text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Format: SheetName!Range (e.g. Sheet1!A:Z)</p>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Field Mappings</Label>
              <div className="bg-white p-3 rounded-md border text-xs space-y-2">
                <p className="text-gray-500">
                  The system will automatically detect columns based on their headers. Make sure your sheet has headers
                  like "Product", "Name", "Stock", "Quantity", etc.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isScanning && !scannedCode && (
        <Card>
          <CardHeader>
            <CardTitle>QR Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Button onClick={() => setIsScanning(true)} disabled={isLoading} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Scan QR Code
              </Button>

              {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm w-full">{error}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {isScanning && (
        <QRScanner onScan={handleScan} onClose={() => setIsScanning(false)} title="Scan Product QR Code" />
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-gray-500">Fetching product data from Google Sheets...</p>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Products Found ({products.length})</h3>
            <Badge variant="outline">QR Code: {scannedCode}</Badge>
          </div>

          {products.map((product, index) => (
            <Card key={index} className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-500">Product Code (Read-only)</Label>
                      <Input value={product.code} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Product Name (Read-only)</Label>
                      <Input value={product.name} readOnly className="bg-gray-50" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Stock Quantity (Read-only)</Label>
                        <div className="flex">
                          <Input value={product.stock} readOnly className="bg-gray-50 rounded-r-none" />
                          <div className="bg-gray-200 px-3 flex items-center rounded-r-md text-gray-600 text-sm">
                            {product.unit}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Volume (Read-only)</Label>
                        <div className="flex">
                          <Input value={product.volume} readOnly className="bg-gray-50 rounded-r-none" />
                          <div className="bg-gray-200 px-3 flex items-center rounded-r-md text-gray-600 text-sm">
                            {product.unit}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-medium text-blue-600">Delivered (Editable)</Label>
                        <div className="flex">
                          <Input
                            type="number"
                            value={product.delivered}
                            onChange={(e) => handleDeliveredChange(index, e.target.value)}
                            className="border-blue-200 focus:border-blue-400 rounded-r-none"
                            placeholder="Enter amount"
                          />
                          <div className="bg-blue-100 px-3 flex items-center rounded-r-md text-blue-600 text-sm">
                            {product.unit}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-blue-600">Notes (Editable)</Label>
                        <Input
                          value={product.notes}
                          onChange={(e) => handleNotesChange(index, e.target.value)}
                          className="border-blue-200 focus:border-blue-400"
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSaveToSheet} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Save Delivery Data
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <Trash2 className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
