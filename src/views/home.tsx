"use client"

import { useState, useRef, useEffect } from "react"
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
  selectedHistoryItem?: BlogHistoryItem | null;
  onBlogCreated?: () => void;
}

export default function Home({ selectedHistoryItem, onBlogCreated }: HomeProps) {
  const hasHistoryItem = selectedHistoryItem !== null;

  const [showEditor, setShowEditor] = useState(hasHistoryItem ? true : false)
  const [editorContent, setEditorContent] = useState<string>(hasHistoryItem ? selectedHistoryItem?.content || '' : '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promptValue, setPromptValue] = useState<string>(hasHistoryItem ? selectedHistoryItem?.prompt || '' : '')
  const [selectedLength, setSelectedLength] = useState<string>('1 page')
  const [selectedTone, setSelectedTone] = useState<string>('Informative/Educational')
  const [selectedAudience, setSelectedAudience] = useState<string>('Beginner/Novice')

  useEffect(() => {
    if (hasHistoryItem) {
      setPromptValue(selectedHistoryItem?.prompt || '');
      setEditorContent(selectedHistoryItem?.content || '');
      setShowEditor(true);
    }
  }, [hasHistoryItem, selectedHistoryItem]);

  const handleSubmit = async () => {
    if (promptValue && !isSubmitting) {
      try {
        setIsSubmitting(true);
        const content = await createBlog(promptValue, selectedLength);
        setEditorContent(content);
        setShowEditor(true);
        // Refresh the sidebar history after successful blog creation
        onBlogCreated?.();
      } catch (error) {
        console.error('Error submitting prompt:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const setPromptValueHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromptValue(e.target.value || '');
  }

  return (
    <div className="flex-1 flex flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-4xl">

        <div id='editor' className="transform transition-all duration-300 ease-in-out pb-8">
          <WordWiseEditor initialContent={editorContent} />
        </div>

        {/* Input Section */}
        <div id='prompt-section' className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            What can I help you create?
          </h1>

          {/* Input Area */}
          <div className="relative mb-8">
            <div className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-md transition-shadow">
              <Input
                id='prompt-input'
                value={promptValue}
                onChange={setPromptValueHandler}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask WordWise to create..."
                className="border-0 text-lg p-0 focus-visible:ring-0 placeholder-gray-400"
              />
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        id='length-dropdown'
                        variant="outline"
                        size="sm"
                        className="text-sm bg-white hover:bg-gray-50 transition-colors"
                      >
                        {selectedLength}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedLength('1 page')}>1 page</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedLength('3-5 pages')}>3-5 pages</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedLength('8-10 pages')}>8-10 pages</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedLength('15+ pages')}>15+ pages</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        id='tone-dropdown'
                        variant="outline"
                        size="sm"
                        className="text-sm bg-white hover:bg-gray-50 transition-colors"
                      >
                        {selectedTone}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedTone('Informative/Educational')}>Informative/Educational</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTone('Conversational/Friendly')}>Conversational/Friendly</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTone('Professional/Authoritative')}>Professional/Authoritative</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTone('Enthusiastic/Uplifting')}>Enthusiastic/Uplifting</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTone('Humorous/Witty')}>Humorous/Witty</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        id='audience-dropdown'
                        variant="outline"
                        size="sm"
                        className="text-sm bg-white hover:bg-gray-50 transition-colors"
                      >
                        {selectedAudience}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedAudience('Beginner/Novice')}>Beginner/Novice</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedAudience('General Public/Broad Audience')}>General Public/Broad Audience</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedAudience('Experienced/Intermediate')}>Experienced/Intermediate</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedAudience('Experts/Professionals')}>Experts/Professionals</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedAudience('Specific Niche/Enthusiasts')}>Specific Niche/Enthusiasts</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-3">
                  {/* <Button
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
                  </Button> */}
                  <Button
                    id='submit-button'
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
          {/* <div className="flex flex-wrap justify-center gap-3 mb-12">
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
          </div> */}

          {/* Example Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div> */}
        </div>
      </div>
    </div>
  )
}
