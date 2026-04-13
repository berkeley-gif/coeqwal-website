"use client"

/**
 * HydroclimateChooser - Circular icon-based hydroclimate selector
 *
 * Displays hydroclimate options as circular icons using MUI icons.
 * Currently only "Historical" is available, others are disabled.
 */

import React from "react"
import {
  Box,
  Typography,
  useTheme,
  HistoryIcon,
  ThunderstormIcon,
  WbSunnyIcon,
  LocalFireDepartmentIcon,
} from "@repo/ui/mui"
import { HybridTooltip } from "@repo/ui"
import {
  hydroclimateOptions,
  HYDROCLIMATE_ID_MAP,
} from "../../../content/scenarios"

/** Set of hydroclimate option values that have actual scenario data */
const AVAILABLE_HYDROCLIMATES = new Set(Object.keys(HYDROCLIMATE_ID_MAP))

// Icon and background color configuration for each hydroclimate
// Note: bgColor values are hydroclimate-specific (climate gradients) and not in theme (are experimental for now)
export const HYDROCLIMATE_CONFIG: Record<
  string,
  {
    icon: React.ElementType
    bgColor: string
  }
> = {
  historical: {
    icon: HistoryIcon,
    bgColor: "#2d89b7", // Cool blue - historical baseline
  },
  "warmer-wetter": {
    icon: ThunderstormIcon,
    bgColor: "#4caf50", // Green - wetter conditions
  },
  "warmer-drier-i": {
    icon: WbSunnyIcon,
    bgColor: "#f5a623", // Yellow-orange - mild dry
  },
  "warmer-drier-ii": {
    icon: WbSunnyIcon,
    bgColor: "#e65100", // Orange - moderate dry
  },
  "warmer-drier-iii": {
    icon: LocalFireDepartmentIcon,
    bgColor: "#bf360c", // Red-orange - severe dry
  },
  "warmer-drier-iv": {
    icon: LocalFireDepartmentIcon,
    bgColor: "#8b0000", // Dark red - extreme dry
  },
}

interface HydroclimateChooserProps {
  /** Currently selected hydroclimate value */
  value?: string
  /** Callback when a hydroclimate is selected */
  onChange?: (value: string) => void
  /** Layout variant: 'horizontal' for row, 'vertical' for column */
  layout?: "horizontal" | "vertical"
  /** Whether to show labels below icons */
  showLabels?: boolean
  /** Whether to show the section title */
  showTitle?: boolean
  /** Override icon circle size (width & height). Defaults to "40px". */
  iconSize?: string
  /** Override the MUI icon font-size inside the circle. Defaults to "1.5rem". */
  iconFontSize?: string
  /** When true, only show options that have data (hide disabled/coming-soon) */
  hideDisabled?: boolean
  /** Extra values to treat as disabled (shown greyed out, not clickable) */
  disabledValues?: Set<string>
}

export function HydroclimateChooser({
  value = "historical",
  onChange,
  layout = "horizontal",
  showLabels = false,
  showTitle = true,
  iconSize = "40px",
  iconFontSize = "1.5rem",
  hideDisabled = false,
  disabledValues,
}: HydroclimateChooserProps) {
  const theme = useTheme()

  const isVertical = layout === "vertical"

  const handleSelect = (optionValue: string) => {
    if (AVAILABLE_HYDROCLIMATES.has(optionValue) && onChange) {
      onChange(optionValue)
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: theme.space.gap.sm,
        flexShrink: 0,
      }}
    >
      {showTitle && (
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.grey[900],
            whiteSpace: "nowrap",
          }}
        >
          View outcomes by hydroclimate
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: theme.space.gap.xs,
          alignItems: isVertical ? "flex-start" : "center",
        }}
      >
        {hydroclimateOptions.map(
          (option: { value: string; label: string; description: string }) => {
            const config = HYDROCLIMATE_CONFIG[option.value]
            const IconComponent = config?.icon || HistoryIcon
            const isSelected = value === option.value
            const noData = !AVAILABLE_HYDROCLIMATES.has(option.value)
            const isDisabled =
              noData || (disabledValues?.has(option.value) ?? false)

            if (hideDisabled && noData) {
              return null
            }

            const iconButton = (
              <span style={{ display: "inline-flex" }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={isDisabled}
                  aria-label={`${option.label}${isDisabled ? " (Coming soon)" : ""}${isSelected ? " (selected)" : ""}`}
                  aria-pressed={isSelected}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: theme.space.gap.xs,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.4 : 1,
                    transition: theme.transition.default,
                    // Remove default button styles
                    background: "none",
                    border: "none",
                    padding: 0,
                    // WCAG 2.4.7: Focus visible styles
                    "&:focus-visible": {
                      outline: `2px solid ${theme.palette.blue.bright}`,
                      outlineOffset: "4px",
                      borderRadius: theme.borderRadius.circle,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: iconSize,
                      height: iconSize,
                      minWidth: iconSize,
                      minHeight: iconSize,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      borderRadius: theme.borderRadius.circle,
                      backgroundColor: isDisabled
                        ? theme.palette.grey[400]
                        : config?.bgColor || theme.palette.blue.bright,
                      border: isSelected
                        ? theme.border.highlight
                        : "3px solid transparent",
                      boxShadow: isSelected
                        ? theme.shadow.sm
                        : theme.shadow.none,
                      transition: theme.transition.default,
                      "&:hover": !isDisabled
                        ? {
                            transform: "scale(1.1)",
                            boxShadow: theme.shadow.sm,
                          }
                        : {},
                      // Invisible hit area
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: -4,
                      },
                    }}
                  >
                    <IconComponent
                      sx={{
                        color: theme.palette.common.white,
                        fontSize: iconFontSize,
                      }}
                    />
                  </Box>
                  {showLabels && (
                    <Typography
                      variant="compactMicro"
                      sx={{
                        color: isSelected
                          ? theme.palette.blue.darkest
                          : theme.palette.grey[600],
                        fontWeight: isSelected
                          ? theme.typography.fontWeightMedium
                          : theme.typography.fontWeightRegular,
                        textAlign: "center",
                        lineHeight: 1.2, // Tighter than variant default for data viz
                        maxWidth: 60,
                      }}
                    >
                      {option.label}
                    </Typography>
                  )}
                </Box>
              </span>
            )

            if (!isDisabled) {
              return (
                <HybridTooltip
                  key={option.value}
                  content={
                    <>
                      <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                        {option.label}
                      </Typography>
                      {option.description}
                    </>
                  }
                >
                  {iconButton}
                </HybridTooltip>
              )
            }

            return (
              <React.Fragment key={option.value}>{iconButton}</React.Fragment>
            )
          },
        )}
      </Box>
    </Box>
  )
}

export default HydroclimateChooser
