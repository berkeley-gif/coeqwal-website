import React from "react"
import {
  Box,
  Typography,
  useTheme,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@repo/ui/mui"
import { Card } from "@repo/ui"
import { hydroclimateOptions } from "../../../lib/scenarios"

interface HydroclimateCardProps {
  layout?: "horizontal" | "vertical"
  variant?: "full" | "compact"
  showCard?: boolean
}

/**
 * HydroclimateCard, allows users to select hydroclimate scenarios
 * Currently only "Historical" is available, others are disabled
 * Supports both horizontal (list view) and vertical (map overlay) layouts
 */
export default function HydroclimateCard({
  layout = "horizontal",
  variant = "full",
  showCard = true,
}: HydroclimateCardProps) {
  const theme = useTheme()

  const isVertical = layout === "vertical"
  const isCompact = variant === "compact"

  const content = (
    <Box
      sx={{
        display: "flex",
        alignItems: isVertical ? "flex-start" : "baseline",
        gap: isVertical ? 1 : 3,
        flexDirection: isVertical ? "column" : "row",
        flexWrap: isVertical ? "nowrap" : "wrap",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ mb: 0, fontWeight: 500, fontSize: "1rem" }}
      >
        See hydroclimate effects
      </Typography>

      <FormControl component="fieldset" sx={{ mt: isVertical ? 0 : "-2px" }}>
        <RadioGroup
          value="historical"
          sx={{
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            gap: isVertical ? theme.spacing(1) : 2,
            flexWrap: "wrap",
          }}
        >
          {hydroclimateOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              disabled={option.value !== "historical"}
              control={
                <Radio
                  disabled={option.value !== "historical"}
                  sx={{
                    padding: "9px",
                    transform: "none !important",
                    border: `1px solid ${theme.palette.grey[500]} !important`,
                    "&.Mui-checked": {
                      backgroundColor: `${theme.palette.blue.bright} !important`,
                      borderColor: `${theme.palette.blue.bright} !important`,
                    },
                    "&.Mui-checked::after": {
                      top: "50% !important",
                      left: "50% !important",
                      transform: "translate(-50%, -50%) !important",
                    },
                    "&.Mui-disabled": {
                      borderColor: `${theme.palette.grey[500]} !important`,
                      backgroundColor: "transparent !important",
                    },
                    "& .MuiSvgIcon-root": {
                      display: "none",
                    },
                  }}
                />
              }
              label={option.label}
              sx={{
                m: 0,
                alignItems: "center",
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.875rem",
                  fontWeight: option.value === "historical" ? 500 : 400,
                  color: `${
                    option.value === "historical"
                      ? theme.palette.text.primary
                      : theme.palette.grey[500]
                  } !important`,
                },
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  )

  // Wrap in Card only if showCard is true
  if (showCard) {
    return (
      <Card
        sx={{
          backgroundColor: theme.palette.common.white,
          borderRadius: theme.borderRadius.rounded,
          padding: theme.spacing(theme.cards.spacing.standard),
        }}
      >
        {content}
      </Card>
    )
  }

  return content
}
