import React from "react"
import {
  useTheme,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@repo/ui/mui"
import { Card, SectionHeader } from "@repo/ui"
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
      <SectionHeader 
        variant="subtitle1"
        sx={{ display: "block" }}
      >
        See how outcomes change with a different hydroclimate
      </SectionHeader>

      <FormControl component="fieldset">
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
                    "&.Mui-checked": {
                      backgroundColor: theme.palette.blue.bright,
                      borderColor: theme.palette.blue.bright,
                    },
                    "&:hover": {
                      backgroundColor: theme.palette.blue.bright,
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "transparent",
                      borderColor: theme.palette.grey[400],
                      cursor: "not-allowed",
                    },
                  }}
                />
              }
              label={option.label}
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.95rem",
                  fontWeight: option.value === "historical" ? 500 : 400,
                  color:
                    option.value === "historical"
                      ? theme.palette.text.primary
                      : `${theme.palette.grey[500]} !important`,
                },
                "&.Mui-disabled .MuiFormControlLabel-label": {
                  color: `${theme.palette.grey[500]} !important`,
                },
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Card>
  )
}
