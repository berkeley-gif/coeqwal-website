"use client"

import { Box, useTheme, icons, type SxProps, type Theme } from "@repo/ui/mui"

type SaveSnapshotButtonProps = {
  disabled?: boolean
  onClick: () => void
  sx?: SxProps<Theme>
  /** Text and accessible name; defaults to "save snapshot" */
  label?: string
}

/** Toolbar control that stages the main chart in view for sharing */
export function SaveSnapshotButton({
  disabled = false,
  onClick,
  sx,
  label = "save snapshot",
}: SaveSnapshotButtonProps) {
  const theme = useTheme()

  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
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
        fontSize: "0.8125rem",
        fontWeight: 500,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        color: theme.palette.grey[800],
        background: theme.palette.grey[200],
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 150ms ease",
        "&:hover": {
          background: disabled
            ? undefined
            : theme.palette.interaction.selectedBackground,
          color: disabled ? undefined : theme.palette.blue.bright,
        },
        ...sx,
      }}
    >
      <icons.IosShare sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
      {label}
    </Box>
  )
}
