"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogActions } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  FolderOpen,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  History,
  Loader2,
  MoreVertical,
  Copy,
  Trash2,
} from "lucide-react"
import { getBlogHistory, BlogHistoryItem } from "@/lib/blogHistory"

interface SidebarProps {
  onHistoryItemClick?: (item: BlogHistoryItem) => void;
  onNewDocument?: () => void;
  onCopyItem?: (item: BlogHistoryItem) => Promise<void>;
  onDeleteItem?: (item: BlogHistoryItem) => Promise<void>;
}

export interface SidebarRef {
  refreshHistory: () => Promise<void>;
  addOptimisticItem: (item: BlogHistoryItem) => void;
  updateItemState: (id: string, state: 'loading' | 'success' | 'error') => void;
  removeItem: (id: string) => void;
  setItemDeleting: (id: string, isDeleting: boolean) => void;
}

export const Sidebar = forwardRef<SidebarRef, SidebarProps>(({ onHistoryItemClick, onNewDocument, onCopyItem, onDeleteItem }, ref) => {
  const [isRecentsExpanded, setIsRecentsExpanded] = useState(false)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true)
  const [blogHistory, setBlogHistory] = useState<BlogHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<BlogHistoryItem | null>(null)

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

  const removeItem = (id: string) => {
    setBlogHistory(prev => prev.filter(item => item.id !== id));
  };

  const setItemDeleting = (id: string, isDeleting: boolean) => {
    setBlogHistory(prev => prev.map(item => 
      item.id === id 
        ? { ...item, isDeleting }
        : item
    ));
  };

  const handleCopyItem = async (item: BlogHistoryItem) => {
    if (onCopyItem) {
      await onCopyItem(item);
    }
  };

  const handleDeleteClick = (item: BlogHistoryItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete && onDeleteItem) {
      // Hide dialog immediately and show deleting state
      setShowDeleteDialog(false);
      setItemDeleting(itemToDelete.id, true);
      
      try {
        await onDeleteItem(itemToDelete);
        // Item will be removed by the parent component after successful deletion
      } catch (error) {
        // Reset deleting state if deletion failed
        setItemDeleting(itemToDelete.id, false);
        console.error('Failed to delete item:', error);
      }
      
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    refreshHistory: loadBlogHistory,
    addOptimisticItem,
    updateItemState,
    removeItem,
    setItemDeleting
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
                    className={`px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer rounded-md group ${
                      item.isDeleting ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className={`font-medium truncate flex-1 ${
                          item.persistenceState === 'error' ? 'text-red-500' : ''
                        } ${item.isDeleting ? 'line-through text-gray-400' : ''}`} 
                        title={item.title}
                        onClick={() => !item.isDeleting && onHistoryItemClick?.(item)}
                      >
                        {item.title}
                      </div>
                      <div className="flex items-center gap-1">
                        {item.persistenceState === 'loading' && (
                          <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        )}
                        {item.isDeleting && (
                          <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                        )}
                        {item.persistenceState !== 'loading' && !item.isDeleting && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleCopyItem(item)}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Make a copy
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                variant="destructive" 
                                className="cursor-pointer"
                                onClick={() => handleDeleteClick(item)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div 
                      className={`text-xs text-gray-500 truncate mt-1 ${item.isDeleting ? 'line-through' : ''}`}
                      title={item.prompt}
                      onClick={() => !item.isDeleting && onHistoryItemClick?.(item)}
                    >
                      {item.prompt}
                    </div>
                    <div 
                      className={`text-xs text-gray-400 mt-1 ${item.isDeleting ? 'line-through' : ''}`}
                      onClick={() => !item.isDeleting && onHistoryItemClick?.(item)}
                    >
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        title="Delete Document"
      >
        <p className="text-gray-600">
          Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
        </p>
        <DialogActions>
          <Button
            variant="outline"
            onClick={handleDeleteCancel}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}) 