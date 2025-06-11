"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Cloud, CloudOff, Wifi, WifiOff, Users, Clock, Database } from "lucide-react"
import { useRealtimeSync } from "@/lib/realtime-sync"

interface CloudSyncStatusProps {
  user: any
}

export function CloudSyncStatus({ user }: CloudSyncStatusProps) {
  const { connectionStatus, lastSync, isConnected } = useRealtimeSync(user.id?.toString(), user.role)
  const [activeUsers, setActiveUsers] = useState(0)

  useEffect(() => {
    // Simulate active users count
    setActiveUsers(Math.floor(Math.random() * 5) + 1)
  }, [])

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Cloud className="w-4 h-4 text-green-600" />
      case "connecting":
        return <Wifi className="w-4 h-4 text-yellow-600 animate-pulse" />
      case "disconnected":
        return <CloudOff className="w-4 h-4 text-gray-400" />
      case "error":
        return <WifiOff className="w-4 h-4 text-red-600" />
      case "offline":
        return <Database className="w-4 h-4 text-blue-600" />
      default:
        return <Database className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Cloud Synced"
      case "connecting":
        return "Connecting..."
      case "disconnected":
        return "Offline"
      case "error":
        return "Connection Error"
      case "offline":
        return "Local Storage"
      default:
        return "Local Storage"
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-100 text-green-800 border-green-200"
      case "connecting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "disconnected":
        return "bg-gray-100 text-gray-600 border-gray-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      case "offline":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`${getStatusColor()} flex items-center space-x-1`}>
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">Storage Status</div>
              <div>Status: {connectionStatus === "offline" ? "Using Local Storage" : connectionStatus}</div>
              {lastSync && <div>Last sync: {lastSync.toLocaleTimeString()}</div>}
              {connectionStatus === "offline" && (
                <div className="text-blue-600 mt-1">All changes saved to browser storage</div>
              )}
              {!isConnected && connectionStatus !== "offline" && (
                <div className="text-yellow-600 mt-1">Changes will sync when connection is restored</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Active Users */}
        {isConnected && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span className="text-xs">{activeUsers}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium">Active Users</div>
                <div>{activeUsers} users online</div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Last Sync Time */}
        {lastSync && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{lastSync.toLocaleTimeString()}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium">Last Sync</div>
                <div>{lastSync.toLocaleString()}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
