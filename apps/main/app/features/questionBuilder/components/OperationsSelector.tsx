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

import React, { useState, useMemo } from "react"
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
  
  // Track expanded accordions
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([])
  
  // Determine which accordions should be forced open because they contain selected options
  const forcedOpenAccordions = useMemo(() => {
    const forced: string[] = [];
    
    // Find which theme contains each selected operation
    selectedOperations.forEach(opId => {
      for (const theme of OPERATION_THEMES) {
        // Check if this operation is in this theme
        let isInTheme = false;
        
        for (const option of theme.options) {
          if (typeof option === 'string') {
            if (option === opId) {
              isInTheme = true;
              break;
            }
          } else if (typeof option === 'object') {
            if (option.id === opId) {
              isInTheme = true;
              break;
            }
            
            // Check subtypes if they exist
            if ('subtypes' in option && Array.isArray(option.subtypes)) {
              const hasSubtype = option.subtypes.some((sub: {id: string}) => sub.id === opId);
              if (hasSubtype) {
                isInTheme = true;
                break;
              }
            }
          }
        }
        
        if (isInTheme) {
          forced.push(theme.id);
          break;
        }
      }
    });
    
    return forced;
  }, [selectedOperations]);
  
  // Handle accordion expansion change
  const handleAccordionChange = (themeId: string, isExpanded: boolean) => {
    setExpandedAccordions(prev => {
      // If expanding, add to expanded list
      if (isExpanded) {
        return [...prev, themeId];
      }
      
      // If collapsing, only allow if not in forced open list
      if (!forcedOpenAccordions.includes(themeId)) {
        return prev.filter(id => id !== themeId);
      }
      
      // Otherwise keep as is
      return prev;
    });
  };

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
    // First, check if the option is active before proceeding
    let isActive = false;
    
    // Find the option in all themes to check its active status
    for (const theme of OPERATION_THEMES) {
      for (const option of theme.options) {
        if (typeof option === "string" && option === optionId) {
          // Legacy string options are always active
          isActive = true;
          break;
        } else if (typeof option === "object" && option.id === optionId) {
          isActive = option.active !== false; // Default to true if not specified
          break;
        } else if (typeof option === "object" && "subtypes" in option && option.subtypes) {
          // Check subtypes if they exist
          const subtype = option.subtypes.find(sub => sub.id === optionId);
          if (subtype) {
            isActive = option.active !== false && subtype.active !== false;
            break;
          }
        }
      }
      if (isActive) break; // No need to check other themes if found
    }
    
    // Don't allow changes for inactive options
    if (!isActive) return;
    
    // For radio-like behavior in operations
    if (checked) {
      // Deselect all current selections
      selectedOperations.forEach(operation => {
        handleOperationChange(operation, false);
      });
      
      // Then select only the new option
      handleOperationChange(optionId, true);
    } else {
      // Allow deselection normally
      handleOperationChange(optionId, false);
    }
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
            isOperations={true}
            isExpanded={expandedAccordions.includes(theme.id)}
            onAccordionChange={(isExpanded) => handleAccordionChange(theme.id, isExpanded)}
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
