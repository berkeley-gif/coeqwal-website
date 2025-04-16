"use client"

import { useCallback, useMemo } from "react"
import {
  useQuestionBuilder,
  questionBuilderActions,
} from "../context/QuestionBuilderContext"
import { OPERATION_THEMES } from "../data/constants"
import {
  CANONICAL_OUTCOME_TYPES,
  CANONICAL_REGIONS,
  OUTCOME_CATEGORIES,
} from "../data/constants"
import { useTranslation } from "@repo/i18n"

/**
 * Custom hook that provides helper functions for question builder components
 */
export const useQuestionBuilderHelpers = () => {
  const { state, dispatch } = useQuestionBuilder()
  const { locale } = useTranslation()

  // Climate-related helpers
  const toggleClimate = useCallback(() => {
    dispatch(questionBuilderActions.toggleClimate())
  }, [dispatch])

  const setClimate = useCallback(
    (climate: string) => {
      dispatch(questionBuilderActions.setClimate(climate))
    },
    [dispatch],
  )

  // Operations-related helpers
  const handleOperationChange = useCallback(
    (option: string, checked: boolean) => {
      if (checked) {
        dispatch(questionBuilderActions.selectOperation(option))
        // Set default direction to increase when first selected
        dispatch(
          questionBuilderActions.setOperationDirection(option, "increase"),
        )
      } else {
        dispatch(questionBuilderActions.deselectOperation(option))
      }
    },
    [dispatch],
  )

  // Handle operation direction change
  const handleOperationDirectionChange = useCallback(
    (operation: string, direction: "increase" | "decrease") => {
      dispatch(
        questionBuilderActions.setOperationDirection(operation, direction),
      )
    },
    [dispatch],
  )

  // Define invalid combinations - wrap in useMemo to avoid recreation on every render
  const invalidCombinations = useMemo(
    () => [
      // Storage restrictions
      { type: "storage", region: "Delta" },
      { type: "storage", region: "Southern California" },
      { type: "storage", region: "Coastal regions" },

      // Groundwater restrictions - only allowed in Sacramento Valley and San Joaquin Valley
      { type: "groundwater levels", region: "Delta" },
      { type: "groundwater levels", region: "Southern California" },
      { type: "groundwater levels", region: "Coastal regions" },
    ],
    [],
  )

  // Check if a specific combination is invalid
  const isInvalidCombination = useCallback(
    (section: string, option: string) => {
      const currentTypes = state.outcomesBySection.type || []
      const currentRegions = state.outcomesBySection.region || []

      // If checking a region, see if it conflicts with selected types
      if (section === "region") {
        // Check if any selected type is incompatible with this region
        return currentTypes.some((type) =>
          // Check if this combination is in the invalidCombinations list
          invalidCombinations.some(
            (combo) => combo.type === type && combo.region === option,
          ),
        )
      }

      // If checking a type with region restrictions
      if (section === "type") {
        // If no regions are selected, we're fine
        if (currentRegions.length === 0) return false

        // Check if any of the selected regions make this type invalid
        return currentRegions.some((region) =>
          invalidCombinations.some(
            (combo) => combo.type === option && combo.region === region,
          ),
        )
      }

      return false
    },
    [
      state.outcomesBySection.type,
      state.outcomesBySection.region,
      invalidCombinations,
    ],
  )

  // Get appropriate tooltip message for invalid combinations
  const getInvalidCombinationMessage = useCallback(
    (section: string, option: string) => {
      const currentTypes = state.outcomesBySection.type || []
      const currentRegions = state.outcomesBySection.region || []

      // If checking a region, explain why it's incompatible with selected types
      if (section === "region") {
        // Find the type that makes this region invalid
        const incompatibleType = currentTypes.find((type) =>
          invalidCombinations.some(
            (combo) => combo.type === type && combo.region === option,
          ),
        )

        if (incompatibleType) {
          // Format the type name better
          const typeDisplay =
            incompatibleType === "groundwater levels"
              ? "groundwater level"
              : incompatibleType

          // Get the valid regions for this type (all regions except those in invalidCombinations)
          const validRegions = ["Sacramento Valley", "San Joaquin Valley"]
            .filter(
              (r) =>
                !invalidCombinations.some(
                  (combo) =>
                    combo.type === incompatibleType && combo.region === r,
                ),
            )
            .join(" and ")

          return `Cannot select "${option}" with ${typeDisplay} outcomes. ${typeDisplay.charAt(0).toUpperCase() + typeDisplay.slice(1)} outcomes are only available in ${validRegions}.`
        }
      }

      // If checking a type with region restrictions
      if (section === "type") {
        // Find invalid regions
        const invalidRegions = currentRegions.filter((region) =>
          invalidCombinations.some(
            (combo) => combo.type === option && combo.region === region,
          ),
        )

        if (invalidRegions.length > 0) {
          const regionList = invalidRegions.join(", ")
          const typeDisplay =
            option === "groundwater levels" ? "groundwater level" : option

          // Get the valid regions for this type (all regions except those in invalidCombinations)
          const validRegions = ["Sacramento Valley", "San Joaquin Valley"]
            .filter(
              (r) =>
                !invalidCombinations.some(
                  (combo) => combo.type === option && combo.region === r,
                ),
            )
            .join(" and ")

          return `Cannot select "${typeDisplay}" with the currently selected region(s): ${regionList}. ${typeDisplay.charAt(0).toUpperCase() + typeDisplay.slice(1)} outcomes are only available in ${validRegions}.`
        }
      }

      return ""
    },
    [
      state.outcomesBySection.type,
      state.outcomesBySection.region,
      invalidCombinations,
    ],
  )

  // Outcomes-related helpers
  const handleOutcomeChange = useCallback(
    (option: string, checked: boolean, section: string, subtype?: boolean) => {
      // Check if this selection would create an invalid combination
      if (checked && isInvalidCombination(section, option)) {
        // Don't allow this selection - return early
        return
      }

      // Special handling for "All regions" selection
      if (section === "region" && option === "All regions") {
        // First deselect all other regions by getting the current selections
        const currentRegions = state.outcomesBySection.region || []

        // Deselect each region that isn't "All regions"
        currentRegions.forEach((regionOption) => {
          if (regionOption !== "All regions") {
            dispatch(
              questionBuilderActions.deselectOutcome(regionOption, "region"),
            )
          }
        })

        // Then select "All regions"
        dispatch(questionBuilderActions.selectOutcome(option, section))
      }
      // If another region is selected, deselect "All regions" if it's currently selected
      else if (section === "region" && option !== "All regions" && checked) {
        const currentRegions = state.outcomesBySection.region || []
        const hasAllRegions = currentRegions.includes("All regions")

        if (hasAllRegions) {
          dispatch(
            questionBuilderActions.deselectOutcome("All regions", "region"),
          )
        }

        // Then select the region
        dispatch(questionBuilderActions.selectOutcome(option, section))
      }
      // Special handling for delivery subtypes
      else if (
        section === "type" &&
        subtype &&
        option.endsWith("-deliveries")
      ) {
        // When a delivery subtype is selected, we need to:
        // 1. Track the subtype ID for reference
        // 2. Ensure the parent "deliveries" is not showing (to avoid redundancy)

        // Check if the parent "deliveries" option is selected
        const hasParentDelivery = state.selectedOutcomes.includes("deliveries")

        if (checked && hasParentDelivery) {
          // If selecting a subtype and the parent is already selected,
          // deselect the parent to avoid both showing at once
          dispatch(questionBuilderActions.deselectOutcome("deliveries", "type"))
        }

        // Now handle the subtype selection
        if (checked) {
          dispatch(questionBuilderActions.selectOutcome(option, section))
        } else {
          dispatch(questionBuilderActions.deselectOutcome(option, section))
        }
      }
      // Normal selection/deselection
      else {
        if (checked) {
          // If selecting the parent "deliveries", deselect any existing subtypes
          if (section === "type" && option === "deliveries") {
            const currentTypes = state.selectedOutcomes || []

            // Find and deselect any delivery subtypes
            currentTypes.forEach((type) => {
              if (type.endsWith("-deliveries")) {
                dispatch(questionBuilderActions.deselectOutcome(type, "type"))
              }
            })
          }

          dispatch(questionBuilderActions.selectOutcome(option, section))
        } else {
          dispatch(questionBuilderActions.deselectOutcome(option, section))
        }
      }
    },
    [
      dispatch,
      state.outcomesBySection,
      state.selectedOutcomes,
      isInvalidCombination,
    ],
  )

  // UI state helpers
  const toggleSwap = useCallback(() => {
    dispatch(questionBuilderActions.toggleSwap())
  }, [dispatch])

  const toggleMap = useCallback(() => {
    dispatch(questionBuilderActions.toggleMap())
  }, [dispatch])

  // Format utilities
  const formatOperationText = useCallback((text: string) => {
    // First, check if we should use Spanish
    const useSpanish = locale === 'es';
    
    // Find the operation in OPERATION_THEMES to get its label/labelEs
    let translatedText = text;
    
    // Look through all themes and options
    for (const theme of OPERATION_THEMES) {
      for (const option of theme.options) {
        // Skip string options (legacy)
        if (typeof option === 'string') continue;
        
        // Check if this is the operation we're looking for
        if (option.id === text) {
          // Use the Spanish label if available and Spanish is selected
          translatedText = useSpanish && option.labelEs ? option.labelEs : option.label;
          break;
        }
        
        // Check subtypes if they exist
        if ('subtypes' in option && Array.isArray(option.subtypes)) {
          const subtype = option.subtypes.find((sub: {id: string, labelEs?: string, label: string}) => sub.id === text);
          if (subtype) {
            translatedText = useSpanish && subtype.labelEs ? subtype.labelEs : subtype.label;
            break;
          }
        }
      }
    }
    
    // Special formatting for parent options with IDs (fallback if not found above)
    const specialCases: Record<string, string> = {
      "removing-flow-reqs": useSpanish ? "eliminar requisitos de flujo de afluentes" : "removing tributary flow requirements",
      "delta-conveyance": useSpanish ? "túnel de transporte del Delta" : "Delta conveyance tunnel",
    }

    // Check if the text is a special case
    if (text in specialCases) {
      return specialCases[text]
    }

    // List of prefixes that indicate proper nouns that should keep capitalization
    const properNounPrefixes = [
      "Alt ", "California", "Sacramento", "San Joaquin", "Central Valley",
      "Bay Area", "Project", "CVP", "SWP", "Delta", "SGMA", "TUCPs",
      // Spanish additions
      "Valle de Sacramento", "Valle de San Joaquín", "Valle Central", 
      "Alternativa ", "Bahía", "Proyecto", "Túnel"
    ]

    // Keep original case for proper nouns
    for (const prefix of properNounPrefixes) {
      if (translatedText.startsWith(prefix)) {
        return translatedText
      }
    }

    // Otherwise, make first letter lowercase
    return translatedText.charAt(0).toLowerCase() + translatedText.slice(1)
  }, [locale])

  // Get operation's short text
  const getOperationShortText = useCallback(
    (operationId: string) => {
      // Use Spanish if that's the current locale
      const useSpanish = locale === 'es';
      
      // Find the operation in OPERATION_THEMES
      for (const theme of OPERATION_THEMES) {
        for (const option of theme.options) {
          // Check if this is the main option we're looking for
          if (option.id === operationId) {
            // Return shortText or shortTextEs based on locale
            if (useSpanish && option.shortTextEs) {
              return option.shortTextEs;
            }
            return option.shortText || formatOperationText(operationId);
          }

          // Check if it's a subtype
          if ("subtypes" in option && option.subtypes) {
            for (const subtype of option.subtypes) {
              if (subtype.id === operationId) {
                // Return Spanish short text if available and Spanish is selected
                if (useSpanish && subtype.shortTextEs) {
                  return subtype.shortTextEs;
                }
                return subtype.shortText || formatOperationText(operationId);
              }
            }
          }
        }
      }

      // Fallback to formatOperationText if no shortText is found
      return formatOperationText(operationId)
    },
    [formatOperationText, locale],
  )

  // Get operation's grammatical number (singular/plural)
  const isOperationSingular = useCallback((operationId: string) => {
    // Find the operation in OPERATION_THEMES
    for (const theme of OPERATION_THEMES) {
      for (const option of theme.options) {
        // Check if this is the main option we're looking for
        if (option.id === operationId) {
          // Return isSingular if defined, default to true
          return "isSingular" in option ? option.isSingular : true
        }

        // Check if it's a subtype
        if ("subtypes" in option && option.subtypes) {
          for (const subtype of option.subtypes) {
            if (subtype.id === operationId) {
              // Subtypes default to the parent's isSingular if defined
              return "isSingular" in subtype
                ? subtype.isSingular
                : "isSingular" in option
                  ? option.isSingular
                  : true
            }
          }
        }
      }
    }

    // Default to true (singular) if not found
    return true
  }, [])

  // Helper to determine if we should use "do" or "does" based on selected operations
  const shouldUseDo = useCallback(() => {
    // Special case for Delta conveyance with any number of subtypes - always use "does"
    const onlyDeltaConveyance =
      state.selectedOperations.every(
        (op) => op === "delta-conveyance" || op.startsWith("dct-"),
      ) && state.selectedOperations.some((op) => op.startsWith("dct-"))

    if (onlyDeltaConveyance) return false // Use "does"

    // When no operations are selected, we show "decisions" which is plural,
    // so we should use "do"
    if (state.selectedOperations.length === 0) {
      return true // Use "do" for the default "decisions" text
    }

    // If only one operation, check if it's singular or plural
    if (state.selectedOperations.length === 1 && state.selectedOperations[0]) {
      return !isOperationSingular(state.selectedOperations[0])
    }

    // Multiple operations always use "do"
    return state.selectedOperations.length > 1
  }, [state.selectedOperations, isOperationSingular])

  const formatOutcomeText = useCallback((text: string, section: string) => {
    // First, look up the proper label from the constants based on current locale
    let formattedText = text
    
    // Use the proper translation based on locale
    const useSpanish = locale === 'es'
    
    // Check if this is an ID that needs to be mapped to a label
    if (section === "type") {
      // Look in CANONICAL_OUTCOME_TYPES for matching ID
      const matchingType = CANONICAL_OUTCOME_TYPES.find(type => type.id === text)
      if (matchingType) {
        // Use Spanish label if available and Spanish is selected
        formattedText = useSpanish && matchingType.labelEs 
          ? matchingType.labelEs 
          : matchingType.label
      }
    } else if (section === "region") {
      // Look in CANONICAL_REGIONS for matching ID
      const matchingRegion = CANONICAL_REGIONS.find(region => region.id === text)
      if (matchingRegion) {
        formattedText = useSpanish && matchingRegion.labelEs
          ? matchingRegion.labelEs
          : matchingRegion.label
      }
    } else if (section === "metric") {
      // Look in OUTCOME_CATEGORIES for the metric section
      const metricCategory = OUTCOME_CATEGORIES.find(cat => cat.id === "metric")
      if (metricCategory) {
        const matchingMetric = metricCategory.options.find(option => 
          typeof option === 'object' && option.id === text
        )
        if (matchingMetric && typeof matchingMetric === 'object') {
          formattedText = useSpanish && matchingMetric.labelEs
            ? matchingMetric.labelEs
            : matchingMetric.label
        }
      }
    }

    // Special case for "The Delta" - format as "the Delta"
    if (formattedText === "The Delta") {
      formattedText = "the Delta"
    }
    // Spanish equivalent
    else if (formattedText === "El Delta") {
      formattedText = "el Delta"
    }

    // Special case for "All regions" - format as "all regions"
    else if (formattedText === "All regions") {
      formattedText = "all regions"
    }
    // Spanish equivalent
    else if (formattedText === "Todas las regiones") {
      formattedText = "todas las regiones"
    }

    // Apply section-specific formatting rules
    switch (section) {
      case "region": {
        // Add "in" prefix for region selections (or "en" for Spanish)
        formattedText = useSpanish 
          ? `en ${formattedText}`
          : `in ${formattedText}`

        // List of prefixes that indicate proper nouns that should keep capitalization
        const properNounPrefixes = [
          "California", "Delta", "Sacramento", "San Joaquin", "Central Valley",
          "Bay Area", "Northern", "Southern", "Eastern", "Western",
          // Spanish equivalents
          "Valle de Sacramento", "Valle de San Joaquín", "Valle Central",
          "Norte", "Sur", "Este", "Oeste", "Área de la Bahía"
        ]

        // Keep capitalization for proper nouns in regions
        const regionStart = useSpanish ? "en " : "in "
        if (
          !properNounPrefixes.some((prefix) => formattedText.startsWith(`${regionStart}${prefix}`)) &&
          formattedText !== (useSpanish ? "en el Delta" : "in the Delta") &&
          formattedText !== (useSpanish ? "en todas las regiones" : "in all regions")
        ) {
          formattedText =
            formattedText.charAt(0).toLowerCase() + formattedText.slice(1)
        }
        break
      }

      case "type": {
        // For type outcomes, just make sure first letter is lowercase unless proper noun
        const properNouns = [
          "California", "Delta", "Sacramento", "San Joaquin",
          // Spanish additions
          "El Delta", "Valle de Sacramento", "Valle de San Joaquín"
        ]
        
        if (!properNouns.some((prefix) => formattedText.startsWith(prefix))) {
          formattedText =
            formattedText.charAt(0).toLowerCase() + formattedText.slice(1)
        }
        break
      }

      case "metric": {
        // Similar to type
        const properNouns = [
          "California", "Delta", "Sacramento", "San Joaquin",
          // Spanish additions
          "El Delta", "Valle de Sacramento", "Valle de San Joaquín"
        ]
        
        if (!properNouns.some((prefix) => formattedText.startsWith(prefix))) {
          formattedText =
            formattedText.charAt(0).toLowerCase() + formattedText.slice(1)
        }
        break
      }
    }

    return formattedText
  }, [locale])

  return {
    state,
    // Action helpers
    toggleClimate,
    setClimate,
    handleOperationChange,
    handleOperationDirectionChange,
    handleOutcomeChange,
    toggleSwap,
    toggleMap,
    // Validation helpers
    isInvalidCombination,
    getInvalidCombinationMessage,
    // Formatting utilities
    formatOperationText,
    getOperationShortText,
    isOperationSingular,
    shouldUseDo,
    formatOutcomeText,
  }
}
