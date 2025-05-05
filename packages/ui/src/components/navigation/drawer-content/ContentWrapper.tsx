"use client"

import React from "react"
import { Box, IconButton, Typography } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

export interface ContentWrapperProps {
  /** Title displayed at the top of the content section */
  title: string
  /** Content to be displayed in the wrapper */
  children: React.ReactNode
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Optional background color for the wrapper */
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
  bgColor,
}: ContentWrapperProps) {
  return (
    <Box
      className="drawer-content-wrapper"
      sx={{
        p: 2,
        width: "100%",
        height: "100%",
        overflow: "auto",
        bgcolor: bgColor,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          pb: 1,
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {children}
    </Box>
  )
}

export default ContentWrapper
