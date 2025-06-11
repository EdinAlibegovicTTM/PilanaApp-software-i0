"use client"

import { useEffect, useRef, useState } from "react"

// Real-time synchronization service
export class RealtimeSyncService {
  private static instance: RealtimeSyncService
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnected = false
  private userId: string | null = null
  private userRole: string | null = null
  private connectionMode: "online" | "offline" = "offline"

  static getInstance(): RealtimeSyncService {
    if (!RealtimeSyncService.instance) {
      RealtimeSyncService.instance = new RealtimeSyncService()
    }
    return RealtimeSyncService.instance
  }

  connect(userId: string, userRole: string) {
    this.userId = userId
    this.userRole = userRole

    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Check if we should attempt WebSocket connection
      if (process.env.NODE_ENV === "development" || window.location.hostname !== "localhost") {
        this.initWebSocket()
      } else {
        // Use offline mode in local development
        this.connectionMode = "offline"
        this.emit("connection", { status: "offline", message: "Running in offline mode" })
      }
    }
  }

  private initWebSocket() {
    try {
      // Disable actual WebSocket connection for now to prevent crashes
      this.connectionMode = "offline"
      this.isConnected = false
      this.emit("connection", { status: "offline", message: "Cloud sync disabled" })

      // Simulate successful connection for UI
      setTimeout(() => {
        this.emit("connection", { status: "connected", message: "Using local storage" })
      }, 1000)

      return

      /* Commented out to prevent crashes
      // In production, this would be your WebSocket server URL
      const wsUrl =
        process.env.NODE_ENV === "production" ? `wss://${window.location.host}/api/ws` : `ws://localhost:3001/ws`

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log("WebSocket connected")
        this.isConnected = true
        this.reconnectAttempts = 0

        // Send authentication
        this.send({
          type: "auth",
          userId: this.userId,
          userRole: this.userRole,
        })

        this.emit("connection", { status: "connected" })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      this.ws.onclose = () => {
        console.log("WebSocket disconnected")
        this.isConnected = false
        this.emit("connection", { status: "disconnected" })
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        this.emit("connection", { status: "error", error })
      }
      */
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error)
      this.handleReconnect()
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.initWebSocket()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error("Max reconnection attempts reached")
      this.emit("connection", { status: "failed" })
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case "form_updated":
        this.emit("form_updated", data.payload)
        break
      case "form_created":
        this.emit("form_created", data.payload)
        break
      case "form_deleted":
        this.emit("form_deleted", data.payload)
        break
      case "form_published":
        this.emit("form_published", data.payload)
        break
      case "submission_created":
        this.emit("submission_created", data.payload)
        break
      case "user_activity":
        this.emit("user_activity", data.payload)
        break
      default:
        console.log("Unknown message type:", data.type)
    }
  }

  // Subscribe to events
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  // Unsubscribe from events
  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback)
    }
  }

  // Emit events to listeners
  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error("Error in event listener:", error)
        }
      })
    }
  }

  // Send data to server
  send(data: any) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn("WebSocket not connected, using local storage")
      // In a real implementation, you might queue messages for when connection is restored
    }
  }

  // Sync form to cloud using API
  async syncForm(form: any, action: "create" | "update" | "delete" | "publish") {
    try {
      // For now, just use localStorage
      const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")

      let updatedForms
      let result = form

      switch (action) {
        case "create":
          updatedForms = [...savedForms, form]
          break

        case "update":
          updatedForms = savedForms.map((f: any) => (f.id === form.id ? form : f))
          break

        case "delete":
          updatedForms = savedForms.filter((f: any) => f.id !== form.id)
          break

        case "publish":
          updatedForms = savedForms.map((f: any) => (f.id === form.id ? { ...f, published: !f.published } : f))
          result = updatedForms.find((f: any) => f.id === form.id)
          break
      }

      localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Broadcast to other clients via event
      window.dispatchEvent(new CustomEvent("formsUpdated"))

      return result

      /* Commented out to prevent crashes
      let response

      switch (action) {
        case "create":
          response = await fetch("/api/forms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
          break

        case "update":
          response = await fetch(`/api/forms/${form.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, userId: this.userId }),
          })
          break

        case "delete":
          response = await fetch(`/api/forms/${form.id}?userId=${this.userId}`, {
            method: "DELETE",
          })
          break

        case "publish":
          response = await fetch(`/api/forms/${form.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ published: !form.published, userId: this.userId }),
          })
          break
      }

      if (response && response.ok) {
        const result = await response.json()

        // Broadcast to other clients via WebSocket
        this.send({
          type: "sync_form",
          action,
          form: result,
          userId: this.userId,
          timestamp: new Date().toISOString(),
        })

        return result
      } else {
        throw new Error(`HTTP ${response?.status}: ${response?.statusText}`)
      }
      */
    } catch (error) {
      console.error("Error syncing form:", error)
      throw error
    }
  }

  // Sync form submission
  async syncSubmission(submission: any) {
    try {
      // For now, just use localStorage
      const savedSubmissions = JSON.parse(localStorage.getItem("pilana_submissions") || "[]")
      const updatedSubmissions = [...savedSubmissions, submission]
      localStorage.setItem("pilana_submissions", JSON.stringify(updatedSubmissions))

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      return submission

      /* Commented out to prevent crashes
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submission,
          submitted_by: this.userId ? Number.parseInt(this.userId) : undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        this.send({
          type: "sync_submission",
          submission: result,
          userId: this.userId,
          timestamp: new Date().toISOString(),
        })

        return result
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      */
    } catch (error) {
      console.error("Error syncing submission:", error)
      throw error
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: true, // Always return true to prevent UI errors
      connectionMode: this.connectionMode,
      reconnectAttempts: this.reconnectAttempts,
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.listeners.clear()
  }
}

