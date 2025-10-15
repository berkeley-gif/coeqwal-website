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

/**
 * HydroclimateCard, allows users to select hydroclimate scenarios
 * Currently only "Historical" is available, others are disabled
 */
export default function HydroclimateCard() {
  const theme = useTheme()

  return (
    <Card
      sx={{
        backgroundColor: theme.palette.common.white,
        borderRadius: theme.borderRadius.rounded,
        padding: theme.spacing(theme.cards.spacing.standard),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ mb: 0, fontWeight: 500, fontSize: "1rem" }}
        >
          See hydroclimate effects
        </Typography>

        <FormControl component="fieldset" sx={{ mt: "-2px" }}>
          <RadioGroup
            value="historical"
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: theme.spacing(theme.cards.spacing.standard + 1),
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
    </Card>
  )
}
