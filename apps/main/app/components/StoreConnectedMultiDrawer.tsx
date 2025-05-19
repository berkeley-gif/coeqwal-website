"use client"

import React from "react"
import { MultiDrawer } from "@repo/ui"
import { useDrawerStore } from "@repo/state"
import type { TabKey } from "@repo/ui"
import { HeaderHome } from "@repo/ui"

interface StoreConnectedMultiDrawerProps {
  drawerWidth?: number
  visible?: boolean
  overlay?: boolean
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  showSecondaryNav?: boolean
  secondaryNavItems?: any[]
}

/**
 * Connects the MultiDrawer component to the drawer store
 * and coordinates with the HeaderHome component
 */
export function StoreConnectedMultiDrawer({
  drawerWidth,
  visible = true,
  overlay = false,
  activeSection,
  onSectionClick,
  showSecondaryNav,
  secondaryNavItems,
}: StoreConnectedMultiDrawerProps) {
  // Get individual pieces of state from the store to avoid infinite loop
  const activeTab = useDrawerStore((state) => state.activeTab)
  const content = useDrawerStore((state) => state.content)
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

  // Sync drawer state with store
  const handleDrawerStateChange = (open: boolean, tab: TabKey | null) => {
    if (open && tab) {
      openDrawer(tab)
    } else {
      closeDrawer()
    }
  }

  return (
    <>
      <HeaderHome
        activeSection={activeSection}
        onSectionClick={onSectionClick}
        showSecondaryNav={showSecondaryNav}
        secondaryNavItems={secondaryNavItems}
        drawerOpen={isOpen}
        onGlossaryClick={handleGlossaryToggle}
        isGlossaryActive={activeTab === "glossary"}
      />

      <MultiDrawer
        drawerWidth={drawerWidth}
        activeTab={activeTab}
        onDrawerStateChange={handleDrawerStateChange}
        overlay={overlay}
        visible={visible}
        drawerContent={content}
      />
    </>
  )
}
