"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
      </div>
      <div className="flex items-center gap-4">
        {/* <Button variant="outline" size="sm">
          Feedback
        </Button> */}
        <Avatar className="w-8 h-8">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback className="bg-green-500 text-white">U</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
} 