"use client"

/**
 * FloatingGlossary - Floating glossary container
 *
 * Manages the floating glossary button and panel state.
 * Handles positioning and open/close behavior.
 * Only appears after user scrolls past the hero section.
 */

import { useState, useRef, useEffect, useCallback } from "react"
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
  const [isVisible, setIsVisible] = useState(false) // Hidden until scrolled past hero
  const dragStartRef = useRef<{
    x: number
    y: number
    bottom: number
    right: number
  } | null>(null)

  // Track scroll position to show/hide glossary button
  const checkScrollPosition = useCallback(() => {
    // Show glossary after scrolling past 80% of viewport height (past hero)
    const scrollThreshold = window.innerHeight * 0.8
    setIsVisible(window.scrollY > scrollThreshold)
  }, [])

  useEffect(() => {
    // Check initial position
    checkScrollPosition()

    // Listen for scroll events
    window.addEventListener("scroll", checkScrollPosition, { passive: true })
    return () => window.removeEventListener("scroll", checkScrollPosition)
  }, [checkScrollPosition])

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

  // WCAG 2.1.1: Global keyboard shortcut (Alt+G) to toggle glossary from anywhere
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Alt+G to toggle glossary (use e.code for Mac compatibility where Alt produces special chars)
      if (e.altKey && e.code === "KeyG") {
        e.preventDefault()
        // Force visibility when using keyboard shortcut
        setIsVisible(true)
        setIsOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => document.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

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

  // Don't render until user scrolls past hero section
  if (!isVisible && !isOpen) {
    return null
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
        onOpen={handleToggle}
        selectedTerm={currentSelectedTerm}
        position={position}
        isOnLeftHalf={isOnLeftHalf}
      />
    </>
  )
}
