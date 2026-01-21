/**
 * strategyGrid - barrel exports for strategy grid sub-feature
 *
 * Main components:
 * - StrategyGrid: Orchestrates the grid layout with headers and content
 * - StrategyGridHeader: Column headers and outcome category labels
 * - StrategyGridContent: Scenario rows container
 * - StrategyGridRow: Individual scenario row
 * - GridControls: Filter toggles (show chosen, show definitions)
 *
 * Grid layout configuration is in theme.scenarios.grid
 */

// Main component
export { default } from "./StrategyGrid"
export { default as StrategyGrid } from "./StrategyGrid"

// Sub-components
export { StrategyGridHeader } from "./StrategyGridHeader"
export { StrategyGridContent } from "./StrategyGridContent"
export { StrategyGridRow } from "./StrategyGridRow"
export { GridControls } from "./GridControls"

// Types
export type { StrategyGridProps } from "./types"
export type { StrategyGridHeaderProps } from "./StrategyGridHeader"
export type { StrategyGridContentProps } from "./StrategyGridContent"
export type { StrategyGridRowProps } from "./StrategyGridRow"
