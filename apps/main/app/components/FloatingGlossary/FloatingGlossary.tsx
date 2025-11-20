"use client"

import { useState } from "react"
import { FloatingGlossaryButton } from "./FloatingGlossaryButton"
import { FloatingGlossaryPanel } from "./FloatingGlossaryPanel"

interface FloatingGlossaryProps {
  /** Optional selected term to scroll to when opened */
  selectedTerm?: string
}

/**
 * Main floating glossary component that manages the button and panel
 */
export function FloatingGlossary({ selectedTerm }: FloatingGlossaryProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => setIsOpen(prev => !prev)
  const handleClose = () => setIsOpen(false)

  return (
    <>
      <FloatingGlossaryButton onClick={handleToggle} isOpen={isOpen} />
      <FloatingGlossaryPanel 
        isOpen={isOpen} 
        onClose={handleClose} 
        selectedTerm={selectedTerm} 
      />
    </>
  )
}

