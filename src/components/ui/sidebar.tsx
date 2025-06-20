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
  Loader2,
} from "lucide-react"
import { getBlogHistory, BlogHistoryItem } from "@/lib/blogHistory"

interface SidebarProps {
  onHistoryItemClick?: (item: BlogHistoryItem) => void;
  onNewDocument?: () => void;
}

export interface SidebarRef {
  refreshHistory: () => Promise<void>;
  addOptimisticItem: (item: BlogHistoryItem) => void;
  updateItemState: (id: string, state: 'loading' | 'success' | 'error') => void;
}

export const Sidebar = forwardRef<SidebarRef, SidebarProps>(({ onHistoryItemClick, onNewDocument }, ref) => {
  const [isRecentsExpanded, setIsRecentsExpanded] = useState(false)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true)
  const [blogHistory, setBlogHistory] = useState<BlogHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadBlogHistory = async () => {
    try {
      setIsLoading(true);
      const history = await getBlogHistory();
      setBlogHistory(history);
    } catch (error) {
      console.error('Error loading blog history:', error);
      setBlogHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogHistory();
  }, [])

  const addOptimisticItem = (item: BlogHistoryItem) => {
    setBlogHistory(prev => [item, ...prev]);
  };

  const updateItemState = (id: string, state: 'loading' | 'success' | 'error') => {
    setBlogHistory(prev => prev.map(item => 
      item.id === id 
        ? { ...item, persistenceState: state }
        : item
    ));
  };

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    refreshHistory: loadBlogHistory,
    addOptimisticItem,
    updateItemState
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
        <Button 
          className="w-full justify-start bg-gray-100 text-gray-700 hover:bg-gray-200"
          onClick={onNewDocument}
        >
          New Document
        </Button>
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
              <span>Recent Documents</span>
            </div>
            {isHistoryExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          {isHistoryExpanded && (
            <div className="mt-2 space-y-1">
              {isLoading ? (
                <div className="px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : blogHistory.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-400">No previous blogs yet.</div>
              ) : (
                blogHistory.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer rounded-md"
                    onClick={() => onHistoryItemClick?.(item)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className={`font-medium truncate flex-1 ${
                          item.persistenceState === 'error' ? 'text-red-500' : ''
                        }`} 
                        title={item.title}
                      >
                        {item.title}
                      </div>
                      {item.persistenceState === 'loading' && (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      )}
                    </div>
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