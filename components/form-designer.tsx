"use client"

import React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { TouchBackend } from "react-dnd-touch-backend"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Type,
  Hash,
  Calendar,
  ChevronDown,
  QrCode,
  MapPin,
  Clock,
  User,
  Calculator,
  Trash2,
  Settings,
  GripVertical,
  Plus,
  Save,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  AlertCircle,
  Menu,
  PanelLeftOpen,
  PanelRightOpen,
  Search,
  Database,
} from "lucide-react"
import { useRealtimeSync, CloudStorageService, OfflineQueue } from "@/lib/realtime-sync"

const FIELD_TYPES = [
  { id: "text", label: "Text", icon: Type, description: "Single line text input" },
  { id: "number", label: "Number", icon: Hash, description: "Numeric input with formula support" },
  { id: "date", label: "Date", icon: Calendar, description: "Date picker (DD.MM.YYYY)" },
  { id: "dropdown", label: "Dropdown", icon: ChevronDown, description: "Dropdown with T9 search" },
  { id: "productLookup", label: "Product Lookup", icon: Search, description: "Code-Name lookup with Google Sheets" },
  { id: "qr", label: "QR Scanner", icon: QrCode, description: "QR code scanner" },
  {
    id: "qrProductScanner",
    label: "QR Product Scanner",
    icon: Database,
    description: "QR scanner with dynamic product population",
  },
  { id: "geolocation", label: "Geolocation", icon: MapPin, description: "Auto location" },
  { id: "datetime", label: "Date & Time", icon: Clock, description: "Auto date and time" },
  { id: "user", label: "User", icon: User, description: "Auto username" },
]

// Device-specific canvas sizes
const CANVAS_SIZES = {
  desktop: { width: 1200, height: 800 },
  mobile: { width: 375, height: 667 },
}

// Device-specific field constraints
const FIELD_CONSTRAINTS = {
  desktop: {
    minWidth: 150,
    minHeight: 40,
    maxWidth: 600,
    maxHeight: 300,
    defaultWidth: 300,
    defaultHeight: 60,
  },
  mobile: {
    minWidth: 100,
    minHeight: 35,
    maxWidth: 350,
    maxHeight: 200,
    defaultWidth: 280,
    defaultHeight: 50,
  },
}

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  readonly: boolean
  hidden: boolean
  permanent: boolean
  isFormula: boolean
  formula?: string
  options?: string[]
  googleSheetColumn?: string
  importSheetUrl?: string
  importCell?: string
  qrScanSheetUrl?: string
  qrScanCell?: string
  lookupSheetUrl?: string
  codeColumn?: string
  nameColumn?: string
  additionalColumns?: string[]
  codeExportColumn?: string
  nameExportColumn?: string
  additionalExportColumns?: string
  // QR Product Scanner specific fields
  qrProductLookupSheetUrl?: string
  qrCodeColumn?: string
  fieldMappings?: Array<{
    fieldName: string
    sheetColumn: string
    aggregation: "first" | "sum" | "average" | "last"
    isManualEntry: boolean
    fieldType: "text" | "number"
  }>
  maxProducts?: number
  desktop: {
    position: { x: number; y: number }
    size: { width: number; height: number }
  }
  mobile: {
    position: { x: number; y: number }
    size: { width: number; height: number }
  }
}

interface FormDesignerProps {
  form: any
  onSave: (updatedForm: any) => void
}

