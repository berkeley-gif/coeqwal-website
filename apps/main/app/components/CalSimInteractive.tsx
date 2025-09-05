"use client"

import { useState, useCallback } from "react"

interface CalSimInteractiveProps {
  onToggle?: (enabled: boolean) => void
}

// Simple hook to manage CalSim toggle state
export function useCalSimToggle() {
  const [isCalSimVisible, setIsCalSimVisible] = useState(false)

  const toggleCalSim = useCallback(() => {
    const newState = !isCalSimVisible
    setIsCalSimVisible(newState)
  }, [isCalSimVisible])

  return {
    isCalSimVisible,
    toggleCalSim
  }
}

export default function CalSimInteractive({ onToggle }: CalSimInteractiveProps) {
  return null // This component is no longer needed bc CalSimMarkers handles everything
}