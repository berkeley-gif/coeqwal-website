"use client"

import React from "react"
import { InfoIcon } from "../.."
import { InfoTooltip } from "../.."
import { Box, Typography } from "../.."

export interface InfoIconButtonProps {
  /** Mode of operation - tooltip or glossary */
  mode: "tooltip" | "glossary"
  /** Content for tooltip mode - can be string or JSX */
  tooltipContent?: React.ReactNode
  /** Glossary entry key for glossary mode */
  glossaryEntry?: string
  /** Tooltip placement */
  placement?: "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right"
  /** Custom styling */
  sx?: object
  /** Callback for glossary mode */
  onGlossaryOpen?: (entry: string) => void
}

/**
 * Reusable info icon button that can either show a tooltip or open a glossary entry.
 * 
 * Features:
 * - Tooltip mode: Shows content in a tooltip on hover
 * - Glossary mode: Opens glossary to specific entry on click
 */
export function InfoIconButton({
  mode,
  tooltipContent,
  glossaryEntry,
  placement = "top-start",
  sx = {},
  onGlossaryOpen,
}: InfoIconButtonProps) {
  const handleClick = () => {
    if (mode === "glossary" && glossaryEntry && onGlossaryOpen) {
      onGlossaryOpen(glossaryEntry)
    }
  }

  const iconStyles = {
    fontSize: "1rem",
    color: (theme: any) => theme.palette.text.secondary,
    cursor: "pointer",
    "&:hover": {
      color: (theme: any) => theme.palette.blue.bright,
    },
    ...sx,
  }

  // Tooltip mode: wrap in InfoTooltip
  if (mode === "tooltip" && tooltipContent) {
    return (
      <InfoTooltip
        description={tooltipContent}
        placement={placement}
      >
        <InfoIcon sx={iconStyles} />
      </InfoTooltip>
    )
  }

  // Glossary mode: direct click handler
  if (mode === "glossary" && glossaryEntry) {
    return (
      <InfoIcon 
        sx={iconStyles}
        onClick={handleClick}
      />
    )
  }

  // Fallback: just the icon without functionality
  return <InfoIcon sx={iconStyles} />
}

export default InfoIconButton
