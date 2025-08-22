"use client"

import React from "react"
import { Header } from "@repo/ui"

import { useRouter } from "next/navigation"

interface StoreConnectedHeaderProps {
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
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

  // Handle tools dropdown clicks
  const handleToolsClick = (tool: 'scenario-explorer' | 'needs-search') => {
    if (tool === 'scenario-explorer') {
      // TODO: Navigate to scenario data explorer
      console.log("Navigate to scenario data explorer")
    } else if (tool === 'needs-search') {
      // TODO: Navigate to needs-based search
      console.log("Navigate to needs-based search")
    }
  }

  return (
    <Header
      onDataClick={handleDataClick}
      onToolsClick={handleToolsClick}
    />
  )
}
