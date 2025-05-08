"use client"

import { Box, IconButton, Typography } from "@mui/material"
import { KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material"

interface ScrollDownIconProps {
  onClick?: () => void
  color?: string
  size?: number
  text?: string
}

export function ScrollDownIcon({
  onClick,
  color = "white",
  size = 40,
  text,
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
        maxWidth: "600px",
      }}
      onClick={onClick}
    >
      {text && (
        <Typography
          variant="body2"
          align="center"
          sx={{
            color,
            mb: 2,
            maxWidth: "100%",
            textShadow: "0px 0px 6px rgba(0, 0, 0, 0.7)",
          }}
        >
          {text}
        </Typography>
      )}
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
