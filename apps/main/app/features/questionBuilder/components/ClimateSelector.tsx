"use client"

/**
 * @fileoverview ClimateSelector component for the question builder
 * @module ClimateSelector
 * @description This component allows users to select a climate option from a list of predefined options.
 */

/**
 * ClimateSelector
 * Uses radio buttons for single selection (only one climate option can be active)
 * Has a simple flat list without categorization
 * Has styling with green highlight color
 * Simplest data model (just an array of strings)
 */

import React from "react"
import {
  Typography,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  useTheme,
} from "@repo/ui/mui"
import { Card as CardComponent } from "@repo/ui"
import { CLIMATE_OPTIONS } from "../data/constants"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { HighlightText } from "./ui"
import { useTranslation } from "@repo/i18n"

// Define the climate option interface
interface ClimateOption {
  id: string
  label: string
}

const ClimateSelector: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const {
    state: { selectedClimate },
    setClimate,
  } = useQuestionBuilderHelpers()

  const handleClimateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClimate(event.target.value)
  }

  const radioStyles = {
    color: theme.palette.text.primary,
    "&.Mui-checked": {
      color: theme.palette.text.primary,
    },
  }

  const formControlStyles = {
    alignItems: "flex-start",
    "& .MuiRadio-root": {
      padding: theme.spacing(0.5),
      paddingTop: theme.spacing(0.75),
      marginRight: theme.spacing(1),
    },
  }

  return (
    <CardComponent>
      <Typography variant="h5">
        <HighlightText bgcolor={theme.palette.climate.main}>
          {t("questionBuilder.climateSelector.title")}
        </HighlightText>
      </Typography>

      {/* Climate options below the heading */}
      <Box sx={{ mt: 3 }}>
        <RadioGroup
          value={selectedClimate}
          onChange={handleClimateChange}
          name="climate-options"
        >
          {CLIMATE_OPTIONS.map((option: ClimateOption, index) => (
            <Box key={option.id || index} sx={{ mb: 0.5 }}>
              <FormControlLabel
                control={<Radio size="small" sx={radioStyles} />}
                label={
                  <Typography variant="body2">
                    {t(`questionBuilder.climateSelector.options.${option.id}`)}
                  </Typography>
                }
                sx={formControlStyles}
                value={option.id}
              />
            </Box>
          ))}
        </RadioGroup>
      </Box>
    </CardComponent>
  )
}

export default React.memo(ClimateSelector)
