"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"

interface CopyPasteBlockerProps {
  onViolation?: (type: "copy" | "paste") => void
}

export function CopyPasteBlocker({ onViolation }: CopyPasteBlockerProps) {
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      toast({
        title: "Action Blocked",
        description: "Copying is disabled during quizzes for academic integrity.",
        variant: "destructive",
      })
      onViolation?.("copy")
    }

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      toast({
        title: "Action Blocked",
        description: "Pasting is disabled during quizzes for academic integrity.",
        variant: "destructive",
      })
      onViolation?.("paste")
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      toast({
        title: "Action Blocked",
        description: "Right-click is disabled during quizzes.",
        variant: "destructive",
      })
    }

    document.addEventListener("copy", handleCopy)
    document.addEventListener("paste", handlePaste)
    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("paste", handlePaste)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [onViolation])

  return null
}
