"use client"

/**
 * InlineToggleChip - Compact pill control with check / radio icon states.
 *
 * Used in the radar (and similar) chart controls row and inside ChartToast
 * guidance copy so the same control can be referenced inline. Optional
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
  ariaLabel,
}: {
  label: string
  active: boolean
  onClick: () => void
  /** Opaque light fill so the chip reads on dark toast / panel backgrounds. */
  onDarkBackground?: boolean
  /** If set, used for `aria-label` instead of `label` (e.g. longer state help). */
  ariaLabel?: string
}) {
  const theme = useTheme()
  const Icon = active ? icons.CheckCircle : icons.RadioButtonUnchecked

  // Light-grey surface for inactive chips. `action.disabledBackground`
  // used to resolve to a neutral grey but now resolves to white in the
  // app theme, so we pin to grey[100] to preserve the readable pill
  // silhouette on white panels.
  const defaultInactiveBg = theme.palette.grey[100]
  const defaultActiveBg = theme.palette.interaction.selectedBackground

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel ?? label}
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
