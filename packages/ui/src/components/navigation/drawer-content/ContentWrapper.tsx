"use client"

import React from "react"
import { Box, useTheme } from "@mui/material"

export interface ContentWrapperProps {
  /** Title displayed at the top of the content section */
  title: string
  /** Content to be displayed in the wrapper */
  children: React.ReactNode
  /** Function called when the close button is clicked */
  onClose: () => void
  /**
   * @deprecated No longer used since we now handle background color in the parent component
   */
  bgColor?: string
}

/**
 * Wrapper component for drawer content sections
 * Provides consistent styling without a close button (now in drawer header)
 */
export function ContentWrapper({ children }: ContentWrapperProps) {
  const theme = useTheme()

  return (
    <Box
      className="drawer-content-wrapper"
      sx={theme.mixins.drawerContent.contentWrapper}
    >
      {children}
    </Box>
  )
}

export default ContentWrapper
