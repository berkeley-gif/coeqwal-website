import { useCallback } from "react"
import { useExploreUserWorkflowStore } from "@repo/state"
import { useMap } from "@repo/map"

/**
 * Hook that manages UI state and outcome selection logic
 * Encapsulates interaction patterns for the Scenario Explorer
 */
export function useExploreInteractions() {
  const { flyTo } = useMap()

  // Get UI state and actions
  const {
    explore: {
      showMapView,
      showOnlyChosen,
      showDefinitions,
      selectedOutcomes,
      searchQuery,
      isSearching,
    },
    setMapView,
    setShowOnlyChosen,
    setShowDefinitions,
    setSelectedOutcome,
    setSearchQuery,
  } = useExploreUserWorkflowStore()

  // Find any selected outcome from any strategy
  const anySelectedOutcome = Object.values(selectedOutcomes).find(
    (outcome) => outcome !== null,
  )

  // Handle outcome selection (only one outcome can be selected at a time)
  const handleOutcomeSelect = useCallback(
    (strategyValue: string, outcome: string) => {
      // Check if this outcome is already selected for this strategy
      const isCurrentlySelected = selectedOutcomes[strategyValue] === outcome

      if (isCurrentlySelected) {
        // Deselect if clicking the same outcome
        setSelectedOutcome(strategyValue, null)
      } else {
        // Clear all other selections first
        Object.keys(selectedOutcomes).forEach((key) => {
          if (key !== strategyValue) {
            setSelectedOutcome(key, null)
          }
        })
        // Set the new selection
        setSelectedOutcome(strategyValue, outcome)

        // Fly to the outcome if map view is active
        if (showMapView) {
          flyTo(-121.5, 38.0, 7, 0, 0, { duration: 2000 })
        }
      }
    },
    [showMapView, flyTo, selectedOutcomes, setSelectedOutcome],
  )

  // Handle search submission
  const handleSearchSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      if (searchQuery.trim()) {
        // TODO: Implement actual search functionality
      }
    },
    [searchQuery],
  )

  return {
    // State
    showMapView,
    showOnlyChosen,
    showDefinitions,
    selectedOutcomes,
    anySelectedOutcome,
    searchQuery,
    isSearching,

    // Actions
    setMapView,
    setShowOnlyChosen,
    setShowDefinitions,
    setSearchQuery,
    handleOutcomeSelect,
    handleSearchSubmit,
  }
}
