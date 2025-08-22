"use client"

import { HeaderHome } from "./HeaderHome"

export interface AppHeaderProps {
  onDataClick?: () => void
  onToolsClick?: (tool: "scenario-explorer" | "needs-search") => void
}

/**
 * Main application header component with navigation and routing logic
 */
export function AppHeader({ onDataClick, onToolsClick }: AppHeaderProps = {}) {
  // Default handlers that just log - applications should provide their own
  const handleDataClick = () => {
    if (onDataClick) {
      onDataClick()
    } else {
      console.log("Data click - no handler provided")
    }
  }

  const handleToolsClick = (tool: "scenario-explorer" | "needs-search") => {
    if (onToolsClick) {
      onToolsClick(tool)
    } else {
      console.log(`Tools click: ${tool} - no handler provided`)
    }
  }

  return (
    <HeaderHome onDataClick={handleDataClick} onToolsClick={handleToolsClick} />
  )
}
