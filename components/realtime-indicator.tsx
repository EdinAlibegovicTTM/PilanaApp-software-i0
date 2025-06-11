"use client"

import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"

export function RealtimeIndicator() {
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700">
      <Activity className="w-3 h-3 mr-1" />
      Realtime
    </Badge>
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
