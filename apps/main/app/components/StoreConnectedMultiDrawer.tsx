"use client"

import React from "react"
import { MultiDrawer } from "@repo/ui"
import { useDrawerStore } from "@repo/state"

interface StoreConnectedMultiDrawerProps {
  drawerWidth?: number
  overlay?: boolean
}

/**
 * A wrapper around MultiDrawer that connects to our Zustand drawer store
 * This enables central management of drawer state while keeping
 * the UI component pure
 */
export function StoreConnectedMultiDrawer({
  drawerWidth = 360,
  overlay = false,
}: StoreConnectedMultiDrawerProps) {
  // Get state and actions from the Zustand store
  const { activeTab, setActiveTab, isOpen } = useDrawerStore()

  // Handle drawer state changes from the MultiDrawer component
  const handleDrawerStateChange = (isOpen: boolean, tab: any) => {
    if (isOpen && tab) {
      setActiveTab(tab)
    } else {
      setActiveTab(null)
    }
  }

  return (
    <MultiDrawer
      drawerWidth={drawerWidth}
      onDrawerStateChange={handleDrawerStateChange}
      activeTab={activeTab}
      overlay={overlay}
    />
  )
}
