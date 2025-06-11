"use client"

import { Badge } from "@/components/ui/badge"
import { Cloud } from "lucide-react"

export function CloudSyncStatus() {
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      <Cloud className="w-3 h-3 mr-1" />
      Connected
    </Badge>
  )
}
