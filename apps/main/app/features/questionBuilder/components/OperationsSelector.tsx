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

import React from "react"
import { Typography, Box, useTheme, TextField, SearchIcon } from "@repo/ui/mui"
import { Card } from "@repo/ui"
import { OPERATION_THEMES } from "../data/constants"
import SectionAccordion from "./SectionAccordion"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { HighlightText } from "./ui"

const OperationsSelector: React.FC = () => {
  const theme = useTheme()
  const {
    state: { swapped, selectedOperations },
    handleOperationChange,
  } = useQuestionBuilderHelpers()

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

  return (
    <Card>
      <Typography variant="h5">
        {swapped ? (
          <>
            {" "}
            <HighlightText bgcolor={theme.palette.pop.main}>
              operations
            </HighlightText>
            &nbsp;could we consider?
          </>
        ) : (
          <>
            How do changes in{" "}
            <HighlightText bgcolor={theme.palette.pop.main}>
              operations
            </HighlightText>
          </>
        )}
      </Typography>

      {/* Operation categories */}
      <Box sx={{ mt: 3 }}>
        {OPERATION_THEMES.map((theme) => (
          <SectionAccordion
            key={theme.id}
            title={theme.title}
            options={theme.options}
            selectedOptions={selectedOperations}
            onOptionChange={(option, checked) =>
              handleOperationChange(option, checked)
            }
            noParentCheckbox={["delta-conveyance"]}
          />
        ))}

        {/* Search operations section */}
        <Box sx={searchBoxStyles}>
          <SearchIcon sx={searchIconStyles} />
          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
            Search operations
          </Typography>
          <TextField
            size="small"
            placeholder="Type to search..."
            sx={textFieldStyles}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
        </Box>
      </Box>
    </Card>
  )
}

export default React.memo(OperationsSelector)
