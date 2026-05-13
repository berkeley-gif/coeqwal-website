/**
 * TogglePair - Two-option toggle button component
 *
 * Displays two icons as toggle options with active state highlighting.
 */

import React from "react"
import { Box } from "@repo/ui/mui"

interface TogglePairProps {
  leftIcon: React.ReactNode
  rightIcon: React.ReactNode
  onLeftClick: () => void
  onRightClick: () => void
  gap?: number
  sx?: Record<string, unknown>
}

/**
 * Reusable toggle pair component for icon-based toggles
 * Each icon sets a specific state rather than toggling
 */
export default function TogglePair({
  leftIcon,
  rightIcon,
  onLeftClick,
  onRightClick,
  gap = 0,
  sx,
}: TogglePairProps) {
  return (
    <Box sx={{ display: "flex", ...sx }}>
      <Box sx={{ cursor: "pointer" }} onClick={onLeftClick}>
        {leftIcon}
      </Box>
      <Box sx={{ cursor: "pointer", marginLeft: gap }} onClick={onRightClick}>
        {rightIcon}
      </Box>
    </Box>
  )
}
