"use client"

/**
 * @fileoverview OperationsSelector component for the question builder
 * @module OperationsSelector
 * @description This component allows users to select operations from a list of predefined options.
 * @param {Object} props - The component props
 * @param {string[]} props.selectedOperations - The currently selected operations
 * @param {Function} props.onOperationChange - The function to call when the operation selection changes
 * @param {boolean} props.swapped - Whether the operations are being swapped
 */

/**
 * OperationsSelector
 * Uses checkboxes for multi-selection
 * Organizes options into themed categories using accordions
 * Includes a search feature for operations
 * Uses orange highlighting for visual distinction
 * Different text formats based on the "swapped" state
 * Data model is more complex (nested themes with options)
 */

import React, { useState } from "react"
import { Typography, Box, useTheme, TextField, SearchIcon } from "@repo/ui/mui"
import { Card } from "@repo/ui"
import { OPERATION_THEMES } from "../data/constants"
import SectionAccordion from "./SectionAccordion"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { HighlightText } from "./ui"
import { useTranslation } from "@repo/i18n"

const OperationsSelector: React.FC = () => {
  const theme = useTheme()
  const { t, locale } = useTranslation()
  const {
    state: { swapped, selectedOperations },
    handleOperationChange,
  } = useQuestionBuilderHelpers()

  const [searchTerm, setSearchTerm] = useState("")

  // Common styles
  const searchBoxStyles = {
    mb: 1,
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: `${theme.borderRadius.card}px`,
    overflow: "hidden",
    backgroundColor: theme.palette.common.white,
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
    gap: 1,
    width: "100%",
  }

  const searchIconStyles = {
    fontSize: theme.typography.body1.fontSize,
  }

  const textFieldStyles = {
    ml: 2,
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.borderRadius.pill,
      height: "40px",
      fontSize: theme.typography.caption.fontSize,
    },
    "& .MuiOutlinedInput-input": {
      padding: theme.spacing(1, 2),
    },
    width: "300px",
  }

  // Handle option change while respecting active status
  const handleOptionChangeWithActiveCheck = (
    optionId: string,
    checked: boolean,
  ) => {
    // Find the option in all themes
    for (const theme of OPERATION_THEMES) {
      // Check main options
      for (const option of theme.options) {
        if (typeof option === "string" && option === optionId) {
          // Legacy string options are always active
          handleOperationChange(optionId, checked)
          return
        } else if (typeof option === "object") {
          // Check if this is the option we're looking for
          if (option.id === optionId) {
            // Only allow changes for active options
            if (option.active) {
              handleOperationChange(optionId, checked)
            }
            return
          }

          // Check subtypes if they exist
          if ("subtypes" in option && option.subtypes) {
            const subtype = option.subtypes.find(
              (sub: { id: string }) => sub.id === optionId,
            )
            if (subtype) {
              // Only allow changes for active options and subtypes
              if (option.active && subtype.active) {
                handleOperationChange(optionId, checked)
              }
              return
            }
          }
        }
      }
    }

    // If we get here, we didn't find the option - fall back to default handler
    handleOperationChange(optionId, checked)
  }

  return (
    <Card>
      <Typography variant="h5">
        {swapped ? (
          <>
            {" "}
            {locale === "es" ? "¿qué " : "which "}
            <HighlightText bgcolor={theme.palette.pop.main}>
              {t("questionBuilder.defaultTerms.decisions")}
            </HighlightText>
            &nbsp;{t("questionBuilder.operationsSelector.swappedTitle")}
          </>
        ) : (
          <>
            {/* Parse the title string and replace the decisions placeholder with the highlighted component */}
            {t("questionBuilder.operationsSelector.title")
              .split("{{decisions}}")
              .map((part, index, array) => (
                <React.Fragment key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <HighlightText bgcolor={theme.palette.pop.main}>
                      {t("questionBuilder.defaultTerms.decisions")}
                    </HighlightText>
                  )}
                </React.Fragment>
              ))}
          </>
        )}
      </Typography>

      {/* Operation categories */}
      <Box sx={{ mt: 3 }}>
        {OPERATION_THEMES.map((theme) => (
          <SectionAccordion
            key={theme.id}
            title={theme.title}
            titleEs={theme.titleEs}
            options={theme.options}
            selectedOptions={selectedOperations}
            onOptionChange={handleOptionChangeWithActiveCheck}
            noParentCheckbox={["delta-conveyance"]}
          />
        ))}

        {/* Search operations section */}
        <Box sx={searchBoxStyles}>
          <SearchIcon sx={searchIconStyles} />
          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
            {t("questionBuilder.operationsSelector.searchOperations")}
          </Typography>
          <TextField
            size="small"
            placeholder={t(
              "questionBuilder.operationsSelector.searchPlaceholder",
            )}
            sx={textFieldStyles}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
        </Box>
      </Box>
    </Card>
  )
}

export default React.memo(OperationsSelector)
