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
  variant?: "fixed" | "overlay" | "static" | "sticky"
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
  variant = "fixed",
  hideOnScroll = true,
  showLanguageSwitcher = true,
}: AppHeaderProps) {
  const theme = useTheme()

  return (
    <BaseHeader
      activeSection={activeSection}
      onSectionClick={onSectionClick}
      showSecondaryNav={showSecondaryNav}
      secondaryNavItems={secondaryNavItems}
      onDataClick={onDataClick}
      onToolsClick={onToolsClick}
      onAboutClick={onAboutClick}
      backgroundColor={theme.palette.overlay.water}
      textColor={theme.palette.text.primary}
      zIndex={theme.zIndex.appBar}
      borderRadius={theme.borderRadius.none}
      boxShadow="none"
      variant={variant}
      hideOnScroll={hideOnScroll}
      showLanguageSwitcher={showLanguageSwitcher}
    />
  )
}
