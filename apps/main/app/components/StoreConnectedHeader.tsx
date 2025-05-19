"use client"

import React from "react"
import { HeaderHome } from "@repo/ui"
import type { SecondaryNavItem } from "@repo/ui"
import { useDrawerStore } from "@repo/state"

interface StoreConnectedHeaderProps {
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  showSecondaryNav?: boolean
  secondaryNavItems?: SecondaryNavItem[]
}

/**
 * Connects the HeaderHome component to the drawer store
 * Always visible regardless of scroll position
 */
export function StoreConnectedHeader({
  activeSection,
  onSectionClick,
  showSecondaryNav,
  secondaryNavItems,
}: StoreConnectedHeaderProps) {
  // Get individual pieces of state from the store to avoid infinite loop
  const activeTab = useDrawerStore((state) => state.activeTab)
  const isOpen = useDrawerStore((state) => state.isOpen)
  const openDrawer = useDrawerStore((state) => state.openDrawer)
  const closeDrawer = useDrawerStore((state) => state.closeDrawer)

  // Handle toggling the glossary tab
  const handleGlossaryToggle = () => {
    if (activeTab === "glossary") {
      closeDrawer()
    } else {
      openDrawer("glossary")
    }
  }

  return (
    <HeaderHome
      activeSection={activeSection}
      onSectionClick={onSectionClick}
      showSecondaryNav={showSecondaryNav}
      secondaryNavItems={secondaryNavItems}
      drawerOpen={isOpen}
      onGlossaryClick={handleGlossaryToggle}
      isGlossaryActive={activeTab === "glossary"}
    />
  )
}
