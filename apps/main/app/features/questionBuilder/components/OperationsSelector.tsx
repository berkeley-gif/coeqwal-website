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
    title: "What if we removed any temporary emergency changes (TUCP's)?",
    bullet: { color: "#2196F3", size: 24 }, // Blue
    subOptions: [
      {
        id: "select-tucps",
        label: "Select",
      },
    ],
  },
  {
    id: "limit-groundwater",
    title: "What if we limited groundwater pumping?",
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
  {
    id: "change-stream-flows",
    title: "What if we changed how water flows in our streams?",
    bullet: { color: "#9C27B0", size: 24 }, // Purple
    subOptions: [
      {
        id: "no-environmental-flows",
        label: "...with no environmental flow requirements",
      },
      {
        id: "functional-flows-balance",
        label:
          "...with functional flows to balance water needs with ecosystem support",
      },
      {
        id: "functional-flows-reduced",
        label:
          "...with functional flows, reduced groundwater pumping, and reduced agricultural deliveries",
      },
      {
        id: "enhanced-functional-flows-salmon",
        label: "...with enhanced functional flows to support salmon",
      },
      {
        id: "enhanced-functional-flows-salmon-reduced",
        label:
          "...with enhanced functional flows to support salmon, reduced groundwater pumping, and reduced agricultural deliveries",
      },
    ],
  },
  {
    id: "prioritize-drinking-water",
    title: "What if we prioritized drinking water?",
    bullet: { color: "#00BCD4", size: 24 }, // Cyan
    subOptions: [
      {
        id: "adjust-urban-demand",
        label: "...by adjusting urban demand patterns",
      },
      {
        id: "prioritize-impacted-communities",
        label:
          "...by prioritizing drinking water for the most impacted communities",
      },
      {
        id: "prioritize-underserved-communities",
        label:
          "...by prioritizing drinking water for all historically-underserved communities",
      },
      {
        id: "prioritize-all-communities",
        label: "...for all communities across the system",
      },
    ],
  },
  {
    id: "balance-delta-uses",
    title: "What if we balanced water uses in the Delta?",
    bullet: { color: "#607D8B", size: 24 }, // Blue Grey
    subOptions: [
      {
        id: "delta-outflows-tier1",
        label: "...by increasing Delta outflows, tier 1",
      },
      {
        id: "delta-outflows-tier2",
        label: "...by increasing Delta outflows, tier 2",
      },
      {
        id: "delta-outflows-tier3",
        label: "...by increasing Delta outflows, tier 3",
      },
      {
        id: "reduce-sacramento-valley-deliveries",
        label: "...by reducing Sacramento Valley deliveries",
      },
      {
        id: "more-carryover-storage-shasta",
        label: "...by requiring more carryover storage in Shasta Reservoir",
      },
      {
        id: "less-carryover-storage-shasta",
        label: "...by allowing less carryover storage in Shasta Reservoir",
      },
      {
        id: "reduce-delta-exports-tier1",
        label: "...by reducing Delta exports, tier 1",
      },
      {
        id: "reduce-delta-exports-tier2",
        label: "...by reducing Delta exports, tier 2",
      },
      {
        id: "reduce-delta-exports-tier3",
        label: "...by reducing Delta exports, tier 3",
      },
    ],
  },
  {
    id: "new-infrastructure",
    title: "What if we added new water infrastructure?",
    bullet: { color: "#FF5722", size: 24 }, // Deep Orange
    subOptions: [
      {
        id: "delta-conveyance-tunnel",
        label: "...Delta conveyance tunnel",
      },
      {
        id: "delta-conveyance-reduced-groundwater",
        label:
          "...Delta conveyance tunnel with reduced groundwater pumping and deliveries",
      },
      {
        id: "delta-conveyance-functional-flows",
        label: "...Delta conveyance with functional flows",
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
          variant="text"
          size="medium"
          onClick={handleResetWithExitMode}
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
