"use client"

import { useRouter } from "next/navigation"
import { AppHeader } from "@repo/ui"

/**
 * Main application header with Next.js routing logic
 */
export function Header() {
  const router = useRouter()

  // Smooth scroll to top using requestAnimationFrame
  // Native smooth scroll gets interrupted by React state changes during the tabs
  // transition zone, so we use manual RAF animation which can't be interrupted
  const handleLogoClick = () => {
    const start = window.scrollY
    if (start === 0) return // Already at top
    
    const startTime = performance.now()
    const duration = 600 // ms - slightly faster feels snappier
    
    // Ease out cubic - fast start, smooth deceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      
      window.scrollTo(0, start * (1 - eased))
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }
    
    requestAnimationFrame(animateScroll)
  }

  // Handle data page navigation
  const handleDataClick = () => {
    router.push("/data")
  }

  // // Handle tools dropdown clicks
  // const handleToolsClick = (tool: "scenario-explorer" | "needs-search") => {
  //   if (tool === "scenario-explorer") {
  //     // TODO: Navigate to scenario data explorer
  //     console.log("Navigate to scenario data explorer")
  //   } else if (tool === "needs-search") {
  //     // TODO: Navigate to needs-based search
  //     console.log("Navigate to needs-based search")
  //   }
  // }

  // Handle about page clicks
  const handleAboutClick = () => {
    // TODO: Navigate to about page once it exists
    console.log("Navigate to about page")
  }

  return (
    <AppHeader
      onLogoClick={handleLogoClick}
      onDataClick={handleDataClick}
      // onToolsClick={handleToolsClick} // Disabled temporarily
      onAboutClick={handleAboutClick}
      hideOnScroll={false}
      showLanguageSwitcher={false}
    />
  )
}
