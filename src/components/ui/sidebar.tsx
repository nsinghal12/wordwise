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
  FileDown,
} from "lucide-react"
import { getBlogHistory, BlogHistoryItem } from "@/lib/blogHistory"
import html2pdf from 'html2pdf.js'

interface SidebarProps {
  onHistoryItemClick?: (item: BlogHistoryItem) => void;
  onNewDocument?: () => void;
  onCopyItem?: (item: BlogHistoryItem) => Promise<void>;
  onDeleteItem?: (item: BlogHistoryItem) => Promise<void>;
}

export interface SidebarRef {
  refreshHistory: () => Promise<void>;
  addOptimisticItem: (item: BlogHistoryItem) => void;
  updateItemState: (id: string, state: 'loading' | 'success' | 'error' | undefined) => void;
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
  const [showPdfDialog, setShowPdfDialog] = useState(false)
  const [pdfGenerationProgress, setPdfGenerationProgress] = useState<string>('')

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

  const updateItemState = (id: string, state: 'loading' | 'success' | 'error' | undefined) => {
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

  const handleSavePdf = async (item: BlogHistoryItem) => {
    setShowPdfDialog(true);
    setPdfGenerationProgress('Preparing document...');

    try {
      // Give UI time to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create a temporary container that's visible but positioned off-screen
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '0';
      tempContainer.style.left = '-100%';
      tempContainer.style.width = '210mm';
      tempContainer.style.minHeight = '297mm';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '20mm';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '12pt';
      tempContainer.style.lineHeight = '1.6';
      tempContainer.style.color = 'black';
      tempContainer.style.zIndex = '-1';
      tempContainer.style.overflow = 'hidden';
      
      // Create content elements programmatically for better reliability
      const contentWrapper = document.createElement('div');
      contentWrapper.style.width = '100%';
      
      // Title
      const titleElement = document.createElement('h1');
      titleElement.textContent = item.title;
      titleElement.style.fontSize = '24pt';
      titleElement.style.margin = '0 0 20pt 0';
      titleElement.style.color = '#333';
      titleElement.style.borderBottom = '2pt solid #333';
      titleElement.style.paddingBottom = '10pt';
      titleElement.style.fontWeight = 'bold';
      
      // Prompt section
      const promptWrapper = document.createElement('div');
      promptWrapper.style.margin = '20pt 0';
      promptWrapper.style.padding = '15pt';
      promptWrapper.style.backgroundColor = '#f5f5f5';
      promptWrapper.style.border = '1pt solid #ddd';
      
      const promptTitle = document.createElement('h3');
      promptTitle.textContent = 'Original Prompt:';
      promptTitle.style.margin = '0 0 10pt 0';
      promptTitle.style.color = '#666';
      promptTitle.style.fontSize = '14pt';
      
      const promptText = document.createElement('p');
      promptText.textContent = item.prompt;
      promptText.style.margin = '0';
      promptText.style.fontStyle = 'italic';
      promptText.style.color = '#555';
      
      promptWrapper.appendChild(promptTitle);
      promptWrapper.appendChild(promptText);
      
      // Content section
      const contentSection = document.createElement('div');
      contentSection.style.margin = '20pt 0';
      contentSection.style.lineHeight = '1.8';
      
      // Split content into paragraphs and create elements
      const paragraphs = item.content.split('\n').filter(p => p.trim());
      paragraphs.forEach(paragraphText => {
        const p = document.createElement('p');
        p.textContent = paragraphText.trim();
        p.style.margin = '0 0 12pt 0';
        p.style.textAlign = 'justify';
        contentSection.appendChild(p);
      });
      
      // Footer
      const footer = document.createElement('div');
      footer.textContent = `Generated on ${new Date(item.timestamp).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      footer.style.marginTop = '30pt';
      footer.style.paddingTop = '15pt';
      footer.style.borderTop = '1pt solid #ccc';
      footer.style.fontSize = '10pt';
      footer.style.color = '#888';
      footer.style.textAlign = 'center';
      
      // Assemble the document
      contentWrapper.appendChild(titleElement);
      contentWrapper.appendChild(promptWrapper);
      contentWrapper.appendChild(contentSection);
      contentWrapper.appendChild(footer);
      tempContainer.appendChild(contentWrapper);
      
      document.body.appendChild(tempContainer);

      // Wait for content to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPdfGenerationProgress('Rendering content...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Configure html2pdf options with simpler settings
      const cleanFilename = item.title.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
      const options = {
        margin: 0,
        filename: `${cleanFilename}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      setPdfGenerationProgress('Converting to PDF...');
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('Container content before PDF generation:', tempContainer.innerHTML);

      // Generate and save PDF
      await html2pdf().set(options).from(tempContainer).save();

      setPdfGenerationProgress('PDF saved successfully!');
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Close dialog after a short delay
      setTimeout(() => {
        setShowPdfDialog(false);
        setPdfGenerationProgress('');
      }, 1500);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfGenerationProgress('Error generating PDF. Please try again.');
      setTimeout(() => {
        setShowPdfDialog(false);
        setPdfGenerationProgress('');
      }, 3000);
    }
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
                    } ${item.persistenceState === 'loading' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className={`font-medium truncate flex-1 ${
                          item.persistenceState === 'error' ? 'text-red-500' : ''
                        } ${item.isDeleting ? 'line-through text-gray-400' : ''} ${
                          item.persistenceState === 'loading' ? 'text-gray-400' : ''
                        }`} 
                        title={item.title}
                        onClick={() => !item.isDeleting && item.persistenceState !== 'loading' && onHistoryItemClick?.(item)}
                      >
                        {item.title}
                      </div>
                      <div className="flex items-center gap-1">
                        {item.persistenceState === 'loading' && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
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
                              {/* <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleSavePdf(item)}
                              >
                                <FileDown className="w-4 h-4 mr-2" />
                                Save as PDF
                              </DropdownMenuItem> */}
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
                      className={`text-xs text-gray-500 truncate mt-1 ${item.isDeleting ? 'line-through' : ''} ${
                        item.persistenceState === 'loading' ? 'text-gray-400' : ''
                      }`}
                      title={item.prompt}
                      onClick={() => !item.isDeleting && item.persistenceState !== 'loading' && onHistoryItemClick?.(item)}
                    >
                      {item.prompt}
                    </div>
                    <div 
                      className={`text-xs text-gray-400 mt-1 ${item.isDeleting ? 'line-through' : ''}`}
                      onClick={() => !item.isDeleting && item.persistenceState !== 'loading' && onHistoryItemClick?.(item)}
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

      {/* PDF Generation Progress Dialog */}
      <Dialog
        isOpen={showPdfDialog}
        onClose={() => {}} // Prevent manual closing during generation
        title="Generating PDF"
      >
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <p className="text-gray-600">{pdfGenerationProgress}</p>
        </div>
      </Dialog>
    </div>
  )
}) 