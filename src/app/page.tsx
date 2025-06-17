"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import WordWiseEditor from "@/components/editor/WordWiseEditor"
import {
  Search,
  FolderOpen,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  Camera,
  Upload,
  FileText,
  UserPlus,
  Share2,
  ArrowUp,
  Paperclip,
  X,
} from "lucide-react"
import { createBlog } from "@/lib/blog"

export default function Home() {
  const [isRecentsExpanded, setIsRecentsExpanded] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editorContent, setEditorContent] = useState<string>('')

  const handleSubmit = async () => {
    const promptInput = document.getElementById('prompt-input') as HTMLInputElement;
    if (promptInput?.value) {
      try {
        const content = await createBlog(promptInput.value);
        setEditorContent(content);
        setShowEditor(true);
      } catch (error) {
        console.error('Error submitting prompt:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
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
          <Button className="w-full justify-start bg-gray-100 text-gray-700 hover:bg-gray-200">New Dcoument</Button>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              Feedback
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-green-500 text-white">U</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {showEditor ? (
            <div className="w-full max-w-4xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Editor</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <WordWiseEditor initialContent={editorContent} />
            </div>
          ) : (
            <div className="w-full max-w-4xl">
              <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">What can I help you create?</h1>

              {/* Input Area */}
              <div className="relative mb-8">
                <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                  <Input id='prompt-input' placeholder="Ask WordWise to create..." className="border-0 text-base p-0 focus-visible:ring-0" />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="text-sm">
                            New Project
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>New Project</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="text-sm">
                            v0-1.5-md
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>v0-1.5-md</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button id='submit-button' variant="ghost" size="sm" onClick={handleSubmit}>
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Clone a Screenshot
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded text-white flex items-center justify-center text-xs">
                    F
                  </div>
                  Import from Figma
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload a Project
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Landing Page
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up Form
                </Button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
