"use client"

import React from "react"
import { HeaderHome } from "./HeaderHome"
import { useRouter } from "next/navigation"

export interface AppHeaderProps {
  onDataClick?: () => void
  onToolsClick?: (tool: "scenario-explorer" | "needs-search") => void
}

/**
 * Main application header component with navigation and routing logic
 */
export function AppHeader({ onDataClick, onToolsClick }: AppHeaderProps = {}) {
  const router = useRouter()

  // Handle data page navigation
  const handleDataClick = () => {
    if (onDataClick) {
      onDataClick()
    } else {
      router.push("/data")
    }
  }

  // Handle tools dropdown clicks
  const handleToolsClick = (tool: "scenario-explorer" | "needs-search") => {
    if (onToolsClick) {
      onToolsClick(tool)
    } else {
      // Default behavior
      if (tool === "scenario-explorer") {
        console.log("Navigate to scenario data explorer")
      } else if (tool === "needs-search") {
        console.log("Navigate to needs-based search")
      }
    }
  }

  return (
    <HeaderHome onDataClick={handleDataClick} onToolsClick={handleToolsClick} />
  )
}
