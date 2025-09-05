"use client"

import React from "react"
import { Box } from "@mui/material"

export interface ContentWrapperProps {
  /** Title displayed at the top of the content section */
  title: string
  /** Content to be displayed in the wrapper */
  children: React.ReactNode
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Custom styles for the wrapper */
  wrapperStyles?: React.CSSProperties
}

/**
 * Wrapper component for drawer content sections
 * Provides consistent styling without a close button (now in drawer header)
 */
export function ContentWrapper({
  children,
  wrapperStyles,
}: ContentWrapperProps) {
  return (
    <Box className="drawer-content-wrapper" sx={wrapperStyles}>
      {children}
    </Box>
  )
}

export default ContentWrapper
