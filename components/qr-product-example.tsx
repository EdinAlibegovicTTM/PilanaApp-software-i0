"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Loader2, Plus, Trash2, Settings } from "lucide-react"

export default function QrProductExample() {
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [showConfig, setShowConfig] = useState(false)

  // Simulate QR scanning and data fetching
  const handleScan = () => {
    setIsScanning(true)

    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false)
      setScannedCode("QR12345")
      setIsLoading(true)

      // Simulate API call to Google Sheets
      setTimeout(() => {
        setIsLoading(false)

        // Mock data that would come from Google Sheets
        setProducts([
          {
            code: "PROD001",
            name: "Oranges Premium",
            stock: 50,
            volume: 15.5,
            unit: "kg",
            delivered: "",
            notes: "",
          },
          {
            code: "PROD002",
            name: "Apples Red",
            stock: 30,
            volume: 12.0,
            unit: "kg",
            delivered: "",
            notes: "",
          },
          {
            code: "PROD003",
            name: "Bananas",
            stock: 45,
            volume: 18.2,
            unit: "kg",
            delivered: "",
            notes: "",
          },
        ])
      }, 1500)
    }, 1000)
  }

  const handleReset = () => {
    setScannedCode(null)
    setProducts([])
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

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">QR Product Scanner Example</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Google Sheet URL</Label>
                <Input value="https://docs.google.com/spreadsheets/d/1abc123..." className="text-xs" readOnly />
              </div>
              <div>
                <Label className="text-xs">QR Code Column</Label>
                <Input value="A" className="text-xs" readOnly />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Field Mappings</Label>
              <div className="bg-white p-3 rounded-md border text-xs space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>Product Code → Column N</div>
                  <div>Aggregation: First</div>
                  <div className="text-right">Read-only</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>Product Name → Column U</div>
                  <div>Aggregation: First</div>
                  <div className="text-right">Read-only</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>Stock Qty → Column X</div>
                  <div>Aggregation: Sum</div>
                  <div className="text-right">Read-only</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>Volume → Column Y</div>
                  <div>Aggregation: Sum</div>
                  <div className="text-right">Read-only</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>Delivered</div>
                  <div>Manual Entry</div>
                  <div className="text-right">Editable</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>Notes</div>
                  <div>Manual Entry</div>
                  <div className="text-right">Editable</div>
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Field
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>QR Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label>Scan QR Code</Label>
              <div className="flex mt-1">
                <Input
                  value={scannedCode || ""}
                  placeholder="QR code will appear here..."
                  readOnly
                  className="rounded-r-none"
                />
                <Button onClick={handleScan} disabled={isScanning || isLoading} className="rounded-l-none">
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan QR
                    </>
                  )}
                </Button>
              </div>
            </div>
            {scannedCode && (
              <Button variant="outline" onClick={handleReset} className="mt-6">
                <Trash2 className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
        </div>
      )}
    </div>
  )
}
