"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Clock, MapPin, QrCode, User, X } from "lucide-react"
import { ProductLookup } from "@/components/product-lookup"
import { useToast } from "@/components/ui/use-toast"

interface FormFillInterfaceProps {
  form: any
  user: any
}

export function FormFillInterface({ form, user }: FormFillInterfaceProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQrInput, setShowQrInput] = useState(false)
  const { toast } = useToast()

  // Ensure fields is always an array and handle both old and new field structures
  const fields = Array.isArray(form.fields) ? form.fields : []

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    const missingFields = fields
      .filter((field: any) => field.required && !formData[field.id])
      .map((field: any) => field.label)

    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Here you would implement the actual submission logic
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      toast({
        title: "Form submitted",
        description: "Your form has been successfully submitted.",
      })

      // Reset form or redirect
      // setFormData({})
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Submission failed",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.id] || ""

    switch (field.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled={field.readonly}
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
              disabled={field.readonly || field.isFormula}
            />
            {field.isFormula && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Calculator className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </div>
        )
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={field.readonly}
          />
        )
      case "dropdown":
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)} disabled={field.readonly}>
            <SelectTrigger>
              <SelectValue placeholder="Select option..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              )) || <SelectItem value="option1">Option 1</SelectItem>}
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
            disabled={field.readonly}
            placeholder={field.placeholder || "Search products..."}
            required={field.required}
          />
        )
      case "qr":
        return (
          <div>
            {showQrInput ? (
              <div className="relative">
                <Input
                  value={value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder="Enter QR code manually"
                  disabled={field.readonly}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowQrInput(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // Here you would implement actual QR scanning
                    // For now, just show a toast
                    toast({
                      title: "Camera access required",
                      description: "Please allow camera access to scan QR codes.",
                    })
                  }}
                  disabled={field.readonly}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
                <Button variant="outline" onClick={() => setShowQrInput(true)} disabled={field.readonly}>
                  Manual Input
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
            disabled={field.readonly}
          />
        )
    }
  }

  return (
    <div>
      {/* Debug panel - only show for admin users */}
      {user?.role === "admin" && (
        <div className="mb-4 p-4 bg-gray-100 rounded text-xs">
          <h4 className="font-bold mb-2">Debug Info:</h4>
          <div>Form ID: {form.id}</div>
          <div>Form Name: {form.name}</div>
          <div>Fields Count: {fields.length}</div>
          <div>
            Fields:{" "}
            {JSON.stringify(
              fields.map((f: any) => ({ id: f.id, type: f.type, label: f.label })),
              null,
              2,
            )}
          </div>
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
            .filter((field: any) => !field.hidden)
            .map((field: any, index: number) => (
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
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  )
}
