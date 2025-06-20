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
import { BlogHistoryItem, saveBlogToHistory, updateBlogInHistory } from "@/lib/blogHistory"

const LENGTH_OPTIONS = ['1 page', '3-5 pages', '8-10 pages', '15+ pages'];
const TONE_OPTIONS = [
  'Informative/Educational',
  'Conversational/Friendly',
  'Professional/Authoritative',
  'Enthusiastic/Uplifting',
  'Humorous/Witty'
];
const AUDIENCE_OPTIONS = [
  'Beginner/Novice',
  'General Public/Broad Audience',
  'Experienced/Intermediate',
  'Experts/Professionals',
  'Specific Niche/Enthusiasts'
];

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
  const [blogTitle, setBlogTitle] = useState<string>(hasHistoryItem ? selectedHistoryItem?.title || '' : '')
  const [lastValidTitle, setLastValidTitle] = useState<string>(hasHistoryItem ? selectedHistoryItem?.title || '' : '')
  const [tempTitle, setTempTitle] = useState<string>(hasHistoryItem ? selectedHistoryItem?.title || '' : '')
  const [selectedLength, setSelectedLength] = useState<string>(LENGTH_OPTIONS[0])
  const [selectedTone, setSelectedTone] = useState<string>(TONE_OPTIONS[0])
  const [selectedAudience, setSelectedAudience] = useState<string>(AUDIENCE_OPTIONS[0])

  useEffect(() => {
    if (hasHistoryItem) {
      setPromptValue(selectedHistoryItem?.prompt || '');
      setEditorContent(selectedHistoryItem?.content || '');
      const title = selectedHistoryItem?.title || '';
      setBlogTitle(title);
      setLastValidTitle(title);
      setTempTitle(title);
      setShowEditor(true);
    }
  }, [hasHistoryItem, selectedHistoryItem]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempTitle(e.target.value);
  };

  const saveTitleUpdate = async (newTitle: string) => {
    if (newTitle.trim() === '') {
      setTempTitle(lastValidTitle);
      return;
    }
    
    if (newTitle === blogTitle) {
      return; // No change, don't save
    }
    
    setBlogTitle(newTitle);
    setLastValidTitle(newTitle);
    
    // Save the updated title to history
    if (editorContent && promptValue) {
      if (selectedHistoryItem?.id) {
        // Update existing history item
        await updateBlogInHistory(selectedHistoryItem.id, newTitle, promptValue, editorContent);
      } else {
        // Create new history item
        await saveBlogToHistory(newTitle, promptValue, editorContent);
      }
      onBlogCreated?.();
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitleUpdate(tempTitle);
      e.currentTarget.blur();
    }
  };

  const handleTitleBlur = () => {
    saveTitleUpdate(tempTitle);
  };

  const handleSubmit = async () => {
    if (promptValue && !isSubmitting) {
      try {
        setIsSubmitting(true);
        const { title, content } = await createBlog(promptValue, selectedLength, selectedTone, selectedAudience);
        setEditorContent(content);
        setBlogTitle(title);
        setLastValidTitle(title);
        setTempTitle(title);
        setShowEditor(true);
        
        // Save to history after successful creation
        await saveBlogToHistory(title, promptValue, content);
        
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
        {showEditor && (
          <div className="mb-4">
            <Input
              value={tempTitle}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleBlur}
              placeholder="Enter blog title..."
              className="text-2xl font-bold border-0 p-0 focus-visible:ring-0 placeholder-gray-400"
            />
          </div>
        )}

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
                      {LENGTH_OPTIONS.map((length) => (
                        <DropdownMenuItem key={length} onClick={() => setSelectedLength(length)}>
                          {length}
                        </DropdownMenuItem>
                      ))}
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
                      {TONE_OPTIONS.map((tone) => (
                        <DropdownMenuItem key={tone} onClick={() => setSelectedTone(tone)}>
                          {tone}
                        </DropdownMenuItem>
                      ))}
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
                      {AUDIENCE_OPTIONS.map((audience) => (
                        <DropdownMenuItem key={audience} onClick={() => setSelectedAudience(audience)}>
                          {audience}
                        </DropdownMenuItem>
                      ))}
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
