"use client"

/**
 * @fileoverview OutcomesSelector component for the question builder
 * @module OutcomesSelector
 * @description This component allows users to select outcomes from a list of predefined options.
 * @param {Object} props - The component props
 * @param {string[]} props.selectedOutcomes - The currently selected outcomes
 * @param {Function} props.onOutcomeChange - The function to call when the outcome selection changes
 * @param {boolean} props.swapped - Whether the outcomes are being swapped
 */

/**
 * OutcomesSelector
 * Uses checkboxes for multi-selection
 * Has different categorization (by type, region, sector, etc.)
 * Includes map functionality for regions
 * Uses blue highlighting for visual distinction
 * Tracks which section each selection belongs to (critical for formatting)
 * Different text formats based on the "swapped" state
 */

import React from "react"
import {
  Typography,
  Box,
  useTheme,
  Paper,
  LocationOnIcon,
  Checkbox,
  FormControlLabel,
} from "@repo/ui/mui"
import { Card } from "@repo/ui"
import { OUTCOME_CATEGORIES } from "../data/constants"
import SectionAccordion from "./SectionAccordion"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { HighlightText } from "./ui"
import { useTranslation } from "@repo/i18n"

const OutcomesSelector: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const {
    state: { swapped, selectedOutcomes, showMap, includeClimate },
    handleOutcomeChange,
    toggleMap,
    toggleClimate,
  } = useQuestionBuilderHelpers()

  // Handle option change with section context
  const handleOutcomeOptionChange = (
    option: string,
    checked: boolean,
    section: string,
    subtype?: boolean,
  ) => {
    handleOutcomeChange(option, checked, section, subtype)
  }

  // Common styles
  const mapToggleStyles = {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    py: 1,
    mt: 2,
    pt: 2,
    borderTop: "1px solid rgba(0,0,0,0.1)",
  }

  const locationIconStyles = {
    fontSize: theme.typography.body1.fontSize,
    mr: 1,
    color: theme.palette.text.primary,
  }

  const mapPlaceholderStyles = {
    height: "300px",
    width: "100%",
    mt: 2,
    bgcolor: "rgba(200, 200, 200, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px dashed rgba(0,0,0,0.2)",
  }

  return (
    <Card>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5">
          {swapped ? (
            <>
              {/* Use JSX directly - the t function can't handle React elements as params */}
              {
                t("questionBuilder.outcomesSelector.swappedTitle").split(
                  "{{waterAvailability}}",
                )[0]
              }
              <HighlightText bgcolor={theme.palette.cool.main}>
                {t("questionBuilder.defaultTerms.waterAvailability")}
              </HighlightText>
              {t("questionBuilder.outcomesSelector.swappedTitle").split(
                "{{waterAvailability}}",
              )[1] || ""}
            </>
          ) : (
            <>
              {" "}
              <HighlightText bgcolor={theme.palette.cool.main}>
                {t("questionBuilder.defaultTerms.waterAvailability")}
              </HighlightText>
              {t("questionBuilder.outcomesSelector.title").split(
                "{{waterAvailability}}",
              )[1] || ""}
            </>
          )}
        </Typography>
      </Box>

      {/* Outcome categories */}
      <Box sx={{ mt: 3 }}>
        {OUTCOME_CATEGORIES.map((category) => (
          <Box key={category.id}>
            <SectionAccordion
              title={category.title}
              titleEs={category.titleEs}
              options={category.options}
              selectedOptions={selectedOutcomes}
              onOptionChange={(
                option: string,
                checked: boolean,
                subtype?: boolean,
              ) =>
                handleOutcomeOptionChange(option, checked, category.id, subtype)
              }
              section={category.id}
              isOperations={false}
              noDirectionControls={category.id === "type" ? ["deliveries"] : []}
              noParentCheckbox={category.id === "type" ? ["deliveries"] : []}
            />

            {/* Add map for region section if hasMap is true */}
            {category.hasMap && category.id === "region" && (
              <Box
                component="div"
                sx={{
                  mt: -1,
                  mb: 2,
                  mx: 2,
                  pt: 0,
                }}
              >
                <Box
                  component="div"
                  sx={mapToggleStyles}
                  onClick={(e) => {
                    e.stopPropagation() // Prevent accordion from toggling
                    toggleMap()
                  }}
                >
                  <LocationOnIcon sx={locationIconStyles} />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "medium",
                      color: theme.palette.text.primary,
                    }}
                  >
                    {t("questionBuilder.outcomesSelector.chooseLocation")}
                  </Typography>
                </Box>

                {/* Map placeholder that appears when showMap is true */}
                {showMap && (
                  <Paper elevation={3} sx={mapPlaceholderStyles}>
                    <Typography variant="body1" color="text.primary">
                      {t("questionBuilder.outcomesSelector.mapPlaceholder")}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Card>
  )
}

export default React.memo(OutcomesSelector)
