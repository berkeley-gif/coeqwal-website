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
 * Organizes options into cards for clarity
 * Includes a search feature for operations
 * Uses colored bullets and capsules for visual distinction
 * Different text formats based on the "swapped" state
 */

import React, { useState, useMemo, useCallback } from "react"
import {
  Typography,
  Box,
  useTheme,
  TextField,
  SearchIcon,
  Button,
} from "@repo/ui/mui"
import { Card, OperationCard, SubOption } from "@repo/ui"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { ColoredText } from "./ui"
import { useTranslation } from "@repo/i18n"

// Card data for the operation cards
const OPERATION_CARDS = [
  {
    id: "current-operations",
    title: "Current operations",
    bullet: { color: "#4CAF50", size: 24 }, // Green
    subOptions: [
      {
        id: "use-as-comparison",
        label: "Use as comparison",
      },
    ],
  },
  {
    id: "remove-tucps",
    title: "What if we removed TUCPs",
    bullet: { color: "#2196F3", size: 24 }, // Blue
    subOptions: [],
  },
  {
    id: "limit-groundwater",
    title: "What if we limited groundwater pumpting",
    bullet: { color: "#FF9800", size: 24 }, // Orange
    subOptions: [
      {
        id: "sjv-only",
        label: "...in the San Joaquin Valley only",
      },
      {
        id: "both-valleys",
        label: "...in both the Sacramento and San Joaquin Valleys",
      },
      {
        id: "sjv-reduced-acreage",
        label: "...in the San Joaquin Valley and reduced agricultural acreage",
      },
      {
        id: "both-valleys-reduced-acreage",
        label:
          "...in both the Sacramento and San Joaquin Valleys with reduced agricultural acreage",
      },
    ],
  },
]

const OperationsSelector: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const {
    state: { swapped, selectedOperations, isExploratoryMode },
    handleOperationChange,
    resetOperations,
    setExploratoryMode,
  } = useQuestionBuilderHelpers()

  const [searchTerm, setSearchTerm] = useState("")

  // Exit exploratory mode when interacting with this component
  const exitExploratoryMode = useCallback(() => {
    if (isExploratoryMode) {
      setExploratoryMode(false)
    }
  }, [isExploratoryMode, setExploratoryMode])

  // Update handlers to exit exploratory mode
  const handleOperationChangeWithExitMode = useCallback(
    (optionId: string, checked: boolean) => {
      exitExploratoryMode()
      handleOperationChange(optionId, checked)
    },
    [exitExploratoryMode, handleOperationChange],
  )

  const handleResetWithExitMode = useCallback(() => {
    exitExploratoryMode()
    resetOperations()
  }, [exitExploratoryMode, resetOperations])

  // Filter operations based on search term
  const filteredOperations = useMemo(() => {
    if (!searchTerm) return OPERATION_CARDS

    const lowercaseSearch = searchTerm.toLowerCase()
    return OPERATION_CARDS.filter(
      (op) =>
        op.title.toLowerCase().includes(lowercaseSearch) ||
        op.subOptions.some((sub) =>
          sub.label.toLowerCase().includes(lowercaseSearch),
        ),
    )
  }, [searchTerm])

  // Prepare the operation cards with selected state
  const operationCardsWithState = useMemo(() => {
    return filteredOperations.map((op) => {
      const mainOptionSelected = selectedOperations.includes(op.id)

      const subOptionsWithState = op.subOptions.map((sub) => ({
        ...sub,
        selected: selectedOperations.includes(sub.id),
      }))

      return {
        ...op,
        selected: mainOptionSelected,
        subOptions: subOptionsWithState,
      }
    })
  }, [filteredOperations, selectedOperations])

  // Handle main option change
  const handleMainOptionChange = (optionId: string, checked: boolean) => {
    handleOperationChangeWithExitMode(optionId, checked)
  }

  // Handle sub-option change
  const handleSubOptionChange = (
    optionId: string,
    subOptionId: string,
    checked: boolean,
  ) => {
    handleOperationChangeWithExitMode(subOptionId, checked)
  }

  // Handle info click
  const handleInfoClick = (optionId: string) => {
    console.log(`Show more info for: ${optionId}`)
    // Implement info modal or expanded view
  }

  // Common styles
  const searchBoxStyles = {
    mb: 3,
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

  return (
    <Card>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Typography variant="h3" sx={{ fontSize: "3rem" }}>
          {swapped ? (
            <>
              <ColoredText color={theme.palette.pop.main}>
                {t("questionBuilder.defaultTerms.decisions_sub")}
              </ColoredText>
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
                      <ColoredText color={theme.palette.pop.main}>
                        {t("questionBuilder.defaultTerms.decisions_sub")}
                      </ColoredText>
                    )}
                  </React.Fragment>
                ))}
            </>
          )}
        </Typography>

        {/* Clear Selection Button */}
        <Button
          variant="contained"
          color="primary"
          size="medium"
          onClick={handleResetWithExitMode}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            minWidth: "150px",
            px: 2,
            py: 0.75,
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "white",
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              border: "1px solid",
            },
            "&:active": {
              backgroundColor: "white",
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              border: "1px solid",
            },
          }}
        >
          {t("questionBuilder.ui.clearSelections")}
        </Button>
      </Box>

      {/* Search operations section */}
      <Box sx={searchBoxStyles}>
        <SearchIcon sx={searchIconStyles} />
        <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
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

      {/* Operation cards */}
      <Box sx={{ mt: 3 }}>
        {operationCardsWithState.map((op) => (
          <OperationCard
            key={op.id}
            title={op.title}
            bullet={op.bullet}
            subOptions={op.subOptions}
            selected={op.selected}
            onMainOptionChange={(checked) =>
              handleMainOptionChange(op.id, checked)
            }
            onSubOptionChange={(subId, checked) =>
              handleSubOptionChange(op.id, subId, checked)
            }
            onInfoClick={() => handleInfoClick(op.id)}
          />
        ))}
      </Box>
    </Card>
  )
}

export default React.memo(OperationsSelector)
