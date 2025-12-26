"use client"

/**
 * FloatingGlossary - Floating glossary container
 *
 * Manages the floating glossary button and panel state.
 * Handles positioning and open/close behavior.
 */

import { useState, useRef, useEffect } from "react"
import { useDrawerStore } from "@repo/state/drawer"
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
  const [currentSelectedTerm, setCurrentSelectedTerm] = useState<
    string | undefined
  >(selectedTerm)
  const dragStartRef = useRef<{
    x: number
    y: number
    bottom: number
    right: number
  } | null>(null)

  // Connect to drawer store for external control (e.g., from IntroSection)
  const drawerStore = useDrawerStore()

  // Listen to drawer store to open glossary when requested externally
  useEffect(() => {
    if (drawerStore.isOpen && drawerStore.activeTab === "glossary") {
      setIsOpen(true)
      // Extract selectedTerm from drawer content if available
      if (drawerStore.content?.selectedTerm) {
        setCurrentSelectedTerm(drawerStore.content.selectedTerm as string)
      }
      // Close the drawer store after handling (floating glossary takes over)
      drawerStore.closeDrawer()
    }
  }, [
    drawerStore.isOpen,
    drawerStore.activeTab,
    drawerStore.content,
    drawerStore,
  ])

  const handleToggle = () => setIsOpen((prev) => !prev)
  const handleClose = () => {
    setIsOpen(false)
    setCurrentSelectedTerm(undefined)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    // Only start drag if not clicking to toggle
    if (e.button !== 0) return

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

  // Determine if button is on the left or right half of the screen
  const isOnLeftHalf =
    typeof window !== "undefined"
      ? window.innerWidth - position.right - 32 < window.innerWidth / 2
      : false

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
        onOpen={handleToggle}
        selectedTerm={currentSelectedTerm}
        position={position}
        isOnLeftHalf={isOnLeftHalf}
      />
    </>
  )
}
