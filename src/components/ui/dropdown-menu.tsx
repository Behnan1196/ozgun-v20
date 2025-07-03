"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DropdownMenu({ trigger, children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className={cn(
          "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md animate-in fade-in-0 zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}>
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled = false,
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "focus:bg-gray-100 focus:text-gray-900",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
} 