"use client"

import { Box, useTheme } from "@repo/ui/mui"

type SimpleButtonProps = {
  label: string
  onClick: () => void
}

/** Plain text button, used in chart control rows */
export function SimpleButton({ label, onClick }: SimpleButtonProps) {
  const theme = useTheme()

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={label}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        px: 1.25,
        py: 0.5,
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        fontSize: "0.8125rem",
        fontWeight: 500,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        "&:hover": {
          background: theme.palette.interaction.selectedBackground,
          color: theme.palette.blue.bright,
        },
      }}
    >
      {label}
    </Box>
  )
}
