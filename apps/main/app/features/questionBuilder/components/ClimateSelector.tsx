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
  Button,
} from "@repo/ui/mui"
import { Card } from "@repo/ui"
import { CLIMATE_OPTIONS } from "../data/constants"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { ColoredText } from "./ui"
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
    state: { selectedClimate, includeClimate },
    setClimate,
    toggleClimate,
  } = useQuestionBuilderHelpers()

  const handleClimateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClimate(event.target.value)
    
    // If climate is not included, include it automatically when user selects an option
    if (!includeClimate) {
      toggleClimate()
    }
  }

  // Match the styling of the OperationsSelector
  const radioStyles = {
    color: "rgba(0, 0, 0, 0.54)",
    "&.Mui-checked": {
      color: theme.palette.primary.main,
    },
  }

  const formControlStyles = {
    alignItems: "flex-start",
    marginBottom: theme.spacing(1.5),
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
      borderRadius: theme.spacing(1),
    },
    transition: "background-color 0.2s",
    padding: theme.spacing(0.5, 1),
    margin: 0,
    width: "100%",
    "& .MuiRadio-root": {
      padding: theme.spacing(0.5),
      marginRight: theme.spacing(1),
    },
  }

  return (
    <Card
      sx={{
        pt: 0,
        pb: 3,
        px: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            lineHeight: (theme) => theme.cards.typography.hero.lineHeight,
            fontWeight: (theme) => theme.cards.typography.hero.fontWeight,
          }}
        >
          <ColoredText color={theme.palette.climate.main}>
            {t("questionBuilder.climateSelector.title")}
          </ColoredText>
        </Typography>

        {/* Toggle Climate Button - similar to Clear Selection in OperationsSelector */}
        <Button
          variant="text"
          size="medium"
          onClick={toggleClimate}
          sx={{
            textTransform: "none",
            borderRadius: 0,
            minWidth: "150px",
            px: 1,
            py: 0.5,
            fontWeight: 400,
            color: "rgba(0, 0, 0, 0.42)",
            backgroundColor: "transparent",
            border: "none",
            "&:hover": {
              backgroundColor: "transparent",
              color: "rgba(0, 0, 0, 0.6)",
              textDecoration: "underline",
            },
          }}
        >
          {includeClimate ? t("questionBuilder.ui.disable") : t("questionBuilder.ui.enable")}
        </Button>
      </Box>

      {/* Climate options container - styled like the operations container */}
      <Box
        sx={{
          position: "relative",
          border: "1px solid rgba(0, 0, 0, 0.12)",
          borderRadius: "12px",
          p: 2,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          backgroundColor: includeClimate ? "white" : "rgba(0, 0, 0, 0.04)",
          transition: "background-color 0.3s",
        }}
      >
        <RadioGroup
          value={selectedClimate}
          onChange={handleClimateChange}
          name="climate-options"
        >
          {CLIMATE_OPTIONS.map((option: ClimateOption) => (
            <FormControlLabel
              key={option.id}
              control={
                <Radio 
                  size="small" 
                  sx={radioStyles} 
                  disabled={!includeClimate}
                />
              }
              label={
                <Typography 
                  variant="body1"
                  sx={{
                    color: includeClimate ? "inherit" : "rgba(0, 0, 0, 0.38)",
                    fontWeight: selectedClimate === option.id ? 500 : 400,
                  }}
                >
                  {t(`questionBuilder.climateSelector.options.${option.id}`)}
                </Typography>
              }
              sx={formControlStyles}
              value={option.id}
              disabled={!includeClimate}
            />
          ))}
        </RadioGroup>
      </Box>
    </Card>
  )
}

export default React.memo(ClimateSelector)
