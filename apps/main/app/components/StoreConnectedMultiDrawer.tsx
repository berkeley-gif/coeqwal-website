"use client"

import React from "react"
import { MultiDrawer, TabKey } from "@repo/ui"
import { useDrawerStore } from "@repo/state"

export interface StoreConnectedMultiDrawerProps {
  drawerWidth?: number
  overlay?: boolean
  visible?: boolean
}

/**
 * A wrapper around MultiDrawer that connects to our Zustand drawer store
 * This enables central management of drawer state while keeping
 * the UI component pure
 */
export function StoreConnectedMultiDrawer({
  drawerWidth = 360,
  overlay = false,
  visible = true,
}: StoreConnectedMultiDrawerProps) {
  // Get state and actions from the Zustand store
  const { activeTab, setActiveTab, content } = useDrawerStore()

  // Handle drawer state changes from the MultiDrawer component
  const handleDrawerStateChange = (isOpen: boolean, tab: TabKey | null) => {
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
      visible={visible}
      drawerContent={content}
    />
  )
}
