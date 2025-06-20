"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar, SidebarRef } from "@/components/ui/sidebar"
import { Header } from "@/components/ui/header"
import Home, { HomeRef } from "@/views/home"
import LoginView from "@/views/login"
import { BlogHistoryItem } from "@/lib/blogHistory"
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
      <Sidebar ref={sidebarRef} onHistoryItemClick={handleHistoryItemClick} onNewDocument={handleNewDocument} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <Header onLogout={handleLogout} />

        {/* Main Content Area */}
        <Home ref={homeRef} selectedHistoryItem={selectedHistoryItem} onBlogCreated={() => sidebarRef.current?.refreshHistory()} sidebarRef={sidebarRef} />
      </div>
    </div>
  );
}
