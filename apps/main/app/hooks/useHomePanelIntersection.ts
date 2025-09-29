"use client"

import { useEffect, useState } from "react"

/**
 * Hook to detect when the user has scrolled past the home panel
 * Uses intersection observer to watch for when the home panel exits the viewport
 * 
 * @returns boolean - true when user has scrolled past the home panel
 */
export function useHomePanelIntersection() {
  const [hasPassedHomePanel, setHasPassedHomePanel] = useState(false)

  useEffect(() => {
    // Find the home panel element
    const homePanel = document.getElementById("home")
    
    if (!homePanel) {
      // If no home panel found, assume we've passed it (fallback)
      setHasPassedHomePanel(true)
      return
    }

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        
        // When the home panel is no longer intersecting (fully out of view)
        // and the user has scrolled down, show the glossary tab
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setHasPassedHomePanel(true)
        } else if (entry.isIntersecting) {
          // If the home panel comes back into view, hide the glossary tab
          setHasPassedHomePanel(false)
        }
      },
      {
        // Trigger when the home panel is completely out of view
        rootMargin: "0px",
        threshold: 0,
      }
    )

    // Start observing
    observer.observe(homePanel)

    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [])

  return hasPassedHomePanel
}
