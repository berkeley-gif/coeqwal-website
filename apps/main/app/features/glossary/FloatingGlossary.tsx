"use client"

/**
 * FloatingGlossary - Floating glossary container
 *
 * Manages the floating glossary button and panel state.
 * Handles positioning and open/close behavior.
 * Only appears after user scrolls past the hero section.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useTheme, useMediaQuery } from "@repo/ui/mui"
import { useDrawerStore } from "@repo/state/drawer"
import { useMapMode } from "../map/store"
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const mapMode = useMapMode()
  const isExploreMap = mapMode === "explore"

  const [isOpen, setIsOpen] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const [dragRight, setDragRight] = useState<number | null>(null)
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

  const MAP_STRIP_PERCENT = 25
  const DEFAULT_BOTTOM = 32
  const DEFAULT_RIGHT = 32

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  )
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const mapStripRight =
    viewportWidth * (MAP_STRIP_PERCENT / 100) + DEFAULT_RIGHT

  const position: Position = useMemo(() => {
    if (hasDragged && dragRight != null) {
      const minRight = isExploreMap ? mapStripRight : 16
      return { bottom: DEFAULT_BOTTOM, right: Math.max(minRight, dragRight) }
    }
    return {
      bottom: DEFAULT_BOTTOM,
      right: isExploreMap ? mapStripRight : DEFAULT_RIGHT,
    }
  }, [hasDragged, dragRight, isExploreMap, mapStripRight])

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
    // Disable dragging on mobile - no horizontal repositioning on small screens
    if (isMobile) return

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

    const deltaX = dragStartRef.current.x - e.clientX
    const newRight = Math.max(16, dragStartRef.current.right + deltaX)
    setHasDragged(true)
    setDragRight(newRight)
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
        isMobile={isMobile}
      />
    </>
  )
}
