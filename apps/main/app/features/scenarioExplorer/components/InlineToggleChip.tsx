"use client"

/**
 * InlineToggleChip - Compact pill control with check / radio icon states.
 *
 * Used in the radar (and similar) chart controls row and inside ChartToast
 * guidance copy so the same control can be referenced inline; optional
 * `onDarkBackground` uses an opaque light fill for contrast on dark toasts.
 */

import { Box, useTheme, icons } from "@repo/ui/mui"

const ON_DARK_PANEL_CHIP_BG = "#ebf1f6"
const ON_DARK_PANEL_CHIP_HOVER_BG = "#dde8f0"

export function InlineToggleChip({
  label,
  active,
  onClick,
  onDarkBackground = false,
}: {
  label: string
  active: boolean
  onClick: () => void
  /** Opaque light fill so the chip reads on dark toast / panel backgrounds. */
  onDarkBackground?: boolean
}) {
  const theme = useTheme()
  const Icon = active ? icons.CheckCircle : icons.RadioButtonUnchecked

  // `action.disabledBackground` resolves to a light-grey in the normal
  // light theme and to a subtle white overlay under the tuner dark theme,
  // so the chip reads correctly in both contexts without any prop change.
  const defaultInactiveBg = theme.palette.action.disabledBackground
  const defaultActiveBg = theme.palette.interaction.selectedBackground

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
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
        color: active ? theme.palette.blue.bright : theme.palette.grey[800],
        background: onDarkBackground
          ? ON_DARK_PANEL_CHIP_BG
          : active
            ? defaultActiveBg
            : defaultInactiveBg,
        transition: "all 150ms ease",
        "&:hover": {
          background: onDarkBackground
            ? ON_DARK_PANEL_CHIP_HOVER_BG
            : defaultActiveBg,
          color: theme.palette.blue.bright,
        },
      }}
    >
      <Icon sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
      {label}
    </Box>
  )
}