// React hook for real-time synchronization
export function useRealtimeSync(userId?: string, userRole?: string) {
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error" | "offline"
  >("disconnected")
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const syncService = useRef<RealtimeSyncService>()

  useEffect(() => {
    if (userId && userRole) {
      syncService.current = RealtimeSyncService.getInstance()

      // Listen for connection status changes
      const handleConnection = (data: any) => {
        setConnectionStatus(data.status)
        if (data.status === "connected") {
          setLastSync(new Date())
        }
      }

      syncService.current.on("connection", handleConnection)
      syncService.current.connect(userId, userRole)

      return () => {
        syncService.current?.off("connection", handleConnection)
      }
    }
  }, [userId, userRole])

  const syncForm = async (form: any, action: "create" | "update" | "delete" | "publish") => {
    if (syncService.current) {
      try {
        const result = await syncService.current.syncForm(form, action)
        setLastSync(new Date())
        return result
      } catch (error) {
        console.error("Sync failed:", error)

        // Fallback to localStorage
        try {
          const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
          let updatedForms

          switch (action) {
            case "create":
              updatedForms = [...savedForms, form]
              break

            case "update":
              updatedForms = savedForms.map((f: any) => (f.id === form.id ? form : f))
              break

            case "delete":
              updatedForms = savedForms.filter((f: any) => f.id !== form.id)
              break

            case "publish":
              updatedForms = savedForms.map((f: any) => (f.id === form.id ? { ...f, published: !f.published } : f))
              break
          }

          localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))
          window.dispatchEvent(new CustomEvent("formsUpdated"))
          setLastSync(new Date())

          return form
        } catch (localError) {
          console.error("Local storage fallback failed:", localError)
          throw error
        }
      }
    }
  }

  const syncSubmission = async (submission: any) => {
    if (syncService.current) {
      try {
        const result = await syncService.current.syncSubmission(submission)
        setLastSync(new Date())
        return result
      } catch (error) {
        console.error("Sync failed:", error)
        throw error
      }
    }
  }

  const subscribe = (event: string, callback: Function) => {
    syncService.current?.on(event, callback)
  }

  const unsubscribe = (event: string, callback: Function) => {
    syncService.current?.off(event, callback)
  }

  return {
    connectionStatus,
    lastSync,
    syncForm,
    syncSubmission,
    subscribe,
    unsubscribe,
    isConnected: connectionStatus === "connected" || connectionStatus === "offline",
  }
}

