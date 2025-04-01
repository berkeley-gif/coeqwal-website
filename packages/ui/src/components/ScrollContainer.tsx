"use client"

import React from "react"
import { Box } from "@mui/material"

interface ScrollContainerProps {
  children: React.ReactNode
  snapScroll?: boolean
}

export function ScrollContainer({
  children,
  snapScroll = true,
}: ScrollContainerProps) {
  return (
    <Box
      sx={{
        height: "100vh",
        overflowY: "auto",
        scrollBehavior: "smooth",
        scrollSnapType: snapScroll ? "y mandatory" : "none",
        "&::-webkit-scrollbar": {
          width: "10px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: (theme) => theme.palette.primary.light,
          borderRadius: "5px",
        },
      }}
    >
      {children}
    </Box>
  )
}
