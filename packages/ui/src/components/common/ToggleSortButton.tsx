"use client"

/**
 * ToggleSortButton - Single-click sort toggle button
 *
 * Cycles through sort states: unsorted → ascending → descending → unsorted
 * Uses MUI's SwapVert icon for unsorted, and directional arrows for sorted states.
 * Larger and easier to click than the dual-arrow SortButton.
 */

import React from "react"
import {
  IconButton,
  SwapVertIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
} from "../.."
import { Theme } from "@mui/material/styles"

// ============================================================================
// TYPES
// ============================================================================
export type SortState = "asc" | "desc" | null

export interface ToggleSortButtonProps {
  /** Current sort state */
  sortState: SortState
  /** Called when sort state changes */
  onToggle: (newState: SortState) => void
  /** Tooltip title */
  title?: string
  /** Size of the button */
  size?: "small" | "medium"
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function ToggleSortButton({
  sortState,
  onToggle,
  title = "Sort",
  size = "small",
}: ToggleSortButtonProps) {
  const isSorted = sortState !== null

  // Cycle through states: null → asc → desc → null
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (sortState === null) {
      onToggle("asc")
    } else if (sortState === "asc") {
      onToggle("desc")
    } else {
      onToggle(null)
    }
  }

  // Choose icon based on state
  const Icon =
    sortState === "asc"
      ? ArrowUpwardIcon
      : sortState === "desc"
        ? ArrowDownwardIcon
        : SwapVertIcon

  // Slightly smaller than InfoIconButton (1.2rem) since arrow icons are visually larger
  const iconSize = size === "small" ? "1rem" : "1.15rem"
  const buttonSize = size === "small" ? 24 : 28

  return (
    <IconButton
      onClick={handleClick}
      title={title}
      size="small"
      sx={{
        width: buttonSize,
        height: buttonSize,
        minWidth: buttonSize,
        minHeight: buttonSize,
        backgroundColor: (theme: Theme) =>
          isSorted
            ? `${theme.palette.blue.bright}20`
            : `${theme.palette.grey[500]}10`,
        color: (theme: Theme) =>
          isSorted ? theme.palette.blue.bright : theme.palette.grey[500],
        transition: (theme: Theme) => theme.transition.quick,
        "&:hover": {
          backgroundColor: (theme: Theme) =>
            isSorted
              ? `${theme.palette.blue.bright}30`
              : `${theme.palette.grey[500]}20`,
          color: (theme: Theme) =>
            isSorted ? theme.palette.blue.darkest : theme.palette.grey[700],
        },
      }}
    >
      <Icon sx={{ fontSize: iconSize }} />
    </IconButton>
  )
}

export default ToggleSortButton
