// Define TabKey type here instead of importing from @repo/ui (creates circular dependency)
export type TabKey = "glossary"

// Additional configuration options for the drawer
export type DrawerSize = "default" | "large" | "full"

// Types for saved scenarios (to avoid circular dependencies)
export interface SavedScenario {
  id: string
  name: string
  description?: string
  scenarios: string[]
  region: string
  savedAt: Date
  tags?: string[]
}

// Callback types for saved scenarios
export interface SavedScenariosCallbacks {
  onLoadScenario?: (scenario: SavedScenario) => void
  onDeleteScenario?: (scenarioId: string) => void
  onEditScenario?: (scenario: SavedScenario) => void
}

// State for the drawer
export interface DrawerState {
  // Current state
  isOpen: boolean
  activeTab: TabKey | null
  drawerWidth: number
  content?: Record<string, unknown>
}
