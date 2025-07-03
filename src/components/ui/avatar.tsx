"use client"

import * as React from "react"
import { Camera, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuItem } from "./dropdown-menu"

interface ProfileAvatarProps {
  src?: string | null
  fallback?: string
  size?: "sm" | "md" | "lg"
  onUpload?: (file: File) => void
  onRemove?: () => void
  className?: string
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-24 h-24",
}

export function ProfileAvatar({ src, fallback, size = "md", onUpload, onRemove, className }: ProfileAvatarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onUpload) {
      onUpload(file)
    }
    // Reset the input value so the same file can be selected again
    event.target.value = ""
  }

  const trigger = (
    <div className={cn(
      "relative group rounded-full overflow-hidden bg-blue-100",
      sizeClasses[size],
      className
    )}>
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-medium text-blue-600">
          {fallback?.charAt(0)?.toUpperCase() || "K"}
        </span>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil className="w-5 h-5 text-white" />
      </div>
    </div>
  )

  return (
    <div className="relative">
      <DropdownMenu trigger={trigger}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <DropdownMenuItem
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          {src ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle"}
        </DropdownMenuItem>
        {src && (
          <DropdownMenuItem
            onClick={onRemove}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Camera className="h-4 w-4" />
            Fotoğrafı Kaldır
          </DropdownMenuItem>
        )}
      </DropdownMenu>
    </div>
  )
} 