"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Search,
  FolderOpen,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

export function Sidebar() {
  const [isRecentsExpanded, setIsRecentsExpanded] = useState(false)

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-bold">
            v0
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Personal</span>
            <span className="text-xs text-gray-500">Free</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <Button className="w-full justify-start bg-gray-100 text-gray-700 hover:bg-gray-200">New Document</Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
          <Search className="w-4 h-4" />
          Search
        </div>
        <div className="flex items-center gap-3 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
          <FolderOpen className="w-4 h-4" />
          Projects
        </div>
        <div className="flex items-center gap-3 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
          <Clock className="w-4 h-4" />
          Recents
        </div>
        <div className="flex items-center gap-3 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
          <Users className="w-4 h-4" />
          Community
        </div>

        {/* Collapsible Sections */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between px-2 py-1 text-sm text-gray-500">
            <span>Favorite Projects</span>
            <ChevronRight className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between px-2 py-1 text-sm text-gray-500">
            <span>Favorite Chats</span>
            <ChevronRight className="w-4 h-4" />
          </div>
          <div
            className="flex items-center justify-between px-2 py-1 text-sm text-gray-500 cursor-pointer"
            onClick={() => setIsRecentsExpanded(!isRecentsExpanded)}
          >
            <span>Recents</span>
            {isRecentsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          {isRecentsExpanded && (
            <div className="px-4 py-2 text-sm text-gray-400">You haven't created any chats yet.</div>
          )}
        </div>
      </div>
    </div>
  )
} 