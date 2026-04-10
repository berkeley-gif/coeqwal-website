"use client"

import { Box, Tooltip, useTheme, icons } from "@repo/ui/mui"

export default function ToggleChip({
  label,
  active,
  onClick,
  tooltip,
}: {
  label: string
  active: boolean
  onClick: () => void
  tooltip?: string
}) {
  const theme = useTheme()

  const Icon = active ? icons.CheckCircle : icons.RadioButtonUnchecked

  const chip = (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={tooltip ?? label}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        px: 0.75,
        py: 0.375,
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "0.6875rem",
        fontWeight: 500,
        lineHeight: 1.3,
        color: active ? theme.palette.blue.bright : theme.palette.grey[600],
        background: active
          ? theme.palette.interaction.selectedBackground
          : theme.palette.grey[200],
        transition: "all 150ms ease",
        "&:hover": {
          background: theme.palette.interaction.selectedBackground,
          color: theme.palette.blue.bright,
        },
      }}
    >
      <Icon sx={{ fontSize: "0.625rem", flexShrink: 0 }} />
      {label}
    </Box>
  )

  if (!tooltip) return chip

  return (
    <Tooltip title={tooltip} placement="bottom" arrow enterDelay={400}>
      {chip}
    </Tooltip>
  )
}
