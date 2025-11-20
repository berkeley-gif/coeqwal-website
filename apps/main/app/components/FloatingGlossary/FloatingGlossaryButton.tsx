"use client"

import { Box, useTheme, MenuBookIcon } from "@repo/ui/mui"

interface FloatingGlossaryButtonProps {
  onClick: () => void
  isOpen: boolean
}

/**
 * Floating circular button for opening the glossary
 * Positioned in the bottom right corner of the viewport
 */
export function FloatingGlossaryButton({ onClick, isOpen }: FloatingGlossaryButtonProps) {
  const theme = useTheme()

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "fixed",
        bottom: 32,
        right: 32,
        width: 64,
        height: 64,
        borderRadius: "50%",
        backgroundColor: isOpen ? theme.palette.blue.bright : "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: isOpen 
          ? "0 0 0 4px rgba(33, 150, 243, 0.2)" 
          : "0 4px 20px rgba(0, 0, 0, 0.3)",
        transition: "all 0.3s ease",
        zIndex: theme.zIndex.drawer, // Above panel to remain clickable
        "&:hover": {
          transform: isOpen ? "none" : "scale(1.1)",
          boxShadow: isOpen 
            ? "0 0 0 4px rgba(33, 150, 243, 0.3)" 
            : "0 6px 24px rgba(0, 0, 0, 0.4)",
        },
        "&:active": {
          transform: "scale(0.95)",
        },
      }}
    >
      <MenuBookIcon
        sx={{
          fontSize: "2rem",
          color: "#fff",
        }}
      />
    </Box>
  )
}

