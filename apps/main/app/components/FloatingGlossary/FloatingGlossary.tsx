"use client"

import { useState, useRef } from "react"
import { FloatingGlossaryButton } from "./FloatingGlossaryButton"
import { FloatingGlossaryPanel } from "./FloatingGlossaryPanel"

interface FloatingGlossaryProps {
  /** Optional selected term to scroll to when opened */
  selectedTerm?: string
}

interface Position {
  bottom: number
  right: number
}

/**
 * Main floating glossary component that manages the button and panel
 */
export function FloatingGlossary({ selectedTerm }: FloatingGlossaryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<Position>({ bottom: 32, right: 32 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; bottom: number; right: number } | null>(null)

  const handleToggle = () => setIsOpen(prev => !prev)
  const handleClose = () => setIsOpen(false)

  const handleDragStart = (e: React.MouseEvent) => {
    // Only start drag if not clicking to toggle
    if (e.button !== 0) return // Only left mouse button
    
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      bottom: position.bottom,
      right: position.right,
    }
    e.preventDefault()
  }

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return

    // Only horizontal movement (left-right)
    const deltaX = dragStartRef.current.x - e.clientX

    setPosition({
      bottom: position.bottom, // Keep vertical position fixed
      right: Math.max(16, dragStartRef.current.right + deltaX),
    })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    dragStartRef.current = null
  }

  return (
    <>
      <FloatingGlossaryButton 
        onClick={handleToggle} 
        isOpen={isOpen}
        position={position}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        isDragging={isDragging}
      />
      <FloatingGlossaryPanel 
        isOpen={isOpen} 
        onClose={handleClose} 
        selectedTerm={selectedTerm}
        position={position}
      />
    </>
  )
}

