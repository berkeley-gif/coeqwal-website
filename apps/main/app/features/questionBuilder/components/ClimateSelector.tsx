"use client"

/**
 * @fileoverview ClimateSelector component for the question builder
 * @module ClimateSelector
 * @description This component allows users to select a climate option from a list of predefined options.
 */

/**
 * ClimateSelector
 * Uses checkboxes for multiple selection
 * Has a simple flat list without categorization
 * Has styling with green highlight color
 * Supports selecting multiple climate options
 */

import React from "react"
import {
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
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
  labelEs?: string
}

const ClimateSelector: React.FC = () => {
  const theme = useTheme()
  const { t, locale } = useTranslation()
  const {
    state: { selectedClimate, includeClimate },
    toggleClimate,
    selectClimate,
    deselectClimate,
  } = useQuestionBuilderHelpers()

  const handleClimateChange = (id: string, checked: boolean) => {
    if (checked) {
      selectClimate(id)

      // If climate is not included, include it automatically when user selects an option
      if (!includeClimate) {
        toggleClimate()
      }
    } else {
      deselectClimate(id)

      // If no climates are selected, disable climate inclusion
      if (selectedClimate.length === 1 && selectedClimate[0] === id) {
        toggleClimate()
      }
    }
  }

  // Match the styling of the OperationsSelector
  const checkboxStyles = {
    color: "rgba(0, 0, 0, 0.54)",
    "&.Mui-checked": {
      color: theme.palette.climate.main,
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
    padding: theme.spacing(1, 1.5),
    margin: 0,
    width: "100%",
    "& .MuiCheckbox-root": {
      padding: theme.spacing(0.5),
      marginRight: theme.spacing(1),
    },
    borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
    "&:last-child": {
      borderBottom: "none",
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
          {includeClimate
            ? t("questionBuilder.ui.disable")
            : t("questionBuilder.ui.enable")}
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
        {/* Debug info - show how many options we have */}
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 1, color: "text.secondary" }}
        >
          Available options: {CLIMATE_OPTIONS.length}
        </Typography>

        {CLIMATE_OPTIONS.map((option: ClimateOption) => (
          <FormControlLabel
            key={option.id}
            control={
              <Checkbox
                size="small"
                sx={checkboxStyles}
                checked={selectedClimate.includes(option.id)}
                onChange={(e) =>
                  handleClimateChange(option.id, e.target.checked)
                }
                disabled={!includeClimate}
              />
            }
            label={
              <Typography
                variant="body1"
                sx={{
                  color: includeClimate
                    ? "text.primary"
                    : "rgba(0, 0, 0, 0.38)",
                  fontWeight: selectedClimate.includes(option.id) ? 500 : 400,
                  backgroundColor: selectedClimate.includes(option.id)
                    ? "rgba(76, 175, 80, 0.1)"
                    : "transparent",
                  padding: selectedClimate.includes(option.id) ? "2px 8px" : 0,
                  borderRadius: "4px",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Use the direct label instead of trying to translate */}
                {locale === "es" && option.labelEs
                  ? option.labelEs
                  : option.label}
              </Typography>
            }
            sx={formControlStyles}
            disabled={!includeClimate}
          />
        ))}
      </Box>
    </Card>
  )
}

export default React.memo(ClimateSelector)
