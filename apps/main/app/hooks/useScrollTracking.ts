"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Custom hook to track the currently visible section based on scroll position
 */
export function useScrollTracking(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState("")
  // Flag to track if we're currently performing a programmatic scroll
  const isProgrammaticScrolling = useRef(false)

  // Create the scroll handler as a memoized callback
  const checkActiveSection = useCallback(() => {
    // Skip checking during programmatic scrolling to prevent stuttering
    if (isProgrammaticScrolling.current) return

    // Calculate the threshold for section visibility (20% of viewport height)
    const threshold = Math.max(100, window.innerHeight * 0.2)
    let foundSection = false

    // Find the first section that's currently visible in the viewport
    for (const id of sectionIds) {
      if (!id) continue // Skip any undefined or empty IDs

      const element = document.getElementById(id)
      if (element) {
        const rect = element.getBoundingClientRect()

        // Consider a section visible if its top is within the top portion of the viewport
        // or if it occupies a significant portion of the viewport
        if (
          (rect.top <= threshold && rect.bottom >= threshold) ||
          (rect.top >= 0 && rect.top <= threshold * 2)
        ) {
          setActiveSection(id)
          foundSection = true
          return
        }
      }
    }

    // If no section is active (e.g., at the very top of the page)
    // Default to the first section
    if (!foundSection && sectionIds.length > 0 && sectionIds[0]) {
      setActiveSection(sectionIds[0])
    }
  }, [sectionIds])

  // Add scroll listener
  useEffect(() => {
    window.addEventListener("scroll", checkActiveSection)
    // Initial check with a small delay to ensure DOM is ready
    const initialCheck = setTimeout(checkActiveSection, 100)

    // Cleanup
    return () => {
      window.removeEventListener("scroll", checkActiveSection)
      clearTimeout(initialCheck)
    }
  }, [checkActiveSection]) // Only depend on the callback

  // Function to scroll to an element by ID with smooth animation
  const scrollToSection = useCallback((elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      // Set active section immediately to prevent stuttering
      setActiveSection(elementId)

      // Set flag to disable scroll checking during programmatic scrolling
      isProgrammaticScrolling.current = true

      // Calculate header offset (typically 64px for MUI AppBar)
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      // Use window.scrollTo with smooth behavior for better cross-browser support
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })

      // Re-enable scroll checking after animation completes
      // Animation typically takes ~1000ms
      setTimeout(() => {
        isProgrammaticScrolling.current = false
      }, 1000)
    }
  }, [])

  return { activeSection, scrollToSection }
}
