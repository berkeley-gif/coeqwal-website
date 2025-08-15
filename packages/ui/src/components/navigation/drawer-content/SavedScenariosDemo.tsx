/**
 * Demo/Example of how to use the SavedScenarios functionality
 * This file shows how to integrate saved scenarios with the MultiDrawer
 */

import React from "react"
import { useDrawerStore } from "@repo/state"
import type { SavedScenario } from "./SavedScenariosContent"

// Example saved scenarios data
const mockSavedScenarios: SavedScenario[] = [
  {
    id: "scenario-1",
    name: "High Water Demand",
    description: "Scenarios exploring increased urban and agricultural water demands",
    scenarios: ["Urban Growth A", "Agricultural Expansion", "Climate Stress"],
    region: "Central Valley",
    savedAt: new Date("2024-01-15"),
    tags: ["high-demand", "urban", "agriculture"],
  },
  {
    id: "scenario-2", 
    name: "Drought Resilience",
    description: "Testing water management under extreme drought conditions",
    scenarios: ["Severe Drought", "Extended Dry Period"],
    region: "Sacramento Valley",
    savedAt: new Date("2024-01-10"),
    tags: ["drought", "resilience"],
  },
  {
    id: "scenario-3",
    name: "Climate Adaptation",
    description: "Evaluating adaptation strategies for changing climate patterns",
    scenarios: ["Warmer Climate", "Variable Precipitation", "Sea Level Rise", "Temperature Extremes"],
    region: "San Joaquin Valley", 
    savedAt: new Date("2024-01-05"),
    tags: ["climate", "adaptation", "long-term"],
  },
]

/**
 * Example hook showing how to integrate saved scenarios with the drawer
 */
export function useSavedScenariosDemo() {
  const { openSavedScenariosPanel } = useDrawerStore()

  // Example handlers for scenario actions
  const handleLoadScenario = (scenario: SavedScenario) => {
    console.log("Loading scenario:", scenario)
    // Here you would typically:
    // 1. Update your map/scenario state
    // 2. Navigate to the scenario comparison view
    // 3. Apply the selected scenarios to your analysis
  }

  const handleDeleteScenario = (scenarioId: string) => {
    console.log("Deleting scenario:", scenarioId)
    // Here you would typically:
    // 1. Remove from your saved scenarios state/database
    // 2. Update the UI to reflect the deletion
    // 3. Show a confirmation or undo option
  }

  const handleEditScenario = (scenario: SavedScenario) => {
    console.log("Editing scenario:", scenario)
    // Here you would typically:
    // 1. Open a scenario edit modal/form
    // 2. Allow user to modify name, description, tags
    // 3. Update your saved scenarios state/database
  }

  // Function to open the saved scenarios drawer with data and callbacks
  const openSavedScenarios = () => {
    openSavedScenariosPanel(mockSavedScenarios, {
      onLoadScenario: handleLoadScenario,
      onDeleteScenario: handleDeleteScenario, 
      onEditScenario: handleEditScenario,
    })
  }

  return {
    openSavedScenarios,
    savedScenarios: mockSavedScenarios,
    // You could also return individual handlers if needed elsewhere
    handleLoadScenario,
    handleDeleteScenario,
    handleEditScenario,
  }
}

/**
 * Example usage in a component:
 * 
 * ```tsx
 * import { useSavedScenariosDemo } from "./SavedScenariosDemo"
 * 
 * function MyComponent() {
 *   const { openSavedScenarios } = useSavedScenariosDemo()
 * 
 *   return (
 *     <Button onClick={openSavedScenarios}>
 *       Open My Scenarios
 *     </Button>
 *   )
 * }
 * ```
 */
