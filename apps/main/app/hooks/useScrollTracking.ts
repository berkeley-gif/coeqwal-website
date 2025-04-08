import { useState, useEffect } from "react"

/**
 * Custom hook to track the currently visible section based on scroll position
 */
export function useScrollTracking(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState("")

  // Add scroll listener - only runs once on mount
  useEffect(() => {
    // Function to check which section is currently visible
    const checkActiveSection = () => {
      // Find the first section that's currently visible in the viewport
      for (const id of sectionIds) {
        const element = document.getElementById(id)
        if (element) {
          const rect = element.getBoundingClientRect()
          // Check if the element is at least partially visible in the viewport
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(id)
            return
          }
        }
      }

      // If no section is active (e.g., at the very top of the page)
      setActiveSection("")
    }

    window.addEventListener("scroll", checkActiveSection)
    checkActiveSection() // Initial check

    // Cleanup
    return () => {
      window.removeEventListener("scroll", checkActiveSection)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array means this effect runs once on mount

  // Function to scroll to an element by ID with smooth animation
  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      // Use the native scrollIntoView with smooth behavior
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })

      setActiveSection(elementId)
    }
  }

  return { activeSection, scrollToSection }
}
