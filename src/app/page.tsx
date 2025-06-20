"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar, SidebarRef } from "@/components/ui/sidebar"
import { Header } from "@/components/ui/header"
import Home, { HomeRef } from "@/views/home"
import LoginView from "@/views/login"
import { BlogHistoryItem } from "@/lib/blogHistory"
import { copyBlogFromHistory, deleteBlogFromHistory } from "@/lib/blogHistory"
import { useAuth } from "@/lib/AuthContext"

export default function App() {
  const { user, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('/');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<BlogHistoryItem | null>(null);
  const sidebarRef = useRef<SidebarRef>(null);
  const homeRef = useRef<HomeRef>(null);

  // Set initial route based on user state
  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentRoute('/home');
      } else {
        setCurrentRoute('/login');
      }
    }
  }, [user, loading]);

  const handleLoginSuccess = () => {
    console.log('Login successful, navigating to home');
    setCurrentRoute('/home');
  };

  const handleLogout = () => {
    console.log('Logout successful, navigating to login');
    setCurrentRoute('/login');
    setSelectedHistoryItem(null); // Clear any selected items
  };

  const handleHistoryItemClick = (item: BlogHistoryItem) => {
    console.log('History item clicked:', item);
    setSelectedHistoryItem(item);
  };

  const handleCopyItem = async (item: BlogHistoryItem) => {
    try {
      console.log('Copying item:', item);
      
      // Create optimistic copy item immediately
      const optimisticCopy: BlogHistoryItem = {
        id: `temp-${Date.now()}`, // Temporary ID for optimistic update
        title: `${item.title} (Copy)`,
        prompt: item.prompt,
        content: item.content,
        timestamp: Date.now(),
        userId: item.userId,
        persistenceState: 'loading'
      };
      
      // Add optimistic item to the top of the sidebar immediately
      sidebarRef.current?.addOptimisticItem(optimisticCopy);
      
      // Create a copy in the database
      const result = await copyBlogFromHistory(item);
      
      if (result.success && result.newItem) {
        // Remove the optimistic item and add the real one
        sidebarRef.current?.removeItem(optimisticCopy.id);
        sidebarRef.current?.addOptimisticItem({
          ...result.newItem,
          persistenceState: 'success'
        });
        
        // Clear the success state after a short delay to return to normal appearance
        setTimeout(() => {
          if (result.newItem) {
            sidebarRef.current?.updateItemState(result.newItem.id, undefined);
          }
        }, 1000);
        
        // Load the copied item in the editor
        setSelectedHistoryItem(result.newItem);
        
        console.log('Blog copied successfully');
      } else {
        // Update the optimistic item to show error state
        sidebarRef.current?.updateItemState(optimisticCopy.id, 'error');
        console.error('Failed to copy blog:', result.error);
        
        // Remove the failed optimistic item after a delay
        setTimeout(() => {
          sidebarRef.current?.removeItem(optimisticCopy.id);
        }, 3000);
      }
    } catch (error) {
      console.error('Error copying blog:', error);
      // The optimistic item will remain in error state
    }
  };

  const handleDeleteItem = async (item: BlogHistoryItem) => {
    try {
      console.log('Deleting item:', item);
      
      // If the deleted item is currently selected, clear the selection immediately
      if (selectedHistoryItem?.id === item.id) {
        setSelectedHistoryItem(null);
        homeRef.current?.resetToNewDocument();
      }
      
      // Delete the item from the database
      const result = await deleteBlogFromHistory(item.id);
      
      if (result.success) {
        // Remove the item from the sidebar list
        sidebarRef.current?.removeItem(item.id);
        console.log('Blog deleted successfully');
      } else {
        // Reset the deleting state if deletion failed
        sidebarRef.current?.setItemDeleting(item.id, false);
        console.error('Failed to delete blog:', result.error);
        // You might want to show an error message to the user here
      }
    } catch (error) {
      // Reset the deleting state if deletion failed
      sidebarRef.current?.setItemDeleting(item.id, false);
      console.error('Error deleting blog:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleNewDocument = () => {
    console.log('New document clicked');
    setSelectedHistoryItem(null);
    homeRef.current?.resetToNewDocument();
  };

  // Show loading while determining auth state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Show login view if no user
  if (!user || currentRoute === '/login') {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Show home view with sidebar and header
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar 
        ref={sidebarRef} 
        onHistoryItemClick={handleHistoryItemClick} 
        onNewDocument={handleNewDocument}
        onCopyItem={handleCopyItem}
        onDeleteItem={handleDeleteItem}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <Header onLogout={handleLogout} />

        {/* Main Content Area */}
        <Home 
          key={selectedHistoryItem?.id || 'new'} 
          ref={homeRef} 
          selectedHistoryItem={selectedHistoryItem} 
          onBlogCreated={() => sidebarRef.current?.refreshHistory()} 
          sidebarRef={sidebarRef} 
        />
      </div>
    </div>
  );
}
