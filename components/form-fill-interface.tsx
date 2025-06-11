"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Clock, MapPin, QrCode, User } from "lucide-react"
import { ProductLookup } from "@/components/product-lookup"

export function FormFillInterface({ form, user }) {
  const [formData, setFormData] = useState({})
  const [showManualInput, setShowManualInput] = useState(false)

  // Ensure fields is always an array
  const fields = Array.isArray(form.fields) ? form.fields : []

  const handleFieldChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = () => {
    // Check required fields
    const missingFields = fields.filter((field) => field.required && !formData[field.id]).map((field) => field.label)

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(", ")}`)
      return
    }

    // Submit form
    alert("Form submitted successfully!")
    console.log("Form data:", formData)
  }

  const renderField = (field) => {
    const value = formData[field.id] || ""

    switch (field.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          />
        )
      case "number":
        return (
          <div className="relative">
            <Input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            />
            {field.isFormula && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Calculator className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </div>
        )
      case "date":
        return <Input type="date" value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} />
      case "dropdown":
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select option..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "productLookup":
        return (
          <ProductLookup
            sheetUrl={field.lookupSheetUrl || ""}
            codeColumn={field.codeColumn || "code"}
            nameColumn={field.nameColumn || "name"}
            additionalColumns={field.additionalColumns || []}
            value={value}
            onChange={(val) => handleFieldChange(field.id, val)}
            placeholder={field.placeholder || "Search products..."}
            required={field.required}
          />
        )
      case "qr":
        return (
          <div>
            {showManualInput ? (
              <div>
                <Input
                  value={value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder="Enter QR code manually"
                />
                <Button variant="link" className="mt-2" onClick={() => setShowManualInput(false)}>
                  Use scanner instead
                </Button>
              </div>
            ) : (
              <div>
                <Button variant="outline" className="w-full" onClick={() => alert("QR scanner would open here")}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
                <Button variant="link" className="mt-2" onClick={() => setShowManualInput(true)}>
                  Enter code manually
                </Button>
              </div>
            )}
          </div>
        )
      case "geolocation":
        return (
          <div className="flex items-center space-x-2 p-2 border rounded">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Auto-detected location</span>
          </div>
        )
      case "datetime":
        return (
          <div className="flex items-center space-x-2 p-2 border rounded">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">{new Date().toLocaleString()}</span>
          </div>
        )
      case "user":
        return (
          <div className="flex items-center space-x-2 p-2 border rounded">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">{user?.username || "Unknown user"}</span>
          </div>
        )
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          />
        )
    }
  }

  return (
    <div className="p-6">
      {/* Debug panel - only show for admin users */}
      {user?.role === "admin" && (
        <div className="mb-4 p-4 bg-gray-100 rounded text-xs">
          <h4 className="font-bold mb-2">Debug Info:</h4>
          <div>Form ID: {form.id}</div>
          <div>Form Name: {form.name}</div>
          <div>Fields Count: {fields.length}</div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{form.name}</h3>
        {form.description && <p className="text-gray-600 mt-1">{form.description}</p>}
      </div>

      <div className="space-y-6">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>This form has no fields yet.</p>
            <p className="text-sm mt-1">The form needs to be designed first.</p>
          </div>
        ) : (
          fields
            .filter((field) => !field.hidden)
            .map((field, index) => (
              <div key={field.id || index} className="border rounded-lg p-4">
                <Label className="text-sm font-medium mb-2 block">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
                {user?.role === "admin" && field.googleSheetColumn && (
                  <p className="text-xs text-gray-500 mt-1">Exports to column: {field.googleSheetColumn}</p>
                )}
              </div>
            ))
        )}
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t">
        <div className="flex space-x-2">
          <Button variant="outline">Exit</Button>
          <Button variant="outline">Print</Button>
          <Button variant="outline">Save PDF</Button>
        </div>
        <Button onClick={handleSubmit}>Send</Button>
      </div>
    </div>
  )
}
