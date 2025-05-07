"use client"

import React from "react"
import { Box, IconButton, useTheme } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

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
 * Provides consistent styling and a close button
 */
export function ContentWrapper({
  title,
  children,
  onClose,
}: ContentWrapperProps) {
  const theme = useTheme()

  return (
    <Box
      className="drawer-content-wrapper"
      sx={theme.mixins.drawerContent.contentWrapper}
    >
      <Box sx={theme.mixins.drawerContent.headerBox}>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="close"
          sx={theme.mixins.drawerContent.closeButton}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {children}
    </Box>
  )
}

export default ContentWrapper
