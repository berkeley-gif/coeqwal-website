"use client"

import React from "react"
import { Header } from "@repo/ui"
import type { SecondaryNavItem } from "@repo/ui"
import { useDrawerStore } from "@repo/state"
import { useRouter } from "next/navigation"

interface StoreConnectedHeaderProps {
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  showSecondaryNav?: boolean
  secondaryNavItems?: SecondaryNavItem[]
}

/**
 * Connects the Header component to the drawer store
 * Always visible regardless of scroll position
 */
export function StoreConnectedHeader({
  activeSection,
  onSectionClick,
}: StoreConnectedHeaderProps) {
  const router = useRouter()

  // Get individual pieces of state from the store to avoid infinite loop
  const activeTab = useDrawerStore((state) => state.activeTab)
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

  // Handle data page navigation
  const handleDataClick = () => {
    router.push("/data")
  }

  return (
    <Header
      activeSection={activeSection}
      onSectionClick={onSectionClick}
      onGlossaryClick={handleGlossaryToggle}
      onDataClick={handleDataClick}
      showSecondaryNav={false}
    />
  )
}
