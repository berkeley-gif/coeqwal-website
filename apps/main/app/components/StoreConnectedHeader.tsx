"use client"

import React from "react"
import { Header } from "@repo/ui"
import type { SecondaryNavItem } from "@repo/ui"

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

  // Handle data page navigation
  const handleDataClick = () => {
    router.push("/data")
  }

  return (
    <Header
      activeSection={activeSection}
      onSectionClick={onSectionClick}
      onDataClick={handleDataClick}
      showSecondaryNav={false}
    />
  )
}
