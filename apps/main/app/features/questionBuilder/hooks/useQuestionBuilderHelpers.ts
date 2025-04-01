"use client"

import { useCallback, useMemo } from "react"
import {
  useQuestionBuilder,
  questionBuilderActions,
} from "../context/QuestionBuilderContext"

/**
 * Custom hook that provides helper functions for question builder components
 */
export const useQuestionBuilderHelpers = () => {
  const { state, dispatch } = useQuestionBuilder()

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
    // Special formatting for parent options with IDs
    const specialCases: Record<string, string> = {
      "removing-flow-reqs": "removing tributary flow requirements",
      "delta-conveyance": "Delta conveyance tunnel",
    }

    // Check if the text is a special case
    if (text in specialCases) {
      return specialCases[text]
    }

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
    ]

    // Keep original case for proper nouns
    for (const prefix of properNounPrefixes) {
      if (text.startsWith(prefix)) {
        return text
      }
    }

    // Otherwise, make first letter lowercase
    return text.charAt(0).toLowerCase() + text.slice(1)
  }, [])

  const formatOutcomeText = useCallback((text: string, section: string) => {
    let formattedText = text

    // Special case for "The Delta" - format as "the Delta"
    if (text === "The Delta") {
      formattedText = "the Delta"
    }

    // Special case for "All regions" - format as "all regions"
    else if (text === "All regions") {
      formattedText = "all regions"
    }

    // Apply section-specific formatting rules
    switch (section) {
      case "region": {
        // Add "in" prefix for region selections
        formattedText = `in ${formattedText}`

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
        ]

        // Keep capitalization for proper nouns in regions
        if (
          !properNounPrefixes.some((prefix) => text.startsWith(prefix)) &&
          text !== "The Delta" &&
          text !== "All regions"
        ) {
          formattedText =
            formattedText.charAt(0).toLowerCase() + formattedText.slice(1)
        }
        break
      }

      case "type": {
        // For type outcomes, just make sure first letter is lowercase unless proper noun
        if (
          !["California", "Delta", "Sacramento", "San Joaquin"].some((prefix) =>
            text.startsWith(prefix),
          )
        ) {
          formattedText =
            formattedText.charAt(0).toLowerCase() + formattedText.slice(1)
        }
        break
      }

      case "metric": {
        // Similar to type
        if (
          !["California", "Delta", "Sacramento", "San Joaquin"].some((prefix) =>
            text.startsWith(prefix),
          )
        ) {
          formattedText =
            formattedText.charAt(0).toLowerCase() + formattedText.slice(1)
        }
        break
      }
    }

    return formattedText
  }, [])

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
    formatOutcomeText,
  }
}
