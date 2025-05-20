"use client"

import { useCallback, useMemo } from "react"
import {
  useQuestionBuilder,
  questionBuilderActions,
} from "../context/QuestionBuilderContext"
import { OPERATION_CARD_DEFINITIONS } from "../components/OperationsSelector"
import {
  CANONICAL_OUTCOME_TYPES,
  CANONICAL_REGIONS,
  OUTCOME_CATEGORIES,
  OPERATION_THEMES,
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

  const selectClimate = useCallback(
    (climate: string) => {
      dispatch(questionBuilderActions.selectClimate(climate))
    },
    [dispatch],
  )

  const deselectClimate = useCallback(
    (climate: string) => {
      dispatch(questionBuilderActions.deselectClimate(climate))
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

  const setExploratoryMode = useCallback(
    (isExploratoryMode: boolean) => {
      dispatch(questionBuilderActions.setExploratoryMode(isExploratoryMode))
    },
    [dispatch],
  )

  // Reset all selections
  const resetSelections = useCallback(() => {
    dispatch(questionBuilderActions.reset())
  }, [dispatch])

  // Reset only operations
  const resetOperations = useCallback(() => {
    // Clear all selected operations
    state.selectedOperations.forEach((operation) => {
      dispatch(questionBuilderActions.deselectOperation(operation))
    })
  }, [dispatch, state.selectedOperations])

  // Reset only outcomes
  const resetOutcomes = useCallback(() => {
    // Clear all selected outcomes by section
    Object.entries(state.outcomesBySection).forEach(([section, options]) => {
      options.forEach((option) => {
        dispatch(questionBuilderActions.deselectOutcome(option, section))
      })
    })
  }, [dispatch, state.outcomesBySection])

  // Format utilities
  const formatOperationText = useCallback(
    (text: string) => {
      // First, check if we should use Spanish
      const useSpanish = locale === "es"
      
      // Get all operation cards for term lookup
      const operationCards = OPERATION_CARD_DEFINITIONS
      
      // Check if we're in swapped mode
      const isSwapped = state.swapped
      
      // Helper function to find term for an operation ID based on swapped state
      const getTermForOperation = (opId: string): string => {
        // First check in main operation cards
        for (const card of operationCards) {
          if (card.id === opId) {
            // If in swapped mode, use switchedTerm if available
            if (isSwapped && card.switchedTerm) {
              return card.switchedTerm
            }
            // Otherwise fall back to regular term or ID
            if (card.term) {
              return card.term
            }
            return opId
          }
          
          // Check in sub-options if they exist
          if (card.subOptions) {
            for (const subOption of card.subOptions) {
              if (subOption.id === opId) {
                // If in swapped mode, use switchedTerm if available
                if (isSwapped && subOption.switchedTerm) {
                  return subOption.switchedTerm
                }
                // Otherwise fall back to regular term or ID
                if (subOption.term) {
                  return subOption.term
                }
                return opId
              }
            }
          }
        }
        
        // Fallback: special formatting for certain IDs
        const specialCases: Record<string, string> = {
          "removing-flow-reqs": useSpanish
            ? "eliminar requisitos de flujo de afluentes"
            : "removing tributary flow requirements",
          "delta-conveyance": useSpanish
            ? "túnel de transporte del Delta"
            : "Delta conveyance tunnel",
        }
        
        // Check if the text is a special case
        if (text in specialCases) {
          return specialCases[text]
        }
        
        return opId // Final fallback
      }
      
      // Get the appropriate term for this operation based on swapped state
      let translatedText = getTermForOperation(text)
      
      // List of prefixes that indicate proper nouns that should keep capitalization
      const properNounPrefixes = [
        "Alt ",
        "California",
        "Sacramento",
        "San Joaquin",
        "Central Valley",
        "Bay Area",
        "Project",
        "CVP",
        "SWP",
        "Delta",
        "SGMA",
        "TUCPs",
        // Spanish additions
        "Valle de Sacramento",
        "Valle de San Joaquín",
        "Valle Central",
        "Alternativa ",
        "Bahía",
        "Proyecto",
        "Túnel",
      ]
      
      // Keep original case for proper nouns
      for (const prefix of properNounPrefixes) {
        if (translatedText.startsWith(prefix)) {
          return translatedText
        }
      }
      
      // Otherwise, make first letter lowercase
      return translatedText.charAt(0).toLowerCase() + translatedText.slice(1)
    },
    [locale, state.swapped]
  )

  // Get operation's short text
  const getOperationShortText = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (operationId: string, direction?: string) => {
      // direction parameter is kept for compatibility with call sites but not used
      // Use Spanish if that's the current locale
      const useSpanish = locale === "es"

      // Find the operation in OPERATION_THEMES
      for (const theme of OPERATION_THEMES) {
        for (const option of theme.options) {
          // Check if this is the main option we're looking for
          if (option.id === operationId) {
            // Return shortText or shortTextEs based on locale
            if (useSpanish && option.shortTextEs) {
              return option.shortTextEs
            }
            return option.shortText || formatOperationText(operationId)
          }

          // Check if it's a subtype
          if ("subtypes" in option && Array.isArray(option.subtypes)) {
            for (const subtype of option.subtypes) {
              if (subtype.id === operationId) {
                // Return Spanish short text if available and Spanish is selected
                if (useSpanish && subtype.shortTextEs) {
                  return subtype.shortTextEs
                }
                return subtype.shortText || formatOperationText(operationId)
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
    // Look in main cards
    for (const card of OPERATION_CARD_DEFINITIONS) {
      if (card.id === operationId) {
        return card.isSingular !== undefined ? card.isSingular : true
      }

      // Check in sub-options
      if (card.subOptions) {
        for (const subOption of card.subOptions) {
          if (subOption.id === operationId) {
            return subOption.isSingular !== undefined
              ? subOption.isSingular
              : true
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

  const formatOutcomeText = useCallback(
    (text: string, section: string) => {
      // First, look up the proper label from the constants based on current locale
      let formattedText = text

      // Use the proper translation based on locale
      const useSpanish = locale === "es"

      // Check if this is an ID that needs to be mapped to a label
      if (section === "type") {
        // First look in OUTCOME_CATEGORIES for the "type" section
        const typeCategory = OUTCOME_CATEGORIES.find((cat) => cat.id === "type")
        if (typeCategory) {
          // Type assertion for the option
          type OutcomeOption = {
            id: string
            label: string
            labelEs?: string
            shortText?: string
            shortTextEs?: string
          }

          const matchingOption = typeCategory.options.find(
            (option) => typeof option === "object" && option.id === text,
          ) as OutcomeOption | undefined

          if (matchingOption) {
            // Use short text if available, otherwise use label
            if (useSpanish) {
              formattedText =
                matchingOption.shortTextEs ||
                matchingOption.labelEs ||
                matchingOption.label
            } else {
              formattedText = matchingOption.shortText || matchingOption.label
            }
          } else {
            // Fall back to CANONICAL_OUTCOME_TYPES for compatibility with older data
            const matchingType = CANONICAL_OUTCOME_TYPES.find(
              (type) => type.id === text,
            )
            if (matchingType) {
              formattedText =
                useSpanish && matchingType.labelEs
                  ? matchingType.labelEs
                  : matchingType.label
            }
          }
        }
      } else if (section === "region") {
        // Look in CANONICAL_REGIONS for matching ID
        const matchingRegion = CANONICAL_REGIONS.find(
          (region) => region.id === text,
        )
        if (matchingRegion) {
          formattedText =
            useSpanish && matchingRegion.labelEs
              ? matchingRegion.labelEs
              : matchingRegion.label
        }
      } else if (section === "metric") {
        // Look in OUTCOME_CATEGORIES for the metric section
        const metricCategory = OUTCOME_CATEGORIES.find(
          (cat) => cat.id === "metric",
        )
        if (metricCategory) {
          const matchingMetric = metricCategory?.options.find(
            (option) => typeof option === "object" && option.id === text,
          )
          if (matchingMetric && typeof matchingMetric === "object") {
            formattedText =
              useSpanish && matchingMetric.labelEs
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
            "California",
            "Delta",
            "Sacramento",
            "San Joaquin",
            "Central Valley",
            "Bay Area",
            "Northern",
            "Southern",
            "Eastern",
            "Western",
            // Spanish equivalents
            "Valle de Sacramento",
            "Valle de San Joaquín",
            "Valle Central",
            "Norte",
            "Sur",
            "Este",
            "Oeste",
            "Área de la Bahía",
          ]

          // Keep capitalization for proper nouns in regions
          const regionStart = useSpanish ? "en " : "in "
          if (
            !properNounPrefixes.some((prefix) =>
              formattedText.startsWith(`${regionStart}${prefix}`),
            ) &&
            formattedText !== (useSpanish ? "en el Delta" : "in the Delta") &&
            formattedText !==
              (useSpanish ? "en todas las regiones" : "in all regions")
          ) {
            formattedText =
              formattedText.charAt(0).toLowerCase() + formattedText.slice(1)
          }
          break
        }

        case "type": {
          // For type outcomes, just make sure first letter is lowercase unless proper noun
          const properNouns = [
            "California",
            "Delta",
            "Sacramento",
            "San Joaquin",
            // Spanish additions
            "El Delta",
            "Valle de Sacramento",
            "Valle de San Joaquín",
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
            "California",
            "Delta",
            "Sacramento",
            "San Joaquin",
            // Spanish additions
            "El Delta",
            "Valle de Sacramento",
            "Valle de San Joaquín",
          ]

          if (!properNouns.some((prefix) => formattedText.startsWith(prefix))) {
            formattedText =
              formattedText.charAt(0).toLowerCase() + formattedText.slice(1)
          }
          break
        }
      }

      return formattedText
    },
    [locale],
  )

  return {
    state,
    // Action helpers
    toggleClimate,
    setClimate,
    selectClimate,
    deselectClimate,
    handleOperationChange,
    handleOperationDirectionChange,
    handleOutcomeChange,
    toggleSwap,
    toggleMap,
    setExploratoryMode,
    resetSelections,
    resetOperations,
    resetOutcomes,
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
