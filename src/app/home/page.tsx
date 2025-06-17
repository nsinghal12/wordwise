"use client"

import { Sidebar } from "@/components/ui/sidebar"
import { Header } from "@/components/ui/header"
import Home from "@/views/home"
import { BlogHistoryItem } from "@/lib/blogHistory"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/AuthContext"

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push('/login');
    return null;
  }

  console.log('HomePage');

  const handleHistoryItemClick = (item: BlogHistoryItem) => {
    // Handle history item clicks
    console.log('History item clicked:', item)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar onHistoryItemClick={handleHistoryItemClick} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <Header />

        {/* Main Content Area */}
        <Home onHistoryItemClick={handleHistoryItemClick} />
      </div>
    </div>
  )
} 