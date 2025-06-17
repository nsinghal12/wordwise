"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import WordWiseEditor from "@/components/editor/WordWiseEditor"
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
import { BlogHistoryItem } from "@/lib/blogHistory"

interface HomeProps {
  onHistoryItemClick: (item: BlogHistoryItem) => void;
}

export default function Home({ onHistoryItemClick }: HomeProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [editorContent, setEditorContent] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const promptInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    const promptValue = promptInputRef.current?.value;
    if (promptValue && !isSubmitting) {
      try {
        setIsSubmitting(true);
        const content = await createBlog(promptValue);
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

  const handleHistoryItemClickInternal = (item: BlogHistoryItem) => {
    if (promptInputRef.current) {
      promptInputRef.current.value = item.prompt;
    }
    setEditorContent(item.content);
    setShowEditor(true);
    onHistoryItemClick(item);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-4xl">
        {/* Editor Section */}
        {/* {showEditor && (
          <div className="transform transition-all duration-300 ease-in-out">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Editor</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowEditor(false)}
                  className="hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
              <WordWiseEditor initialContent={editorContent} />
            </div>
          </div>
        )} */}

        <div className="transform transition-all duration-300 ease-in-out">
          <WordWiseEditor initialContent={editorContent} />
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            What can I help you create?
          </h1>

          {/* Input Area */}
          <div className="relative mb-8">
            <div className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-md transition-shadow">
              <Input
                ref={promptInputRef}
                placeholder="Ask WordWise to create..."
                className="border-0 text-lg p-0 focus-visible:ring-0 placeholder-gray-400"
              />
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sm bg-white hover:bg-gray-50 transition-colors"
                      >
                        New Project
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>New Project</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sm bg-white hover:bg-gray-50 transition-colors"
                      >
                        v0-1.5-md
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>v0-1.5-md</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gray-50 rounded-full p-2 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gray-50 rounded-full p-2 transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="hover:bg-gray-50 rounded-full p-2 transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
            >
              <Camera className="w-4 h-4 text-blue-500" />
              Clone a Screenshot
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
            >
              <div className="w-4 h-4 bg-purple-500 rounded text-white flex items-center justify-center text-xs">
                F
              </div>
              Import from Figma
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
            >
              <Upload className="w-4 h-4 text-green-500" />
              Upload a Project
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
            >
              <FileText className="w-4 h-4 text-orange-500" />
              Landing Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
            >
              <UserPlus className="w-4 h-4 text-pink-500" />
              Invite Team
            </Button>
          </div>

          {/* Example Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">Example</Badge>
                    <h3 className="font-semibold mb-1">Blog Post</h3>
                    <p className="text-sm text-gray-500">Write a blog post about the future of AI</p>
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/vercel.svg" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">Example</Badge>
                    <h3 className="font-semibold mb-1">Landing Page</h3>
                    <p className="text-sm text-gray-500">Create a landing page for a new startup</p>
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/vercel.svg" />
                    <AvatarFallback>LP</AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
