"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import {
  Search,
  FolderOpen,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  History,
} from "lucide-react"
import { getBlogHistory, BlogHistoryItem } from "@/lib/blogHistory"

interface SidebarProps {
  onHistoryItemClick?: (item: BlogHistoryItem) => void;
}

export interface SidebarRef {
  refreshHistory: () => Promise<void>;
}

export const Sidebar = forwardRef<SidebarRef, SidebarProps>(({ onHistoryItemClick }, ref) => {
  const [isRecentsExpanded, setIsRecentsExpanded] = useState(false)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true)
  const [blogHistory, setBlogHistory] = useState<BlogHistoryItem[]>([])

  const loadBlogHistory = async () => {
    try {
      const history = await getBlogHistory();
      setBlogHistory(history);
    } catch (error) {
      console.error('Error loading blog history:', error);
      setBlogHistory([]);
    }
  };

  useEffect(() => {
    loadBlogHistory();
  }, [])

  // Expose refresh function via ref
  useImperativeHandle(ref, () => ({
    refreshHistory: loadBlogHistory
  }))

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-bold">
            v0
          </div>
        </div>
        <Button className="w-full justify-start bg-gray-100 text-gray-700 hover:bg-gray-200">New Document</Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">

        {/* Previous Blogs Section */}
        <div className="pt-4">
          <div
            className="flex items-center justify-between px-2 py-1 text-sm text-gray-500 cursor-pointer"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Previous Blogs</span>
            </div>
            {isHistoryExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          {isHistoryExpanded && (
            <div className="mt-2 space-y-1">
              {blogHistory.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-400">No previous blogs yet.</div>
              ) : (
                blogHistory.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer rounded-md"
                    onClick={() => onHistoryItemClick?.(item)}
                  >
                    <div className="font-medium truncate" title={item.title}>{item.title}</div>
                    <div className="text-xs text-gray-500 truncate mt-1" title={item.prompt}>{item.prompt}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDate(item.timestamp)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}) 