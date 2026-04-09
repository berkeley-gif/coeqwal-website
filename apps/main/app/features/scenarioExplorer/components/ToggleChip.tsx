"use client"

import { Box, useTheme } from "@repo/ui/mui"

export default function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  const theme = useTheme()
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.75,
        py: 0.25,
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "0.6875rem",
        fontWeight: active ? 600 : 400,
        lineHeight: 1.3,
        color: active ? theme.palette.blue.bright : theme.palette.grey[600],
        background: active
          ? theme.palette.interaction.selectedBackground
          : theme.palette.grey[200],
        transition: "all 150ms ease",
        "&:hover": {
          background: theme.palette.interaction.selectedBackground,
        },
      }}
    >
      {label}
    </Box>
  )
}
