"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/ui/sidebar"
import { Header } from "@/components/ui/header"
import Home from "@/views/home"
import { BlogHistoryItem } from "@/lib/blogHistory"

export default function App() {
  const router = useRouter()
  const pathname = usePathname()
  const [currentRoute, setCurrentRoute] = useState('/')

  useEffect(() => {
    setCurrentRoute(pathname)
  }, [pathname])

  const handleHistoryItemClick = (item: BlogHistoryItem) => {
    // Handle history item clicks
    console.log('History item clicked:', item)
  }

  const handleNavigation = (route: string) => {
    router.push(route)
  }

  const renderContent = () => {
    switch (currentRoute) {
      case '/':
      case '/home':
        return <Home onHistoryItemClick={handleHistoryItemClick} />
      default:
        return <Home onHistoryItemClick={handleHistoryItemClick} />
    }
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
        {renderContent()}
      </div>
    </div>
  )
}
