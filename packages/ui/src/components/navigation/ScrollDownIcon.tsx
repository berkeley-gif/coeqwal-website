"use client"

import { Box, IconButton } from "@mui/material"
import { KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material"

interface ScrollDownIconProps {
  onClick?: () => void
  color?: string
  size?: number
}

export function ScrollDownIcon({
  onClick,
  color = "white",
  size = 40,
}: ScrollDownIconProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      onClick={onClick}
    >
      <IconButton
        sx={{
          color,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          },
          width: size,
          height: size,
        }}
      >
        <KeyboardArrowDownIcon sx={{ fontSize: size / 1.5 }} />
      </IconButton>
    </Box>
  )
}
