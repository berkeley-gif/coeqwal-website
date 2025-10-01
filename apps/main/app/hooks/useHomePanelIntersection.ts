"use client"

import { useEffect, useState } from "react"

/**
 * Hook to detect when the user has passed the home panel
 * Used to trigger showing the glossary
 *
 * @returns boolean - true when user has reached the first panel after home panel ("frontmatter")
 */
export function useHomePanelIntersection() {
  const [hasReachedFrontmatter, setHasReachedFrontmatter] = useState(false)

  useEffect(() => {
    // Find the frontmatter panel element
    const frontmatterPanel = document.getElementById("frontmatter")

    if (!frontmatterPanel) {
      // If no frontmatter panel found, assume we've reached it (fallback)
      setHasReachedFrontmatter(true)
      return
    }

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (!entry) return

        // When the frontmatter panel is intersecting, show the glossary tab
        if (entry.isIntersecting) {
          setHasReachedFrontmatter(true)
        } else if (entry.boundingClientRect.top > 0) {
          // If we've scrolled back up above the frontmatter panel, hide the glossary tab
          setHasReachedFrontmatter(false)
        }
      },
      {
        // Trigger when the frontmatter panel starts entering the viewport
        rootMargin: "0px 0px -50% 0px", // Trigger when top half is visible
        threshold: 0,
      },
    )

    // Start observing
    observer.observe(frontmatterPanel)

    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [])

  return hasReachedFrontmatter
}