export default function FormDesigner({ form, onSave }: FormDesignerProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [formSettings, setFormSettings] = useState({
    backgroundColor: "#ffffff",
    columns: { mobile: 1, tablet: 2, desktop: 3 },
    mainGoogleSheetUrl: "",
  })
  const [previewMode, setPreviewMode] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("desktop")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [designDevice, setDesignDevice] = useState<"desktop" | "mobile">("desktop")
  const [leftPanelWidth, setLeftPanelWidth] = useState(320)
  const [rightPanelWidth, setRightPanelWidth] = useState(320)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showFieldTypesSheet, setShowFieldTypesSheet] = useState(false)
  const [showPropertiesSheet, setShowPropertiesSheet] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const leftResizeRef = useRef<HTMLDivElement>(null)
  const rightResizeRef = useRef<HTMLDivElement>(null)

  const currentCanvasSize = CANVAS_SIZES[designDevice]
  const currentFieldConstraints = FIELD_CONSTRAINTS[designDevice]

  const { syncForm, isConnected } = useRealtimeSync()

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768
      setIsMobileView(isMobile)
      if (isMobile) {
        setLeftPanelCollapsed(true)
        setRightPanelCollapsed(true)
      } else {
        setLeftPanelCollapsed(false)
        setRightPanelCollapsed(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const handleLeftResize = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(500, e.clientX))
      setLeftPanelWidth(newWidth)
    }

    const handleRightResize = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(500, window.innerWidth - e.clientX))
      setRightPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleLeftResize)
      document.removeEventListener("mousemove", handleRightResize)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    const leftResizer = leftResizeRef.current
    const rightResizer = rightResizeRef.current

    if (leftResizer) {
      leftResizer.addEventListener("mousedown", (e) => {
        e.preventDefault()
        document.addEventListener("mousemove", handleLeftResize)
        document.addEventListener("mouseup", handleMouseUp)
      })
    }

    if (rightResizer) {
      rightResizer.addEventListener("mousedown", (e) => {
        e.preventDefault()
        document.addEventListener("mousemove", handleRightResize)
        document.addEventListener("mouseup", handleMouseUp)
      })
    }

    return () => {
      if (leftResizer) leftResizer.removeEventListener("mousedown", () => {})
      if (rightResizer) rightResizer.removeEventListener("mousedown", () => {})
    }
  }, [])

  useEffect(() => {
    if (form) {
      const draftKey = `pilana_draft_${form.id}`
      const savedDraft = localStorage.getItem(draftKey)

      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft)
          setFields(draftData.fields || [])
          setFormSettings(
            draftData.formSettings || {
              backgroundColor: form.backgroundColor || "#ffffff",
              columns: form.columns || { mobile: 1, tablet: 2, desktop: 3 },
              mainGoogleSheetUrl: form.mainGoogleSheetUrl || "",
            },
          )
          setHasUnsavedChanges(true)
          console.log("Loaded draft for form:", form.name)
        } catch (error) {
          console.error("Error loading draft:", error)
          loadFormData()
        }
      } else {
        loadFormData()
      }
    }
  }, [form])

  const loadFormData = () => {
    const convertedFields = (form.fields || []).map((field: any) => {
      if (!field.desktop || !field.mobile) {
        return {
          ...field,
          desktop: {
            position: field.position || { x: 50, y: 50 },
            size: field.size || { width: 300, height: 60 },
          },
          mobile: {
            position: { x: 20, y: 50 },
            size: { width: 280, height: 50 },
          },
        }
      }
      return field
    })

    setFields(convertedFields)
    setFormSettings({
      backgroundColor: form.backgroundColor || "#ffffff",
      columns: form.columns || { mobile: 1, tablet: 2, desktop: 3 },
      mainGoogleSheetUrl: form.mainGoogleSheetUrl || "",
    })
    setHasUnsavedChanges(false)
    setLastSaved(form.updatedAt ? new Date(form.updatedAt) : null)
  }

  useEffect(() => {
    if (hasUnsavedChanges && form) {
      const draftTimer = setTimeout(() => {
        saveDraft()
      }, 3000)
      return () => clearTimeout(draftTimer)
    }
  }, [hasUnsavedChanges, fields, formSettings, form])

  const saveDraft = () => {
    if (!form) return
    try {
      const draftKey = `pilana_draft_${form.id}`
      const draftData = {
        fields,
        formSettings,
        lastModified: new Date().toISOString(),
      }
      localStorage.setItem(draftKey, JSON.stringify(draftData))
      console.log("Draft saved automatically")
    } catch (error) {
      console.error("Error saving draft:", error)
    }
  }

  const clearDraft = () => {
    if (!form) return
    const draftKey = `pilana_draft_${form.id}`
    localStorage.removeItem(draftKey)
  }

  const validatePosition = (
    position: { x: number; y: number },
    fieldSize: { width: number; height: number },
    device: "desktop" | "mobile",
  ) => {
    const canvasSize = CANVAS_SIZES[device]
    const maxX = canvasSize.width - fieldSize.width - 20
    const maxY = canvasSize.height - fieldSize.height - 20

    return {
      x: Math.max(0, Math.min(position.x, maxX)),
      y: Math.max(0, Math.min(position.y, maxY)),
    }
  }

  const validateSize = (size: { width: number; height: number }, device: "desktop" | "mobile") => {
    const constraints = FIELD_CONSTRAINTS[device]
    return {
      width: Math.max(constraints.minWidth, Math.min(size.width, constraints.maxWidth)),
      height: Math.max(constraints.minHeight, Math.min(size.height, constraints.maxHeight)),
    }
  }

  const addField = useCallback(
    (fieldType: string, position?: { x: number; y: number }) => {
      const desktopConstraints = FIELD_CONSTRAINTS.desktop
      const mobileConstraints = FIELD_CONSTRAINTS.mobile

      const defaultDesktopPosition = position || { x: 50, y: 50 + fields.length * 80 }
      const defaultMobilePosition = { x: 20, y: 50 + fields.length * 70 }

      const desktopSize = { width: desktopConstraints.defaultWidth, height: desktopConstraints.defaultHeight }
      const mobileSize = { width: mobileConstraints.defaultWidth, height: mobileConstraints.defaultHeight }

      const newField: FormField = {
        id: `field_${Date.now()}`,
        type: fieldType,
        label: `New ${fieldType} field`,
        required: false,
        readonly: false,
        hidden: false,
        permanent: false,
        isFormula: false,
        desktop: {
          position: validatePosition(defaultDesktopPosition, desktopSize, "desktop"),
          size: validateSize(desktopSize, "desktop"),
        },
        mobile: {
          position: validatePosition(defaultMobilePosition, mobileSize, "mobile"),
          size: validateSize(mobileSize, "mobile"),
        },
      }

      // Add default configuration for QR Product Scanner
      if (fieldType === "qrProductScanner") {
        newField.qrProductLookupSheetUrl = ""
        newField.qrCodeColumn = "A"
        newField.maxProducts = 10
        newField.fieldMappings = [
          {
            fieldName: "Product Code",
            sheetColumn: "B",
            aggregation: "first",
            isManualEntry: false,
            fieldType: "text",
          },
          {
            fieldName: "Product Name",
            sheetColumn: "C",
            aggregation: "first",
            isManualEntry: false,
            fieldType: "text",
          },
          {
            fieldName: "Stock Quantity",
            sheetColumn: "D",
            aggregation: "sum",
            isManualEntry: false,
            fieldType: "number",
          },
          {
            fieldName: "Delivered",
            sheetColumn: "",
            aggregation: "first",
            isManualEntry: true,
            fieldType: "number",
          },
        ]
      }

      setFields([...fields, newField])
      setHasUnsavedChanges(true)

      if (isMobileView) {
        setShowFieldTypesSheet(false)
      }
    },
    [fields, isMobileView],
  )

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      try {
        setFields((prevFields) =>
          prevFields.map((field) => {
            if (field.id === fieldId) {
              const updatedField = { ...field, ...updates }

              if (updates.desktop) {
                if (updates.desktop.position) {
                  updatedField.desktop.position = validatePosition(
                    updates.desktop.position,
                    updatedField.desktop.size,
                    "desktop",
                  )
                }
                if (updates.desktop.size) {
                  updatedField.desktop.size = validateSize(updates.desktop.size, "desktop")
                  updatedField.desktop.position = validatePosition(
                    updatedField.desktop.position,
                    updatedField.desktop.size,
                    "desktop",
                  )
                }
              }

              if (updates.mobile) {
                if (updates.mobile.position) {
                  updatedField.mobile.position = validatePosition(
                    updates.mobile.position,
                    updatedField.mobile.size,
                    "mobile",
                  )
                }
                if (updates.mobile.size) {
                  updatedField.mobile.size = validateSize(updates.mobile.size, "mobile")
                  updatedField.mobile.position = validatePosition(
                    updatedField.mobile.position,
                    updatedField.mobile.size,
                    "mobile",
                  )
                }
              }

              return updatedField
            }
            return field
          }),
        )
        setHasUnsavedChanges(true)

        if (selectedField?.id === fieldId) {
          setSelectedField((prev) => {
            if (!prev) return null
            const updated = { ...prev, ...updates }
            if (updates.desktop) {
              if (updates.desktop.position) {
                updated.desktop.position = validatePosition(updates.desktop.position, updated.desktop.size, "desktop")
              }
              if (updates.desktop.size) {
                updated.desktop.size = validateSize(updates.desktop.size, "desktop")
                updated.desktop.position = validatePosition(updated.desktop.position, updated.desktop.size, "desktop")
              }
            }
            if (updates.mobile) {
              if (updates.mobile.position) {
                updated.mobile.position = validatePosition(updates.mobile.position, updated.mobile.size, "mobile")
              }
              if (updates.mobile.size) {
                updated.mobile.size = validateSize(updates.mobile.size, "mobile")
                updated.mobile.position = validatePosition(updated.mobile.position, updated.mobile.size, "mobile")
              }
            }
            return updated
          })
        }
      } catch (error) {
        console.error("Field update error:", error)
      }
    },
    [selectedField],
  )

  const deleteField = useCallback(
    (fieldId: string) => {
      setFields((prevFields) => prevFields.filter((field) => field.id !== fieldId))
      if (selectedField?.id === fieldId) {
        setSelectedField(null)
      }
      setHasUnsavedChanges(true)
    },
    [selectedField],
  )

  const handleSave = async (isAutoSave = false) => {
    try {
      console.log("Saving form with fields:", fields)

      const updatedForm = {
        ...form,
        fields: fields,
        backgroundColor: formSettings.backgroundColor,
        columns: formSettings.columns,
        mainGoogleSheetUrl: formSettings.mainGoogleSheetUrl,
        updatedAt: new Date().toISOString(),
      }

      console.log("Updated form to save:", updatedForm)

      // Save locally first
      const allForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      const updatedForms = allForms.map((f: any) => (f.id === form.id ? updatedForm : f))

      if (!allForms.find((f: any) => f.id === form.id)) {
        updatedForms.push(updatedForm)
      }

      localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))
      console.log("Saved forms to localStorage:", updatedForms)

      // Sync to cloud
      if (isConnected) {
        try {
          const cloudStorage = CloudStorageService.getInstance()
          if (allForms.find((f: any) => f.id === form.id)) {
            await cloudStorage.updateForm(form.id, updatedForm)
          } else {
            await cloudStorage.saveForm(updatedForm)
          }
          syncForm(updatedForm, allForms.find((f: any) => f.id === form.id) ? "update" : "create")
        } catch (cloudError) {
          console.warn("Cloud sync failed, adding to offline queue:", cloudError)
          const offlineQueue = OfflineQueue.getInstance()
          offlineQueue.add({
            type: allForms.find((f: any) => f.id === form.id) ? "update_form" : "save_form",
            formId: form.id,
            data: updatedForm,
          })
        }
      } else {
        // Add to offline queue
        const offlineQueue = OfflineQueue.getInstance()
        offlineQueue.add({
          type: allForms.find((f: any) => f.id === form.id) ? "update_form" : "save_form",
          formId: form.id,
          data: updatedForm,
        })
      }

      setHasUnsavedChanges(false)
      setLastSaved(new Date())
      clearDraft()

      if (!isAutoSave) {
        alert("Form saved successfully!")
      }

      onSave(updatedForm)
    } catch (error) {
      console.error("Error saving form:", error)
      alert("Error saving form. Please try again.")
    }
  }

  useEffect(() => {
    if (hasUnsavedChanges && form && fields.length > 0) {
      // Increase auto-save interval to prevent frequent crashes
      const autoSaveTimer = setTimeout(() => {
        try {
          handleSave(true)
        } catch (error) {
          console.error("Auto-save failed:", error)
          // Don't show error to user for auto-save
        }
      }, 60000) // Changed from 10000 (10s) to 60000 (60s)
      return () => clearTimeout(autoSaveTimer)
    }
  }, [hasUnsavedChanges, fields, formSettings, form])

  const handleFormSettingsChange = (newSettings: any) => {
    setFormSettings(newSettings)
    setHasUnsavedChanges(true)
  }

  const getPreviewColumns = () => {
    switch (previewDevice) {
      case "mobile":
        return formSettings.columns.mobile
      case "tablet":
        return formSettings.columns.tablet
      case "desktop":
        return formSettings.columns.desktop
      default:
        return formSettings.columns.desktop
    }
  }

  const getPreviewWidth = () => {
    switch (previewDevice) {
      case "mobile":
        return "375px"
      case "tablet":
        return "768px"
      case "desktop":
        return "100%"
      default:
        return "100%"
    }
  }

  const getAvailableFieldsForFormula = () => {
    return fields
      .filter((f) => f.type === "number" && f.id !== selectedField?.id)
      .map((f) => ({ id: f.id, label: f.label }))
  }

  const resetForm = () => {
    if (confirm("Are you sure you want to reset the form? All unsaved changes will be lost.")) {
      clearDraft()
      loadFormData()
      setSelectedField(null)
    }
  }

  const discardDraft = () => {
    if (confirm("Are you sure you want to discard the draft and reload the saved version?")) {
      clearDraft()
      loadFormData()
      setSelectedField(null)
    }
  }

  const handleFieldSelect = (field: FormField) => {
    setSelectedField(field)
    if (isMobileView) {
      setShowPropertiesSheet(true)
    }
  }

  const dndBackend = isMobileView ? TouchBackend : HTML5Backend

  return (
    <DndProvider backend={dndBackend}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {!isMobileView && (
          <>
            {!leftPanelCollapsed && (
              <div
                className="bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0"
                style={{ width: leftPanelWidth }}
              >
                <FieldTypesPanel
                  fieldTypes={FIELD_TYPES}
                  formSettings={formSettings}
                  onAddField={addField}
                  onFormSettingsChange={handleFormSettingsChange}
                  canvasSize={currentCanvasSize}
                  lastSaved={lastSaved}
                  fields={fields}
                />
              </div>
            )}

            {!leftPanelCollapsed && (
              <div ref={leftResizeRef} className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0" />
            )}

            <div className="flex-1 flex flex-col min-w-0">
              <DesktopToolbar
                form={form}
                fields={fields}
                hasUnsavedChanges={hasUnsavedChanges}
                lastSaved={lastSaved}
                previewMode={previewMode}
                previewDevice={previewDevice}
                leftPanelCollapsed={leftPanelCollapsed}
                rightPanelCollapsed={rightPanelCollapsed}
                onPreviewModeChange={setPreviewMode}
                onPreviewDeviceChange={setPreviewDevice}
                onLeftPanelToggle={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                onRightPanelToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                onSave={() => handleSave(false)}
                onReset={resetForm}
                onDiscardDraft={discardDraft}
              />

              <div className="flex-1 overflow-auto">
                {previewMode ? (
                  <ResponsivePreview
                    fields={fields}
                    backgroundColor={formSettings.backgroundColor}
                    columns={getPreviewColumns()}
                    width={getPreviewWidth()}
                    device={previewDevice}
                  />
                ) : (
                  <Tabs value={designDevice} onValueChange={(value) => setDesignDevice(value as "desktop" | "mobile")}>
                    <div className="border-b bg-white px-4">
                      <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="desktop" className="flex items-center space-x-2">
                          <Monitor className="w-4 h-4" />
                          <span>Desktop Layout</span>
                        </TabsTrigger>
                        <TabsTrigger value="mobile" className="flex items-center space-x-2">
                          <Smartphone className="w-4 h-4" />
                          <span>Mobile Layout</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="desktop" className="mt-0">
                      <DesignCanvas
                        ref={canvasRef}
                        fields={fields}
                        backgroundColor={formSettings.backgroundColor}
                        canvasSize={CANVAS_SIZES.desktop}
                        designDevice="desktop"
                        onFieldUpdate={updateField}
                        onFieldSelect={handleFieldSelect}
                        onFieldDelete={deleteField}
                        onFieldAdd={addField}
                      />
                    </TabsContent>

                    <TabsContent value="mobile" className="mt-0">
                      <DesignCanvas
                        ref={canvasRef}
                        fields={fields}
                        backgroundColor={formSettings.backgroundColor}
                        canvasSize={CANVAS_SIZES.mobile}
                        designDevice="mobile"
                        onFieldUpdate={updateField}
                        onFieldSelect={handleFieldSelect}
                        onFieldDelete={deleteField}
                        onFieldAdd={addField}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>

            {!rightPanelCollapsed && selectedField && !previewMode && (
              <div ref={rightResizeRef} className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0" />
            )}

            {!rightPanelCollapsed && selectedField && !previewMode && (
              <div
                className="bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0"
                style={{ width: rightPanelWidth }}
              >
                <FieldProperties
                  field={selectedField}
                  designDevice={designDevice}
                  availableFields={getAvailableFieldsForFormula()}
                  canvasSize={currentCanvasSize}
                  onUpdate={(updates) => updateField(selectedField.id, updates)}
                  onDelete={() => deleteField(selectedField.id)}
                />
              </div>
            )}
          </>
        )}

        {isMobileView && (
          <div className="flex-1 flex flex-col">
            <MobileToolbar
              form={form}
              fields={fields}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSaved={lastSaved}
              previewMode={previewMode}
              previewDevice={previewDevice}
              selectedField={selectedField}
              onPreviewModeChange={setPreviewMode}
              onPreviewDeviceChange={setPreviewDevice}
              onShowFieldTypes={() => setShowFieldTypesSheet(true)}
              onShowProperties={() => setShowPropertiesSheet(true)}
              onSave={() => handleSave(false)}
              onReset={resetForm}
              onDiscardDraft={discardDraft}
            />

            <div className="flex-1 overflow-auto">
              {previewMode ? (
                <ResponsivePreview
                  fields={fields}
                  backgroundColor={formSettings.backgroundColor}
                  columns={getPreviewColumns()}
                  width={getPreviewWidth()}
                  device={previewDevice}
                />
              ) : (
                <Tabs value={designDevice} onValueChange={(value) => setDesignDevice(value as "desktop" | "mobile")}>
                  <div className="border-b bg-white px-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="desktop" className="flex items-center space-x-1">
                        <Monitor className="w-3 h-3" />
                        <span className="text-xs">Desktop</span>
                      </TabsTrigger>
                      <TabsTrigger value="mobile" className="flex items-center space-x-1">
                        <Smartphone className="w-3 h-3" />
                        <span className="text-xs">Mobile</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="desktop" className="mt-0">
                    <DesignCanvas
                      ref={canvasRef}
                      fields={fields}
                      backgroundColor={formSettings.backgroundColor}
                      canvasSize={CANVAS_SIZES.desktop}
                      designDevice="desktop"
                      onFieldUpdate={updateField}
                      onFieldSelect={handleFieldSelect}
                      onFieldDelete={deleteField}
                      onFieldAdd={addField}
                    />
                  </TabsContent>

                  <TabsContent value="mobile" className="mt-0">
                    <DesignCanvas
                      ref={canvasRef}
                      fields={fields}
                      backgroundColor={formSettings.backgroundColor}
                      canvasSize={CANVAS_SIZES.mobile}
                      designDevice="mobile"
                      onFieldUpdate={updateField}
                      onFieldSelect={handleFieldSelect}
                      onFieldDelete={deleteField}
                      onFieldAdd={addField}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </div>

            <Sheet open={showFieldTypesSheet} onOpenChange={setShowFieldTypesSheet}>
              <SheetContent side="left" className="w-full sm:w-96">
                <SheetHeader>
                  <SheetTitle>Field Types & Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FieldTypesPanel
                    fieldTypes={FIELD_TYPES}
                    formSettings={formSettings}
                    onAddField={addField}
                    onFormSettingsChange={handleFormSettingsChange}
                    canvasSize={currentCanvasSize}
                    lastSaved={lastSaved}
                    fields={fields}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={showPropertiesSheet} onOpenChange={setShowPropertiesSheet}>
              <SheetContent side="right" className="w-full sm:w-96">
                <SheetHeader>
                  <SheetTitle>Field Properties</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  {selectedField && (
                    <FieldProperties
                      field={selectedField}
                      designDevice={designDevice}
                      availableFields={getAvailableFieldsForFormula()}
                      canvasSize={currentCanvasSize}
                      onUpdate={(updates) => updateField(selectedField.id, updates)}
                      onDelete={() => {
                        deleteField(selectedField.id)
                        setShowPropertiesSheet(false)
                      }}
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </DndProvider>
  )
}

function DesktopToolbar({
  form,
  fields,
  hasUnsavedChanges,
  lastSaved,
  previewMode,
  previewDevice,
  leftPanelCollapsed,
  rightPanelCollapsed,
  onPreviewModeChange,
  onPreviewDeviceChange,
  onLeftPanelToggle,
  onRightPanelToggle,
  onSave,
  onReset,
  onDiscardDraft,
}: any) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <Button variant="outline" size="sm" onClick={onLeftPanelToggle}>
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2 min-w-0">
            <h2 className="text-xl font-semibold truncate">Designing: {form.name}</h2>
            <Badge variant="outline">{fields.length} fields</Badge>
          </div>
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="text-xs whitespace-nowrap">
                <AlertCircle className="w-3 h-3 mr-1" />
                Draft
              </Badge>
            )}
            {!hasUnsavedChanges && lastSaved && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                Saved {lastSaved.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {previewMode && (
            <div className="flex items-center space-x-1">
              <Button
                variant={previewDevice === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => onPreviewDeviceChange("mobile")}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === "tablet" ? "default" : "outline"}
                size="sm"
                onClick={() => onPreviewDeviceChange("tablet")}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => onPreviewDeviceChange("desktop")}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
          )}

          {hasUnsavedChanges && (
            <Button variant="outline" size="sm" onClick={onDiscardDraft}>
              Discard
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            onClick={() => onPreviewModeChange(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-1" />
            {previewMode ? "Edit" : "Preview"}
          </Button>

          <Button variant="outline" size="sm" onClick={onRightPanelToggle}>
            <PanelRightOpen className="w-4 h-4" />
          </Button>

          <Button
            id="save-button"
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2"
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Form
          </Button>
        </div>
      </div>
    </div>
  )
}

function MobileToolbar({
  form,
  fields,
  hasUnsavedChanges,
  lastSaved,
  previewMode,
  previewDevice,
  selectedField,
  onPreviewModeChange,
  onPreviewDeviceChange,
  onShowFieldTypes,
  onShowProperties,
  onSave,
  onReset,
  onDiscardDraft,
}: any) {
  return (
    <div className="bg-white border-b border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold truncate flex-1 min-w-0 mr-2">{form.name}</h2>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onShowFieldTypes}>
            <Menu className="w-4 h-4" />
          </Button>
          {selectedField && !previewMode && (
            <Button variant="outline" size="sm" onClick={onShowProperties}>
              <Settings className="w-4 h-4" />
            </Button>
          )}
          <Button
            id="save-button"
            size="sm"
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {fields.length} fields
          </Badge>
          {hasUnsavedChanges && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Draft
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {previewMode && (
            <div className="flex items-center space-x-1">
              <Button
                variant={previewDevice === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => onPreviewDeviceChange("mobile")}
              >
                <Smartphone className="w-3 h-3" />
              </Button>
              <Button
                variant={previewDevice === "tablet" ? "default" : "outline"}
                size="sm"
                onClick={() => onPreviewDeviceChange("tablet")}
              >
                <Tablet className="w-3 h-3" />
              </Button>
            </div>
          )}
          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            onClick={() => onPreviewModeChange(!previewMode)}
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function FieldTypesPanel({
  fieldTypes,
  formSettings,
  onAddField,
  onFormSettingsChange,
  canvasSize,
  lastSaved,
  fields,
}: any) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Field Types</h3>
      <div className="space-y-2 mb-6">
        {fieldTypes.map((fieldType: any) => (
          <FieldTypeItem key={fieldType.id} fieldType={fieldType} onAdd={() => onAddField(fieldType.id)} />
        ))}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Form Settings</h3>
        <div className="space-y-4">
          <div>
            <Label>Main Google Sheet URL</Label>
            <Input
              value={formSettings.mainGoogleSheetUrl}
              onChange={(e) =>
                onFormSettingsChange({
                  ...formSettings,
                  mainGoogleSheetUrl: e.target.value,
                })
              }
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">All form submissions will go to this sheet</p>
          </div>

          <div>
            <Label>Background Color</Label>
            <Input
              type="color"
              value={formSettings.backgroundColor}
              onChange={(e) =>
                onFormSettingsChange({
                  ...formSettings,
                  backgroundColor: e.target.value,
                })
              }
              className="w-full h-10"
            />
          </div>

          <div>
            <Label>Responsive Columns</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <Label className="text-xs">Mobile</Label>
                <Select
                  value={formSettings.columns.mobile.toString()}
                  onValueChange={(value) =>
                    onFormSettingsChange({
                      ...formSettings,
                      columns: { ...formSettings.columns, mobile: Number.parseInt(value) },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tablet</Label>
                <Select
                  value={formSettings.columns.tablet.toString()}
                  onValueChange={(value) =>
                    onFormSettingsChange({
                      ...formSettings,
                      columns: { ...formSettings.columns, tablet: Number.parseInt(value) },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Desktop</Label>
                <Select
                  value={formSettings.columns.desktop.toString()}
                  onValueChange={(value) =>
                    onFormSettingsChange({
                      ...formSettings,
                      columns: { ...formSettings.columns, desktop: Number.parseInt(value) },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 border-t pt-3">
            <div>
              Canvas: {canvasSize.width}×{canvasSize.height}px
            </div>
            <div>Fields: {fields.length}</div>
            {lastSaved && <div>Last saved: {lastSaved.toLocaleTimeString()}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldTypeItem({ fieldType, onAdd }: { fieldType: any; onAdd: () => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "fieldType",
    item: { fieldType: fieldType.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const Icon = fieldType.icon

  return (
    <div
      ref={drag}
      className={`p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={onAdd}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-blue-600" />
        <div>
          <div className="font-medium text-sm">{fieldType.label}</div>
          <div className="text-xs text-gray-500">{fieldType.description}</div>
        </div>
      </div>
    </div>
  )
}

const DesignCanvas = React.forwardRef<
  HTMLDivElement,
  {
    fields: FormField[]
    backgroundColor: string
    canvasSize: { width: number; height: number }
    designDevice: "desktop" | "mobile"
    onFieldUpdate: (fieldId: string, updates: Partial<FormField>) => void
    onFieldSelect: (field: FormField) => void
    onFieldDelete: (fieldId: string) => void
    onFieldAdd: (fieldType: string, position?: { x: number; y: number }) => void
  }
>(
  (
    { fields, backgroundColor, canvasSize, designDevice, onFieldUpdate, onFieldSelect, onFieldDelete, onFieldAdd },
    ref,
  ) => {
    const findSnapPosition = (draggedField: FormField, newPosition: { x: number; y: number }) => {
      const snapDistance = 20
      const draggedLayout = draggedField[designDevice]
      let snapX = newPosition.x
      let snapY = newPosition.y

      fields.forEach((field) => {
        if (field.id === draggedField.id) return

        const fieldLayout = field[designDevice]
        const fieldRight = fieldLayout.position.x + fieldLayout.size.width
        const fieldBottom = fieldLayout.position.y + fieldLayout.size.height
        const draggedRight = newPosition.x + draggedLayout.size.width
        const draggedBottom = newPosition.y + draggedLayout.size.height

        if (Math.abs(newPosition.x - fieldLayout.position.x) < snapDistance) {
          snapX = fieldLayout.position.x
        } else if (Math.abs(newPosition.x - fieldRight) < snapDistance) {
          snapX = fieldRight
        } else if (Math.abs(draggedRight - fieldLayout.position.x) < snapDistance) {
          snapX = fieldLayout.position.x - draggedLayout.size.width
        } else if (Math.abs(newPosition.x - fieldRight) < snapDistance) {
          snapX = fieldRight
        }

        if (Math.abs(newPosition.y - fieldLayout.position.y) < snapDistance) {
          snapY = fieldLayout.position.y
        } else if (Math.abs(newPosition.y - fieldBottom) < snapDistance) {
          snapY = fieldBottom
        } else if (Math.abs(draggedBottom - fieldLayout.position.y) < snapDistance) {
          snapY = fieldLayout.position.y - draggedLayout.size.height
        } else if (Math.abs(newPosition.y - fieldBottom) < snapDistance) {
          snapY = fieldBottom
        }
      })

      if (Math.abs(newPosition.x) < snapDistance) snapX = 0
      if (Math.abs(newPosition.y) < snapDistance) snapY = 0
      if (Math.abs(newPosition.x + draggedLayout.size.width - canvasSize.width) < snapDistance) {
        snapX = canvasSize.width - draggedLayout.size.width
      }
      if (Math.abs(newPosition.y + draggedLayout.size.height - canvasSize.height) < snapDistance) {
        snapY = canvasSize.height - draggedLayout.size.height
      }

      return { x: snapX, y: snapY }
    }

    const [{ isOver }, drop] = useDrop(
      () => ({
        accept: ["fieldType", "field"],
        drop: (item: { fieldType?: string; fieldId?: string }, monitor) => {
          try {
            const clientOffset = monitor.getClientOffset()
            const canvasElement = document.getElementById(`design-canvas-${designDevice}`)
            if (clientOffset && canvasElement) {
              const canvasRect = canvasElement.getBoundingClientRect()
              const constraints = FIELD_CONSTRAINTS[designDevice]

              let position = {
                x: Math.max(
                  0,
                  Math.min(
                    clientOffset.x - canvasRect.left - constraints.defaultWidth / 2,
                    canvasSize.width - constraints.defaultWidth,
                  ),
                ),
                y: Math.max(
                  0,
                  Math.min(
                    clientOffset.y - canvasRect.top - constraints.defaultHeight / 2,
                    canvasSize.height - constraints.defaultHeight,
                  ),
                ),
              }

              if (item.fieldType && fields.length > 0) {
                const lastField = fields[fields.length - 1]
                const lastLayout = lastField[designDevice]

                const nextToLastField = {
                  x: lastLayout.position.x + lastLayout.size.width + 20,
                  y: lastLayout.position.y,
                }

                if (nextToLastField.x + constraints.defaultWidth <= canvasSize.width) {
                  position = nextToLastField
                } else {
                  position = {
                    x: 20,
                    y: lastLayout.position.y + lastLayout.size.height + 20,
                  }
                }
              }

              if (item.fieldType) {
                onFieldAdd(item.fieldType, position)
              }
            }
          } catch (error) {
            console.error("Drop error:", error)
          }
        },
        collect: (monitor) => ({
          isOver: monitor.isOver(),
        }),
      }),
      [onFieldAdd, canvasSize, designDevice, fields],
    )

    return (
      <div className="p-4 md:p-8 flex justify-center">
        <div
          id={`design-canvas-${designDevice}`}
          ref={(node) => {
            drop(node)
            if (ref) {
              if (typeof ref === "function") {
                ref(node)
              } else {
                ref.current = node
              }
            }
          }}
          className="relative border-2 border-dashed border-gray-300 bg-white shadow-lg"
          style={{
            backgroundColor,
            width: canvasSize.width,
            height: canvasSize.height,
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
              backgroundSize: "20px 20px",
            }}
          />

          <div className="absolute top-2 left-2 text-xs text-gray-400 bg-white px-2 py-1 rounded shadow">
            {`${designDevice.charAt(0).toUpperCase() + designDevice.slice(1)}: ${canvasSize.width}×${canvasSize.height}px`}
          </div>

          {isOver && (
            <div className="absolute inset-0 bg-blue-100 bg-opacity-30 border-2 border-dashed border-blue-300 flex items-center justify-center z-10">
              <div className="text-blue-600 text-lg font-medium bg-white px-4 py-2 rounded shadow">Drop field here</div>
            </div>
          )}

          {fields.map((field) => (
            <DraggableField
              key={field.id}
              field={field}
              designDevice={designDevice}
              canvasSize={canvasSize}
              onFieldUpdate={onFieldUpdate}
              onFieldSelect={onFieldSelect}
              onFieldDelete={onFieldDelete}
              findSnapPosition={findSnapPosition}
            />
          ))}

          {fields.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Plus className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Start Building Your {designDevice.charAt(0).toUpperCase() + designDevice.slice(1)} Layout
                </h3>
                <p className="text-sm">Drag field types from the left panel or click to add them</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
)

DesignCanvas.displayName = "DesignCanvas"

function DraggableField({
  field,
  designDevice,
  canvasSize,
  onFieldUpdate,
  onFieldSelect,
  onFieldDelete,
  findSnapPosition,
}: {
  field: FormField
  designDevice: "desktop" | "mobile"
  canvasSize: { width: number; height: number }
  onFieldUpdate: (fieldId: string, updates: Partial<FormField>) => void
  onFieldSelect: (field: FormField) => void
  onFieldDelete: (fieldId: string) => void
  findSnapPosition: (field: FormField, position: { x: number; y: number }) => { x: number; y: number }
}) {
  const currentLayout = field[designDevice]
  const constraints = FIELD_CONSTRAINTS[designDevice]

  const [{ isDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: "field",
      item: { fieldId: field.id, initialPosition: currentLayout.position },
      end: (item, monitor) => {
        try {
          const dropResult = monitor.getDropResult()
          if (!dropResult) {
            const clientOffset = monitor.getClientOffset()
            const canvasElement = document.getElementById(`design-canvas-${designDevice}`)
            if (clientOffset && canvasElement) {
              const canvasRect = canvasElement.getBoundingClientRect()
              let newPosition = {
                x: clientOffset.x - canvasRect.left - currentLayout.size.width / 2,
                y: clientOffset.y - canvasRect.top - currentLayout.size.height / 2,
              }

              const maxX = canvasSize.width - currentLayout.size.width - 20
              const maxY = canvasSize.height - currentLayout.size.height - 20

              newPosition = {
                x: Math.max(0, Math.min(newPosition.x, maxX)),
                y: Math.max(0, Math.min(newPosition.y, maxY)),
              }

              const snappedPosition = findSnapPosition(field, newPosition)

              snappedPosition.x = Math.max(0, Math.min(snappedPosition.x, maxX))
              snappedPosition.y = Math.max(0, Math.min(snappedPosition.y, maxY))

              if (snappedPosition.x !== currentLayout.position.x || snappedPosition.y !== currentLayout.position.y) {
                onFieldUpdate(field.id, {
                  [designDevice]: {
                    ...currentLayout,
                    position: snappedPosition,
                  },
                })
              }
            }
          }
        } catch (error) {
          console.error("Drag end error:", error)
        }
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [field.id, currentLayout, designDevice, canvasSize, onFieldUpdate, findSnapPosition],
  )

  const renderFieldPreview = () => {
    const commonProps = {
      className: "w-full text-sm",
      placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
      disabled: field.readonly,
    }

    switch (field.type) {
      case "text":
        return <Input {...commonProps} />
      case "number":
        return (
          <div className="relative">
            <Input {...commonProps} type="number" />
            {field.isFormula && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Calculator className="w-3 h-3 text-blue-500" />
              </div>
            )}
          </div>
        )
      case "date":
        return <Input {...commonProps} type="date" />
      case "dropdown":
        return (
          <Select>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select option..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              )) || <SelectItem value="option1">Option 1</SelectItem>}
            </SelectContent>
          </Select>
        )
      case "productLookup":
        return (
          <div className="flex items-center border rounded p-2 text-sm">
            <Search className="w-3 h-3 mr-2 text-blue-500" />
            <span className="text-gray-500">Product Code-Name Lookup</span>
          </div>
        )
      case "qr":
        return (
          <Button variant="outline" className="w-full text-sm h-8">
            <QrCode className="w-3 h-3 mr-2" />
            Scan QR Code
          </Button>
        )
      case "qrProductScanner":
        return (
          <div className="space-y-2">
            <Button variant="outline" className="w-full text-sm h-8">
              <Database className="w-3 h-3 mr-2" />
              Scan QR for Products
            </Button>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {`${field.fieldMappings?.length || 0} field mappings configured`}
            </div>
          </div>
        )
      case "geolocation":
        return (
          <div className="flex items-center space-x-2 p-2 border rounded text-sm">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500">Auto-detected location</span>
          </div>
        )
      case "datetime":
        return (
          <div className="flex items-center space-x-2 p-2 border rounded text-sm">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500">{new Date().toLocaleString()}</span>
          </div>
        )
      case "user":
        return (
          <div className="flex items-center space-x-2 p-2 border rounded text-sm">
            <User className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500">Current user</span>
          </div>
        )
      default:
        return <Input {...commonProps} />
    }
  }

  const isNearBoundary =
    currentLayout.position.x + currentLayout.size.width > canvasSize.width - 50 ||
    currentLayout.position.y + currentLayout.size.height > canvasSize.height - 50

  return (
    <div
      ref={dragPreview}
      className={`absolute group ${isDragging ? "opacity-30" : ""} ${field.hidden ? "opacity-50 border-dashed" : ""} ${isNearBoundary ? "ring-2 ring-orange-300" : ""}`}
      style={{
        left: Math.max(0, currentLayout.position.x),
        top: Math.max(0, currentLayout.position.y),
        width: Math.max(constraints.minWidth, currentLayout.size.width),
        height: Math.max(constraints.minHeight, currentLayout.size.height),
        zIndex: isDragging ? 1000 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onFieldSelect(field)
      }}
    >
      <div
        className="relative p-2 border-2 border-gray-200 hover:border-blue-300 group-hover:shadow-md cursor-pointer rounded-lg bg-white transition-all h-full"
        style={{
          minHeight: currentLayout.size.height,
        }}
      >
        <div className="absolute -top-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onFieldSelect(field)
            }}
          >
            <Settings className="w-2 h-2" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onFieldDelete(field.id)
            }}
          >
            <Trash2 className="w-2 h-2" />
          </Button>
        </div>

        <div
          ref={drag}
          className="absolute -left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>

        <div className="mb-1">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {field.permanent && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Permanent
              </Badge>
            )}
            {field.readonly && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Read-only
              </Badge>
            )}
            {field.hidden && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Hidden
              </Badge>
            )}
            {field.isFormula && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Formula
              </Badge>
            )}
          </div>
        </div>

        <div style={{ maxWidth: currentLayout.size.width - 16 }}>{renderFieldPreview()}</div>

        {field.googleSheetColumn && (
          <div className="mt-1 text-xs text-gray-500">
            → Export Column: {field.googleSheetColumn}
            {field.importSheetUrl && field.importCell && <div>← Import: {field.importCell}</div>}
            {field.type === "qr" && field.qrScanSheetUrl && field.qrScanCell && (
              <div>⚡ QR Scan: {field.qrScanCell}</div>
            )}
            {field.isFormula && field.formula && <div>📊 Formula: {field.formula}</div>}
          </div>
        )}

        <div className="absolute bottom-1 right-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100">
          {`${currentLayout.size.width}×${currentLayout.size.height} @ ${currentLayout.position.x},${currentLayout.position.y}`}
        </div>
      </div>
    </div>
  )
}

function FieldProperties({
  field,
  designDevice,
  availableFields,
  canvasSize,
  onUpdate,
  onDelete,
}: {
  field: FormField
  designDevice: "desktop" | "mobile"
  availableFields: { id: string; label: string }[]
  canvasSize: { width: number; height: number }
  onUpdate: (updates: Partial<FormField>) => void
  onDelete: () => void
}) {
  const currentLayout = field[designDevice]
  const constraints = FIELD_CONSTRAINTS[designDevice]
  const maxX = canvasSize.width - currentLayout.size.width
  const maxY = canvasSize.height - currentLayout.size.height
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Field Properties ({designDevice.charAt(0).toUpperCase() + designDevice.slice(1)})
        </h3>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Field Label</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Enter field label"
          />
        </div>

        <div>
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Field Options</h4>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required-checkbox"
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: !!checked })}
            />
            <Label htmlFor="required-checkbox">Mandatory</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="readonly-checkbox"
              checked={field.readonly}
              onCheckedChange={(checked) => onUpdate({ readonly: !!checked })}
            />
            <Label htmlFor="readonly-checkbox">Read-only</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hidden-checkbox"
              checked={field.hidden}
              onCheckedChange={(checked) => onUpdate({ hidden: !!checked })}
            />
            <Label htmlFor="hidden-checkbox">Hidden</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="permanent-checkbox"
              checked={field.permanent}
              onCheckedChange={(checked) => onUpdate({ permanent: !!checked })}
            />
            <Label htmlFor="permanent-checkbox">Permanent</Label>
          </div>

          {field.type === "number" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="formula-checkbox"
                checked={field.isFormula}
                onCheckedChange={(checked) => onUpdate({ isFormula: !!checked })}
              />
              <Label htmlFor="formula-checkbox">Formula Field</Label>
            </div>
          )}
        </div>

        {field.type === "dropdown" && (
          <div>
            <Label>Dropdown Options</Label>
            <Textarea
              value={field.options?.join("\n") || ""}
              onChange={(e) => onUpdate({ options: e.target.value.split("\n").filter(Boolean) })}
              placeholder="Enter each option on a new line"
              rows={4}
            />
          </div>
        )}

        {field.type === "productLookup" && (
          <div className="space-y-3">
            <h4 className="font-medium">Product Lookup Configuration</h4>

            <div>
              <Label>Lookup Sheet URL</Label>
              <Input
                value={field.lookupSheetUrl || ""}
                onChange={(e) => onUpdate({ lookupSheetUrl: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="text-xs"
              />
              <p className="text-xs text-gray-500 mt-1">Google Sheet containing product data</p>
            </div>

            <div>
              <Label>Code Column</Label>
              <Input
                value={field.codeColumn || ""}
                onChange={(e) => onUpdate({ codeColumn: e.target.value })}
                placeholder="e.g., A or product_code"
              />
              <p className="text-xs text-gray-500 mt-1">Column containing product codes</p>
            </div>

            <div>
              <Label>Name Column</Label>
              <Input
                value={field.nameColumn || ""}
                onChange={(e) => onUpdate({ nameColumn: e.target.value })}
                placeholder="e.g., B or product_name"
              />
              <p className="text-xs text-gray-500 mt-1">Column containing product names</p>
            </div>

            <div>
              <Label>Additional Columns (comma separated)</Label>
              <Input
                value={field.additionalColumns?.join(",") || ""}
                onChange={(e) =>
                  onUpdate({
                    additionalColumns: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g., price,stock,category"
              />
              <p className="text-xs text-gray-500 mt-1">Other columns to fetch (max 3 recommended)</p>
            </div>

            <div className="border-t pt-3">
              <h5 className="font-medium text-sm mb-2">Export Configuration</h5>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Code Export Column</Label>
                  <Input
                    value={field.codeExportColumn || ""}
                    onChange={(e) => onUpdate({ codeExportColumn: e.target.value })}
                    placeholder="e.g., A"
                  />
                </div>

                <div>
                  <Label>Name Export Column</Label>
                  <Input
                    value={field.nameExportColumn || ""}
                    onChange={(e) => onUpdate({ nameExportColumn: e.target.value })}
                    placeholder="e.g., B"
                  />
                </div>
              </div>

              <div className="mt-2">
                <Label>Additional Export Columns (JSON)</Label>
                <Textarea
                  value={field.additionalExportColumns || ""}
                  onChange={(e) => onUpdate({ additionalExportColumns: e.target.value })}
                  placeholder='{"price":"C","stock":"D"}'
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">JSON mapping of data to columns</p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded text-xs">
              <h5 className="font-medium mb-1">Performance Tips:</h5>
              <div className="space-y-1 text-gray-600">
                <div>• Use a dedicated sheet for lookups</div>
                <div>• Keep data sorted by code for faster lookups</div>
                <div>• Limit additional columns to essential data</div>
                <div>• For very large datasets (over 10k rows), consider pagination</div>
              </div>
            </div>
          </div>
        )}

        {field.type === "qrProductScanner" && (
          <div className="space-y-3">
            <h4 className="font-medium">QR Product Scanner Configuration</h4>

            <div>
              <Label>Product Lookup Sheet URL</Label>
              <Input
                value={field.qrProductLookupSheetUrl || ""}
                onChange={(e) => onUpdate({ qrProductLookupSheetUrl: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="text-xs"
              />
              <p className="text-xs text-gray-500 mt-1">Google Sheet containing product data linked to QR codes</p>
            </div>

            <div>
              <Label>QR Code Column</Label>
              <Input
                value={field.qrCodeColumn || "A"}
                onChange={(e) => onUpdate({ qrCodeColumn: e.target.value })}
                placeholder="e.g., A"
              />
              <p className="text-xs text-gray-500 mt-1">Column containing QR code identifiers</p>
            </div>

            <div>
              <Label>Maximum Products</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={field.maxProducts || 10}
                onChange={(e) => onUpdate({ maxProducts: Number.parseInt(e.target.value) || 10 })}
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of product fields to generate (1-50)</p>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium text-sm">Field Mappings</h5>
              <div className="space-y-2">
                {(field.fieldMappings || []).map((mapping, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 p-2 border rounded">
                    <Input
                      placeholder="Field Name"
                      value={mapping.fieldName || ""}
                      onChange={(e) => {
                        const newMappings = [...(field.fieldMappings || [])]
                        newMappings[index] = { ...mapping, fieldName: e.target.value }
                        onUpdate({ fieldMappings: newMappings })
                      }}
                    />
                    <Input
                      placeholder="Column"
                      value={mapping.sheetColumn || ""}
                      onChange={(e) => {
                        const newMappings = [...(field.fieldMappings || [])]
                        newMappings[index] = { ...mapping, sheetColumn: e.target.value }
                        onUpdate({ fieldMappings: newMappings })
                      }}
                    />
                    <Select
                      value={mapping.aggregation || "first"}
                      onValueChange={(value: "first" | "sum" | "average" | "last") => {
                        const newMappings = [...(field.fieldMappings || [])]
                        newMappings[index] = { ...mapping, aggregation: value }
                        onUpdate({ fieldMappings: newMappings })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">First</SelectItem>
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="last">Last</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`manual-entry-${index}`}
                        checked={mapping.isManualEntry || false}
                        onCheckedChange={(checked) => {
                          const newMappings = [...(field.fieldMappings || [])]
                          newMappings[index] = { ...mapping, isManualEntry: !!checked }
                          onUpdate({ fieldMappings: newMappings })
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newMappings = (field.fieldMappings || []).filter((_, i) => i !== index)
                          onUpdate({ fieldMappings: newMappings })
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMapping = {
                      fieldName: "",
                      sheetColumn: "",
                      aggregation: "first" as const,
                      isManualEntry: false,
                      fieldType: "text" as const,
                    }
                    onUpdate({ fieldMappings: [...(field.fieldMappings || []), newMapping] })
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Field Mapping
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded text-xs">
              <h5 className="font-medium mb-1">How it works:</h5>
              <div className="space-y-1 text-gray-600">
                <div>1. Scan QR code to get identifier</div>
                <div>2. Fetch all rows with that QR code from sheet</div>
                <div>3. Group by unique products and aggregate data</div>
                <div>4. Create dynamic fields for each product</div>
                <div>5. Mix read-only (from sheet) and manual entry fields</div>
              </div>
            </div>
          </div>
        )}

        {field.type === "number" && field.isFormula && (
          <div className="space-y-3">
            <h4 className="font-medium">Formula Configuration</h4>
            <div>
              <Label>Formula</Label>
              <Input
                value={field.formula || ""}
                onChange={(e) => onUpdate({ formula: e.target.value })}
                placeholder="e.g., field_123 + field_456 * 2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use field IDs to reference other number fields. Supports +, -, *, /, (), etc.
              </p>
            </div>

            {availableFields.length > 0 && (
              <div>
                <Label>Available Fields for Formula</Label>
                <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                  {availableFields.map((f) => (
                    <div key={f.id} className="flex justify-between">
                      <span>{f.label}</span>
                      <code className="text-blue-600">{f.id}</code>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Copy field IDs to use in your formula</p>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded text-xs">
              <h5 className="font-medium mb-1">Formula Examples:</h5>
              <div className="space-y-1 text-gray-600">
                <div>• Simple: field_123 + field_456</div>
                <div>• Complex: (field_123 * 0.1) + field_456</div>
                <div>• Percentage: field_123 * field_456 / 100</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium">Google Sheets Integration</h4>

          <div>
            <Label>Export to Column (Main Form)</Label>
            <Input
              value={field.googleSheetColumn || ""}
              onChange={(e) => onUpdate({ googleSheetColumn: e.target.value })}
              placeholder="e.g., A, B, C..."
            />
            <p className="text-xs text-gray-500 mt-1">Column in main form sheet for Send button</p>
          </div>

          <div>
            <Label>Import Sheet URL</Label>
            <Input
              value={field.importSheetUrl || ""}
              onChange={(e) => onUpdate({ importSheetUrl: e.target.value })}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="text-xs"
            />
          </div>

          <div>
            <Label>Import from Cell</Label>
            <Input
              value={field.importCell || ""}
              onChange={(e) => onUpdate({ importCell: e.target.value })}
              placeholder="e.g., A1, B2, C3..."
            />
            <p className="text-xs text-gray-500 mt-1">Cell to import data from (optional)</p>
          </div>

          {field.type === "qr" && (
            <>
              <div className="border-t pt-3">
                <h5 className="font-medium text-sm mb-2">QR Scan Trigger Export</h5>
                <p className="text-xs text-gray-500 mb-3">
                  Separate export when QR is scanned (before main form submission)
                </p>

                <div className="space-y-2">
                  <div>
                    <Label>QR Scan Sheet URL</Label>
                    <Input
                      value={field.qrScanSheetUrl || ""}
                      onChange={(e) => onUpdate({ qrScanSheetUrl: e.target.value })}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <Label>QR Scan Cell</Label>
                    <Input
                      value={field.qrScanCell || ""}
                      onChange={(e) => onUpdate({ qrScanCell: e.target.value })}
                      placeholder="e.g., A1, B2, C3..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Cell to export QR data immediately when scanned</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">
            Position & Size ({designDevice.charAt(0).toUpperCase() + designDevice.slice(1)})
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>X Position</Label>
              <Input
                type="number"
                min="0"
                max={maxX}
                value={currentLayout.position.x}
                onChange={(e) =>
                  onUpdate({
                    [designDevice]: {
                      ...currentLayout,
                      position: {
                        ...currentLayout.position,
                        x: Math.max(0, Math.min(Number.parseInt(e.target.value) || 0, maxX)),
                      },
                    },
                  })
                }
              />
              <p className="text-xs text-gray-500">Max: {maxX}</p>
            </div>
            <div>
              <Label>Y Position</Label>
              <Input
                type="number"
                min="0"
                max={maxY}
                value={currentLayout.position.y}
                onChange={(e) =>
                  onUpdate({
                    [designDevice]: {
                      ...currentLayout,
                      position: {
                        ...currentLayout.position,
                        y: Math.max(0, Math.min(Number.parseInt(e.target.value) || 0, maxY)),
                      },
                    },
                  })
                }
              />
              <p className="text-xs text-gray-500">Max: {maxY}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Width (px)</Label>
              <Input
                type="number"
                min={constraints.minWidth}
                max={constraints.maxWidth}
                value={currentLayout.size.width}
                onChange={(e) =>
                  onUpdate({
                    [designDevice]: {
                      ...currentLayout,
                      size: {
                        ...currentLayout.size,
                        width: Math.max(
                          constraints.minWidth,
                          Math.min(Number.parseInt(e.target.value) || constraints.defaultWidth, constraints.maxWidth),
                        ),
                      },
                    },
                  })
                }
              />
              <p className="text-xs text-gray-500">
                {constraints.minWidth}-{constraints.maxWidth}px
              </p>
            </div>
            <div>
              <Label>Height (px)</Label>
              <Input
                type="number"
                min={constraints.minHeight}
                max={constraints.maxHeight}
                value={currentLayout.size.height}
                onChange={(e) =>
                  onUpdate({
                    [designDevice]: {
                      ...currentLayout,
                      size: {
                        ...currentLayout.size,
                        height: Math.max(
                          constraints.minHeight,
                          Math.min(Number.parseInt(e.target.value) || constraints.defaultHeight, constraints.maxHeight),
                        ),
                      },
                    },
                  })
                }
              />
              <p className="text-xs text-gray-500">
                {constraints.minHeight}-{constraints.maxHeight}px
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div>
              {`Current: ${currentLayout.size.width}×${currentLayout.size.height}px @ ${currentLayout.position.x}, ${currentLayout.position.y}`}
            </div>
            <div>{`Canvas: ${canvasSize.width}×${canvasSize.height}px`}</div>
            <div>{`Device: ${designDevice}`}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResponsivePreview({ fields, backgroundColor, columns, width, device }: any) {
  const containerStyle = {
    backgroundColor: backgroundColor,
    width: width,
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "16px",
    padding: "16px",
    boxSizing: "border-box",
  }

  return (
    <div className="flex justify-center items-center h-full">
      <div style={containerStyle}>
        {fields.map((field) => (
          <div key={field.id}>
            <PreviewField field={field} device={device} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewField({ field, device }: any) {
  const commonProps = {
    className: "w-full text-sm",
    placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
    disabled: field.readonly,
    readOnly: field.readonly,
  }

  return (
    <div>
      <Label className="text-xs font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.type === "text" && <Input {...commonProps} />}

      {field.type === "number" && (
        <div className="relative">
          <Input {...commonProps} type="number" />
          {field.isFormula && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Calculator className="w-4 h-4 text-blue-500" />
            </div>
          )}
        </div>
      )}

      {field.type === "date" && <Input {...commonProps} type="date" />}

      {field.type === "dropdown" && (
        <Select disabled={field.readonly}>
          <SelectTrigger className="text-sm">
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
      )}

      {field.type === "productLookup" && (
        <div className="flex items-center border rounded p-2 text-sm">
          <Search className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-gray-500">Product Code-Name Lookup</span>
        </div>
      )}

      {field.type === "qr" && (
        <Button variant="outline" className="w-full" disabled={field.readonly}>
          <QrCode className="w-4 h-4 mr-2" />
          Scan QR Code
        </Button>
      )}

      {field.type === "qrProductScanner" && (
        <div className="space-y-2">
          <Button variant="outline" className="w-full" disabled={field.readonly}>
            <Database className="w-4 h-4 mr-2" />
            Scan QR for Products
          </Button>
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Dynamic product fields will appear after scanning
          </div>
        </div>
      )}

      {field.type === "geolocation" && (
        <div className="flex items-center space-x-2 p-2 border rounded">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Auto-detected location</span>
        </div>
      )}

      {field.type === "datetime" && (
        <div className="flex items-center space-x-2 p-2 border rounded">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">{new Date().toLocaleString()}</span>
        </div>
      )}

      {field.type === "user" && (
        <div className="flex items-center space-x-2 p-2 border rounded">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Current user</span>
        </div>
      )}
    </div>
  )
}
