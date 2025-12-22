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
import { hydroclimateOptions } from "../../../content/scenarios"

// Icon configuration for each hydroclimate
const HYDROCLIMATE_CONFIG: Record<
  string,
  {
    icon: React.ElementType
    color: string
    bgColor: string
  }
> = {
  historical: {
    icon: HistoryIcon,
    color: "#ffffff",
    bgColor: "#2d89b7",
  },
  "warmer-wetter": {
    icon: ThunderstormIcon,
    color: "#ffffff",
    bgColor: "#4caf50",
  },
  "warmer-drier-i": {
    icon: WbSunnyIcon,
    color: "#ffffff",
    bgColor: "#f5a623",
  },
  "warmer-drier-ii": {
    icon: WbSunnyIcon,
    color: "#ffffff",
    bgColor: "#e65100",
  },
  "warmer-drier-iii": {
    icon: LocalFireDepartmentIcon,
    color: "#ffffff",
    bgColor: "#bf360c",
  },
}

interface HydroclimateChooserProps {
  /** Currently selected hydroclimate value */
  value?: string
  /** Callback when a hydroclimate is selected */
  onChange?: (value: string) => void
  /** Layout variant: 'horizontal' for row, 'vertical' for column */
  layout?: "horizontal" | "vertical"
  /** Size variant: 'small' for compact displays, 'default' for standard */
  size?: "small" | "default"
  /** Whether to show labels below icons */
  showLabels?: boolean
  /** Whether to show the section title */
  showTitle?: boolean
}

export function HydroclimateChooser({
  value = "historical",
  onChange,
  layout = "horizontal",
  size = "default",
  showLabels = false,
  showTitle = true,
}: HydroclimateChooserProps) {
  const theme = useTheme()

  const isVertical = layout === "vertical"
  const iconSize =
    size === "small"
      ? { xs: theme.spacing(3.5), lg: theme.spacing(4) }
      : { xs: theme.spacing(4), lg: theme.spacing(5) }

  const handleSelect = (optionValue: string) => {
    // Only allow selection of historical for now
    if (optionValue === "historical" && onChange) {
      onChange(optionValue)
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1,
      }}
    >
      {showTitle && (
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: theme.typography.fontWeightMedium,
            fontSize:
              size === "small"
                ? theme.typography.caption.fontSize
                : theme.typography.body2.fontSize,
            color: theme.palette.grey[900],
            whiteSpace: "nowrap",
          }}
        >
          Hydroclimate
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: size === "small" ? 0.5 : 1,
          alignItems: isVertical ? "flex-start" : "center",
        }}
      >
        {hydroclimateOptions.map(
          (option: { value: string; label: string; description: string }) => {
            const config = HYDROCLIMATE_CONFIG[option.value]
            const IconComponent = config?.icon || HistoryIcon
            const isSelected = value === option.value
            const isDisabled = option.value !== "historical"

            return (
              <HybridTooltip
                key={option.value}
                content={
                  <>
                    <Box
                      component="span"
                      sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                    >
                      {option.label}
                      {isDisabled && " (Coming soon)"}
                    </Box>
                    {option.description}
                  </>
                }
              >
                <Box
                  onClick={() => handleSelect(option.value)}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.4 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <Box
                    sx={{
                      width: iconSize,
                      height: iconSize,
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
                      boxShadow: isSelected ? theme.shadow.sm : theme.shadow.none,
                      transition: "all 0.2s ease",
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
                        color: config?.color || "#ffffff",
                        fontSize: size === "small" ? "1.25rem" : "1.5rem",
                      }}
                    />
                  </Box>
                  {showLabels && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.6rem",
                        color: isSelected
                          ? theme.palette.blue.darkest
                          : theme.palette.grey[600],
                        fontWeight: isSelected
                          ? theme.typography.fontWeightMedium
                          : theme.typography.fontWeightRegular,
                        textAlign: "center",
                        lineHeight: 1.2,
                        maxWidth: 60,
                      }}
                    >
                      {option.label}
                    </Typography>
                  )}
                </Box>
              </HybridTooltip>
            )
          },
        )}
      </Box>
    </Box>
  )
}

export default HydroclimateChooser