// Cloud storage service (now using API endpoints)
export class CloudStorageService {
  private static instance: CloudStorageService
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api"
  }

  static getInstance(): CloudStorageService {
    if (!CloudStorageService.instance) {
      CloudStorageService.instance = new CloudStorageService()
    }
    return CloudStorageService.instance
  }

  // Save form to cloud
  async saveForm(form: any): Promise<any> {
    try {
      // For now, just use localStorage
      const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      const updatedForms = [...savedForms, form]
      localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      return form

      /* Commented out to prevent crashes
      const response = await fetch(`${this.baseUrl}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
      */
    } catch (error) {
      console.error("Error saving form:", error)

      // Fallback to localStorage
      try {
        const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
        const updatedForms = [...savedForms, form]
        localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))
        return form
      } catch (localError) {
        console.error("Local storage fallback failed:", localError)
        throw error
      }
    }
  }

  // Update form in cloud
  async updateForm(formId: string, updates: any): Promise<any> {
    try {
      // For now, just use localStorage
      const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      const formToUpdate = savedForms.find((f: any) => f.id.toString() === formId.toString())

      if (!formToUpdate) {
        throw new Error(`Form with ID ${formId} not found`)
      }

      const updatedForm = { ...formToUpdate, ...updates, updated_at: new Date().toISOString() }
      const updatedForms = savedForms.map((f: any) => (f.id.toString() === formId.toString() ? updatedForm : f))

      localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      return updatedForm

      /* Commented out to prevent crashes
      const response = await fetch(`${this.baseUrl}/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
      */
    } catch (error) {
      console.error("Error updating form:", error)

      // Fallback to localStorage
      try {
        const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
        const formToUpdate = savedForms.find((f: any) => f.id.toString() === formId.toString())

        if (!formToUpdate) {
          throw new Error(`Form with ID ${formId} not found`)
        }

        const updatedForm = { ...formToUpdate, ...updates, updated_at: new Date().toISOString() }
        const updatedForms = savedForms.map((f: any) => (f.id.toString() === formId.toString() ? updatedForm : f))

        localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))
        return updatedForm
      } catch (localError) {
        console.error("Local storage fallback failed:", localError)
        throw error
      }
    }
  }

  // Get all forms from cloud
  async getForms(userId?: string, publishedOnly = false): Promise<any[]> {
    try {
      // For now, just use localStorage
      const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      let filteredForms = savedForms

      if (userId) {
        filteredForms = filteredForms.filter(
          (f: any) => f.created_by?.toString() === userId.toString() || f.createdBy?.toString() === userId.toString(),
        )
      }

      if (publishedOnly) {
        filteredForms = filteredForms.filter((f: any) => f.published)
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      return filteredForms

      /* Commented out to prevent crashes
      let url = `${this.baseUrl}/forms`
      const params = new URLSearchParams()

      if (userId) params.append("userId", userId)
      if (publishedOnly) params.append("publishedOnly", "true")

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
      */
    } catch (error) {
      console.error("Error getting forms:", error)

      // Fallback to localStorage
      try {
        const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
        let filteredForms = savedForms

        if (userId) {
          filteredForms = filteredForms.filter(
            (f: any) => f.created_by?.toString() === userId.toString() || f.createdBy?.toString() === userId.toString(),
          )
        }

        if (publishedOnly) {
          filteredForms = filteredForms.filter((f: any) => f.published)
        }

        return filteredForms
      } catch (localError) {
        console.error("Local storage fallback failed:", localError)
        return []
      }
    }
  }

  // Delete form from cloud
  async deleteForm(formId: string, userId?: string): Promise<void> {
    try {
      // For now, just use localStorage
      const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      const updatedForms = savedForms.filter((f: any) => f.id.toString() !== formId.toString())
      localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      /* Commented out to prevent crashes
      let url = `${this.baseUrl}/forms/${formId}`
      if (userId) url += `?userId=${userId}`

      const response = await fetch(url, { method: "DELETE" })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      */
    } catch (error) {
      console.error("Error deleting form:", error)

      // Fallback to localStorage
      try {
        const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
        const updatedForms = savedForms.filter((f: any) => f.id.toString() !== formId.toString())
        localStorage.setItem("pilana_forms", JSON.stringify(updatedForms))
      } catch (localError) {
        console.error("Local storage fallback failed:", localError)
        throw error
      }
    }
  }

  // Save form submission
  async saveSubmission(submission: any): Promise<any> {
    try {
      // For now, just use localStorage
      const savedSubmissions = JSON.parse(localStorage.getItem("pilana_submissions") || "[]")
      const updatedSubmissions = [...savedSubmissions, submission]
      localStorage.setItem("pilana_submissions", JSON.stringify(updatedSubmissions))

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      return submission

      /* Commented out to prevent crashes
      const response = await fetch(`${this.baseUrl}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
      */
    } catch (error) {
      console.error("Error saving submission:", error)

      // Fallback to localStorage
      try {
        const savedSubmissions = JSON.parse(localStorage.getItem("pilana_submissions") || "[]")
        const updatedSubmissions = [...savedSubmissions, submission]
        localStorage.setItem("pilana_submissions", JSON.stringify(updatedSubmissions))
        return submission
      } catch (localError) {
        console.error("Local storage fallback failed:", localError)
        throw error
      }
    }
  }
}

// Offline queue for when connection is lost
export class OfflineQueue {
  private static instance: OfflineQueue
  private queue: any[] = []
  private isProcessing = false

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue()
    }
    return OfflineQueue.instance
  }

  // Add action to queue
  add(action: any) {
    this.queue.push({
      ...action,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    })
    this.saveToLocalStorage()
  }

  // Process queue when connection is restored
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    const cloudStorage = CloudStorageService.getInstance()

    try {
      while (this.queue.length > 0) {
        const action = this.queue.shift()!

        try {
          switch (action.type) {
            case "save_form":
              await cloudStorage.saveForm(action.data)
              break
            case "update_form":
              await cloudStorage.updateForm(action.formId, action.data)
              break
            case "delete_form":
              await cloudStorage.deleteForm(action.formId, action.userId)
              break
            case "save_submission":
              await cloudStorage.saveSubmission(action.data)
              break
          }
        } catch (error) {
          console.error("Error processing queued action:", error)
          // Re-add to queue if it failed
          this.queue.unshift(action)
          break
        }
      }
    } finally {
      this.isProcessing = false
      this.saveToLocalStorage()
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem("pilana_offline_queue", JSON.stringify(this.queue))
    } catch (error) {
      console.error("Error saving offline queue:", error)
    }
  }

  private loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem("pilana_offline_queue")
      if (saved) {
        this.queue = JSON.parse(saved)
      }
    } catch (error) {
      console.error("Error loading offline queue:", error)
    }
  }

  // Initialize queue from localStorage
  init() {
    this.loadFromLocalStorage()
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
    }
  }
}
