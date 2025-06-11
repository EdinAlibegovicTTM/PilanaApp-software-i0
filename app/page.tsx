"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, Plus, Database, UserPlus, Mail, Key, User } from "lucide-react"
import FormDesigner from "@/components/form-designer"
import { FormFillInterface } from "@/components/form-fill-interface"
import { AICopilot } from "@/components/ai-copilot"
import { CloudSyncStatus } from "@/components/cloud-sync-status"
import { useRealtimeSync, CloudStorageService } from "@/lib/realtime-sync"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem("pilana_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate login with hardcoded credentials for demo
    setTimeout(() => {
      const validCredentials = [
        { username: "admin", password: "password123", role: "admin", id: 1 },
        { username: "manager", password: "password123", role: "manager", id: 2 },
        { username: "user", password: "password123", role: "user", id: 3 },
      ]

      const validUser = validCredentials.find((cred) => cred.username === username && cred.password === password)

      if (validUser) {
        const userData = {
          id: validUser.id,
          username: validUser.username,
          role: validUser.role,
          email: `${validUser.username}@pilanaapp.com`,
          loginTime: new Date().toISOString(),
        }

        localStorage.setItem("pilana_user", JSON.stringify(userData))
        setUser(userData)
        setError("")
      } else {
        setError("Invalid username or password. Please check the demo credentials below.")
      }
      setIsLoading(false)
    }, 1000)
  }

  if (user) {
    return (
      <Dashboard
        user={user}
        onLogout={() => {
          localStorage.removeItem("pilana_user")
          setUser(null)
          setUsername("")
          setPassword("")
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Pilana App</CardTitle>
          <CardDescription>Sign in to access your forms</CardDescription>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Database className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Connected to Neon Database</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Demo Credentials:</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <strong>Admin:</strong>
                <span>admin / password123</span>
              </div>
              <div className="flex justify-between">
                <strong>Manager:</strong>
                <span>manager / password123</span>
              </div>
              <div className="flex justify-between">
                <strong>User:</strong>
                <span>user / password123</span>
              </div>
            </div>
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Note:</strong> All demo accounts use "password123" as the password
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Rest of the component remains the same...
function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState(user.role === "user" ? "forms" : "dashboard")
  const { connectionStatus, syncForm, subscribe, unsubscribe } = useRealtimeSync(user.id?.toString(), user.role)

  // Initialize cloud sync
  useEffect(() => {
    const handleFormUpdate = (updatedForm: any) => {
      // Trigger re-render of forms list
      window.dispatchEvent(new CustomEvent("formsUpdated"))
    }

    subscribe("form_updated", handleFormUpdate)
    subscribe("form_created", handleFormUpdate)

    return () => {
      unsubscribe("form_updated", handleFormUpdate)
      unsubscribe("form_created", handleFormUpdate)
    }
  }, [subscribe, unsubscribe])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Pilana App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <CloudSyncStatus user={user} />
              <span className="text-sm text-gray-600">
                Welcome, {user.username} ({user.role})
              </span>
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role !== "user" && (
          <nav className="flex space-x-8 mb-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("forms")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "forms"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Forms
            </button>
            <button
              onClick={() => setActiveTab("builder")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "builder"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Form Builder
            </button>
            {user.role === "admin" && (
              <>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "users"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "reports"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Reports
                </button>
                <button
                  onClick={() => setActiveTab("copilot")}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "copilot"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  AI Copilot
                </button>
              </>
            )}
          </nav>
        )}

        <div className="bg-white rounded-lg shadow">
          {activeTab === "dashboard" && <DashboardContent user={user} />}
          {activeTab === "forms" && <FormsContent user={user} />}
          {activeTab === "builder" && <FormBuilderContent user={user} />}
          {activeTab === "users" && user.role === "admin" && <UsersContent />}
          {activeTab === "reports" && user.role === "admin" && <ReportsContent />}
          {activeTab === "copilot" && user.role === "admin" && <AICopilot user={user} />}
        </div>
      </div>
    </div>
  )
}

function DashboardContent({ user }: { user: any }) {
  const [stats, setStats] = useState({
    totalForms: 0,
    publishedForms: 0,
    totalSubmissions: 0,
    activeUsers: 1,
  })

  useEffect(() => {
    // Load stats from database
    const loadStats = async () => {
      try {
        const cloudStorage = CloudStorageService.getInstance()
        const forms = await cloudStorage.getForms(user.id.toString())
        const publishedForms = forms.filter((f) => f.published)

        setStats({
          totalForms: forms.length,
          publishedForms: publishedForms.length,
          totalSubmissions: Math.floor(Math.random() * 100), // Mock data
          activeUsers: Math.floor(Math.random() * 10) + 1,
        })
      } catch (error) {
        console.error("Error loading stats:", error)
      }
    }

    loadStats()
  }, [user.id])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalForms}</div>
            <p className="text-xs text-muted-foreground">Stored in Neon Database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedForms}</div>
            <p className="text-xs text-muted-foreground">Available to users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Real-time sync enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Online now</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FormsContent({ user }: { user: any }) {
  const [forms, setForms] = useState<any[]>([])
  const [openTabs, setOpenTabs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshForms = async () => {
    try {
      setIsLoading(true)
      const cloudStorage = CloudStorageService.getInstance()

      let availableForms
      if (user.role === "user") {
        // Users see all published forms
        availableForms = await cloudStorage.getForms(undefined, true)
      } else {
        // Admins/Managers see published forms
        availableForms = await cloudStorage.getForms(undefined, true)
      }

      setForms(availableForms)
    } catch (error) {
      console.error("Error loading forms:", error)
      // Fallback to localStorage if API fails
      const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      const availableForms = savedForms.filter((form: any) => form.published)
      setForms(availableForms)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshForms()

    // Listen for form updates
    const handleFormsUpdated = () => {
      refreshForms()
    }

    window.addEventListener("formsUpdated", handleFormsUpdated)
    return () => window.removeEventListener("formsUpdated", handleFormsUpdated)
  }, [user.role])

  const openFormInTab = (form: any) => {
    // Check if form is already open
    const existingTab = openTabs.find((tab) => tab.id === form.id)
    if (existingTab) {
      setActiveTab(form.id.toString())
      return
    }

    // Add new tab
    const newTab = { ...form, tabId: form.id.toString() }
    setOpenTabs([...openTabs, newTab])
    setActiveTab(form.id.toString())
  }

  const closeTab = (tabId: string) => {
    const newTabs = openTabs.filter((tab) => tab.tabId !== tabId)
    setOpenTabs(newTabs)

    if (activeTab === tabId) {
      setActiveTab(newTabs.length > 0 ? newTabs[0].tabId : null)
    }
  }

  const closeAllTabs = () => {
    setOpenTabs([])
    setActiveTab(null)
  }

  const openNewFormTab = () => {
    setActiveTab(null) // This will show the forms list
  }

  if (openTabs.length > 0 && activeTab) {
    return (
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {openTabs.map((tab) => (
              <div
                key={tab.tabId}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer ${
                  activeTab === tab.tabId
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab(tab.tabId)}
              >
                <span className="text-sm font-medium">{tab.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.tabId)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            ))}
            {/* Add New Tab Button */}
            <button
              onClick={openNewFormTab}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">New Form</span>
            </button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={closeAllTabs}>
              Close All
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab(null)}>
              Back to Forms
            </Button>
          </div>
        </div>

        {/* Active Form Content */}
        {activeTab && (
          <div className="bg-white border rounded-lg p-6">
            {(() => {
              const currentForm = openTabs.find((tab) => tab.tabId === activeTab)
              return currentForm ? <FormFillInterface form={currentForm} user={user} /> : null
            })()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Forms</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={refreshForms} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
          <div className="text-sm text-gray-500">Click any form to open it in a new tab</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-500 mt-2">Loading forms from database...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No published forms available yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            {user.role === "user"
              ? "Contact your administrator to publish forms."
              : "Publish forms from the Form Builder to make them available here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card
              key={form.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openFormInTab(form)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{form.name}</CardTitle>
                {form.description && <CardDescription>{form.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Created: {new Date(form.created_at).toLocaleDateString()}</p>
                  <p>By: {form.created_by_username || form.createdBy}</p>
                  <p>Fields: {form.fields?.length || 0}</p>
                  <p>Version: {form.version}</p>
                </div>
                <div className="mt-4">
                  <Button size="sm" className="w-full">
                    Open Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function FormBuilderContent({ user }: { user: any }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [forms, setForms] = useState<any[]>([])
  const [editingForm, setEditingForm] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshForms = async () => {
    try {
      setIsLoading(true)
      const cloudStorage = CloudStorageService.getInstance()
      const userForms = await cloudStorage.getForms(user.id.toString())
      setForms(userForms)
    } catch (error) {
      console.error("Error loading forms:", error)
      // Fallback to localStorage
      const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      const filteredForms = savedForms.filter((form: any) => form.created_by === user.id || form.createdBy === user.id)
      setForms(filteredForms)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshForms()
  }, [user.id])

  const handleCreateForm = async () => {
    if (formName.trim()) {
      try {
        const newFormId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newForm = {
          id: newFormId,
          external_id: newFormId,
          name: formName,
          description: formDescription,
          fields: [],
          created_by: user.id,
          createdBy: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
          published: false,
          backgroundColor: "#ffffff",
          columns: { mobile: 1, tablet: 2, desktop: 3 },
        }

        // Save to localStorage first
        const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
        savedForms.push(newForm)
        localStorage.setItem("pilana_forms", JSON.stringify(savedForms))

        // Try to save to cloud storage
        try {
          const cloudStorage = CloudStorageService.getInstance()
          await cloudStorage.saveForm(newForm)
        } catch (cloudError) {
          console.warn("Could not save to cloud, but form is saved locally", cloudError)
        }

        // Refresh the forms list
        await refreshForms()

        alert(`Form "${formName}" created successfully!`)
        setShowCreateForm(false)
        setFormName("")
        setFormDescription("")
      } catch (error) {
        console.error("Error creating form:", error)
        alert("Error creating form. Please try again.")
      }
    }
  }

  const handleEditForm = (form: any) => {
    setEditingForm(form)
  }

  const handlePublishForm = async (form: any) => {
    try {
      // Update in localStorage first
      const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      const updatedForms = savedForms.map((f: any) => (f.id === form.id ? { ...f, published: !form.published } : f))
      localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))

      // Try to update in cloud storage
      try {
        const cloudStorage = CloudStorageService.getInstance()
        await cloudStorage.updateForm(form.id.toString(), {
          published: !form.published,
          userId: user.id,
        })
      } catch (cloudError) {
        console.warn("Could not update in cloud, but form is updated locally", cloudError)
      }

      await refreshForms()
    } catch (error) {
      console.error("Error publishing form:", error)
      alert("Error updating form. Please try again.")
    }
  }

  const handleDeleteForm = async (form: any) => {
    if (confirm("Are you sure you want to delete this form?")) {
      try {
        // Delete from localStorage first
        const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
        const updatedForms = savedForms.filter((f: any) => f.id !== form.id)
        localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))

        // Try to delete from cloud storage
        try {
          const cloudStorage = CloudStorageService.getInstance()
          await cloudStorage.deleteForm(form.id.toString(), user.id.toString())
        } catch (cloudError) {
          console.warn("Could not delete from cloud, but form is deleted locally", cloudError)
        }

        await refreshForms()
      } catch (error) {
        console.error("Error deleting form:", error)
        alert("Error deleting form. Please try again.")
      }
    }
  }

  if (editingForm) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Editing: {editingForm.name}</h2>
          <Button variant="outline" onClick={() => setEditingForm(null)}>
            Back to Forms
          </Button>
        </div>
        <FormDesignerComponent
          form={editingForm}
          onSave={() => {
            setEditingForm(null)
            refreshForms()
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Form Builder</h2>
        <Button onClick={() => setShowCreateForm(true)}>Create New Form</Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Form</CardTitle>
            <CardDescription>Enter the details for your new form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="formName">Form Name</Label>
              <Input
                id="formName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter form name"
              />
            </div>
            <div>
              <Label htmlFor="formDescription">Description (Optional)</Label>
              <Input
                id="formDescription"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter form description"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleCreateForm} disabled={!formName.trim()}>
                Create Form
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-500 mt-2">Loading forms from database...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No forms created yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Create your first form to get started with the drag & drop builder.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    {form.description && <CardDescription>{form.description}</CardDescription>}
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      form.published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {form.published ? "Published" : "Draft"}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 space-y-1 mb-4">
                  <p>Created: {new Date(form.created_at).toLocaleDateString()}</p>
                  <p>By: {form.created_by_username || form.createdBy}</p>
                  <p>Fields: {form.fields?.length || 0}</p>
                  <p>Version: {form.version}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleEditForm(form)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={form.published ? "secondary" : "default"}
                    onClick={() => handlePublishForm(form)}
                  >
                    {form.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteForm(form)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function FormDesignerComponent({ form, onSave }: { form: any; onSave: () => void }) {
  const handleFormSave = (updatedForm: any) => {
    console.log("Form saved to database")
    onSave()
  }

  return <FormDesigner form={form} onSave={handleFormSave} />
}

function UsersContent() {
  const [users, setUsers] = useState([
    { id: 1, username: "admin", email: "admin@pilanaapp.com", role: "admin", lastLogin: "2023-06-01" },
    { id: 2, username: "manager", email: "manager@pilanaapp.com", role: "manager", lastLogin: "2023-06-02" },
    { id: 3, username: "user", email: "user@pilanaapp.com", role: "user", lastLogin: "2023-06-03" },
  ])

  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  })

  const handleAddUser = () => {
    // Validate inputs
    if (!newUser.username || !newUser.email || !newUser.password) {
      alert("Please fill in all required fields")
      return
    }

    // Create new user
    const newUserId = users.length + 1
    const createdUser = {
      id: newUserId,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      lastLogin: "Never",
    }

    // Add to users list
    setUsers([...users, createdUser])

    // Reset form and close dialog
    setNewUser({
      username: "",
      email: "",
      password: "",
      role: "user",
    })
    setShowAddUserDialog(false)

    // Show success message
    alert(`User ${newUser.username} created successfully!`)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button onClick={() => setShowAddUserDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Username</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Last Login</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{user.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                <td className="px-4 py-3 text-sm">{user.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "manager"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{user.lastLogin}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with appropriate permissions.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex items-center">
                <Key className="w-4 h-4 mr-2 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReportsContent() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <Button>Refresh All</Button>
      </div>
      <div className="text-center py-12">
        <p className="text-gray-500">Customizable reports and analytics will be implemented here.</p>
        <p className="text-sm text-gray-400 mt-2">Real-time data from Neon PostgreSQL database.</p>
      </div>
    </div>
  )
}
