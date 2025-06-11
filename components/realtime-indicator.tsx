"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wifi, WifiOff, Users, Eye, Edit, CheckCircle2 } from "lucide-react"

interface RealtimeIndicatorProps {
  formId?: string
  isEditing?: boolean
}

export function RealtimeIndicator({ formId, isEditing = false }: RealtimeIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)

    // Simulate active users (in production, this would come from WebSocket)
    if (formId) {
      const mockUsers = [
        { id: "1", name: "John Doe", role: "admin", activity: "editing", lastSeen: new Date() },
        { id: "2", name: "Jane Smith", role: "manager", activity: "viewing", lastSeen: new Date() },
      ]
      setActiveUsers(mockUsers)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [formId])

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case "editing":
        return <Edit className="w-3 h-3" />
      case "viewing":
        return <Eye className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case "editing":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "viewing":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        {/* Online/Offline Status */}
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className={`flex items-center space-x-1 ${
                isOnline ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="text-xs">{isOnline ? "Online" : "Offline"}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? "Connected to cloud" : "Working offline"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Current User Activity */}
        {isEditing && (
          <Badge
            variant="outline"
            className="flex items-center space-x-1 bg-orange-50 text-orange-700 border-orange-200"
          >
            <Edit className="w-3 h-3" />
            <span className="text-xs">Editing</span>
          </Badge>
        )}

        {/* Active Users */}
        {activeUsers.length > 0 && (
          <div className="flex items-center space-x-1">
            {activeUsers.slice(0, 3).map((user) => (
              <Tooltip key={user.id}>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className={`flex items-center space-x-1 text-xs ${getActivityColor(user.activity)}`}
                  >
                    {getActivityIcon(user.activity)}
                    <span>{user.name.split(" ")[0]}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {user.name} is {user.activity} this form
                  </p>
                  <p className="text-xs text-gray-500">Last seen: {user.lastSeen.toLocaleTimeString()}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {activeUsers.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{activeUsers.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Sync Status */}
        {lastActivity && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>Synced</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last synced: {lastActivity.toLocaleTimeString()}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

export function RealtimeCollaboration({ formId }: { formId: string }) {
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [changes, setChanges] = useState<any[]>([])

  useEffect(() => {
    // In production, this would subscribe to real-time updates
    const mockCollaborators = [
      {
        id: "1",
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        activity: 'editing field "Customer Name"',
        timestamp: new Date(),
        color: "bg-blue-500",
      },
      {
        id: "2",
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=32&width=32",
        activity: "viewing form",
        timestamp: new Date(Date.now() - 60000),
        color: "bg-green-500",
      },
    ]
    setCollaborators(mockCollaborators)

    const mockChanges = [
      {
        id: "1",
        user: "John Doe",
        action: 'Added field "Email Address"',
        timestamp: new Date(Date.now() - 120000),
      },
      {
        id: "2",
        user: "Jane Smith",
        action: "Updated form title",
        timestamp: new Date(Date.now() - 300000),
      },
    ]
    setChanges(mockChanges)
  }, [formId])

  return (
    <div className="space-y-4">
      {/* Active Collaborators */}
      <div>
        <h4 className="font-medium mb-2">Active Collaborators</h4>
        <div className="space-y-2">
          {collaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div
                className={`w-8 h-8 rounded-full ${collaborator.color} flex items-center justify-center text-white text-sm font-medium`}
              >
                {collaborator.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{collaborator.name}</div>
                <div className="text-xs text-gray-500">{collaborator.activity}</div>
              </div>
              <div className="text-xs text-gray-400">{collaborator.timestamp.toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Changes */}
      <div>
        <h4 className="font-medium mb-2">Recent Changes</h4>
        <div className="space-y-2">
          {changes.map((change) => (
            <div key={change.id} className="flex items-center space-x-2 p-2 border-l-2 border-blue-200 bg-blue-50">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <div className="flex-1">
                <div className="text-sm">{change.action}</div>
                <div className="text-xs text-gray-500">
                  by {change.user} • {change.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
