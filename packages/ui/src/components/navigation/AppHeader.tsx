"use client"

import { useTheme } from "@mui/material/styles"
import { BaseHeader, type SecondaryNavItem } from "./BaseHeader"

export interface AppHeaderProps {
  // Navigation props
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  showSecondaryNav?: boolean
  secondaryNavItems?: SecondaryNavItem[]

  // Action handlers
  onDataClick?: () => void
  onToolsClick?: (tool: "scenario-explorer" | "needs-search") => void
  onAboutClick?: () => void

  // Layout props
  hideOnScroll?: boolean
  showLanguageSwitcher?: boolean
}

/**
 * Main application header component with theme integration
 * This wrapper applies the current theme to the BaseHeader component
 */
export function AppHeader({
  activeSection,
  onSectionClick,
  showSecondaryNav = false,
  secondaryNavItems = [],
  onDataClick,
  onToolsClick,
  onAboutClick,
  hideOnScroll = true,
  showLanguageSwitcher = true,
}: AppHeaderProps) {
  const theme = useTheme()

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

  const handleAboutClick = () => {
    if (onAboutClick) {
      onAboutClick()
    } else {
      console.log("About click - no handler provided")
    }
  }

  return (
    <BaseHeader
      activeSection={activeSection}
      onSectionClick={onSectionClick}
      showSecondaryNav={showSecondaryNav}
      secondaryNavItems={secondaryNavItems}
      onDataClick={handleDataClick}
      onToolsClick={handleToolsClick}
      onAboutClick={handleAboutClick}
      backgroundColor={theme.palette.overlay.water}
      textColor={theme.palette.text.primary}
      zIndex={theme.zIndex.appBar}
      borderRadius={theme.borderRadius.none}
      boxShadow="none"
      hideOnScroll={hideOnScroll}
      showLanguageSwitcher={showLanguageSwitcher}
    />
  )
}
