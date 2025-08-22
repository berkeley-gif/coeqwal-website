"use client"

import { useState } from "react"
import { useDrawerStore } from "@repo/state"
import type { TabKey } from "@repo/ui"

/**
 * Hook to handle opening the glossary with specific learn content
 * Manages the MultiDrawer's glossary tab state and content
 */
export function useGlossaryHandler() {
  // Legacy state management for components not yet migrated
  const [, setDrawerOpen] = useState(false)
  const [activeDrawerTab, setActiveDrawerTab] = useState<TabKey | null>(null)
  const { openDrawer, closeDrawer } = useDrawerStore.getState()

  const handleOpenGlossary = (sectionId?: string) => {
    // Check if the glossary is already open with this section
    if (activeDrawerTab === "glossary") {
      const drawerStore = useDrawerStore.getState()
      const currentSection = drawerStore.content?.selectedSection as
        | string
        | undefined

      if (currentSection === sectionId) {
        // Same section - close (toggle behavior)
        closeDrawer()
        setDrawerOpen(false)
        setActiveDrawerTab(null)
        return
      } else {
        // Different section - update content
        drawerStore.setDrawerContent({ selectedSection: sectionId })
        return
      }
    }

    // Open glossary with specific section content
    if (sectionId) {
      useDrawerStore.getState().setDrawerContent({ selectedSection: sectionId })
    }
    openDrawer("glossary")

    // Legacy state sync
    setDrawerOpen(true)
    setActiveDrawerTab("glossary")
  }

  return { handleOpenGlossary }
}
