"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import WordWiseEditor from "@/components/editor/WordWiseEditor"
import { Sidebar } from "@/components/ui/sidebar"
import {
  Camera,
  Upload,
  FileText,
  UserPlus,
  Share2,
  ArrowUp,
  Paperclip,
  X,
  ChevronDown,
} from "lucide-react"
import { createBlog } from "@/lib/blog"

export default function Home() {
  const [showEditor, setShowEditor] = useState(false)
  const [editorContent, setEditorContent] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const promptInput = document.getElementById('prompt-input') as HTMLInputElement;
    if (promptInput?.value && !isSubmitting) {
      try {
        setIsSubmitting(true);
        const content = await createBlog(promptInput.value);
        setEditorContent(content);
        setShowEditor(true);
      } catch (error) {
        console.error('Error submitting prompt:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar />

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
                      <Button 
                        id='submit-button' 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
                        ) : (
                          <ArrowUp className="w-4 h-4" />
                        )}
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
