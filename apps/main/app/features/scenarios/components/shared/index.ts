/**
 * Shared scenario/strategy components
 *
 * These components are used by both Learn mode (progressive panels)
 * and Explore mode (strategy grid/list).
 */

// Components
export { OutcomeGlyphItem } from "./OutcomeGlyphItem"
export type { OutcomeGlyphItemProps } from "./OutcomeGlyphItem"

export { OutcomeGrid } from "./OutcomeGrid"
export type { OutcomeGridProps } from "./OutcomeGrid"

export { OperationsIconGroup } from "./OperationsIconGroup"
export type { OperationsIconGroupProps } from "./OperationsIconGroup"

export { StrategyHeader } from "./StrategyHeader"
export type { StrategyHeaderProps } from "./StrategyHeader"

// Utilities
export {
  getStrategyIcons,
  getThemeIcon,
  getThemeIconDescription,
  getIconSize,
  SGMAIcon,
  EnvironmentalIcon,
} from "./strategyIcons"
export type { StrategyIcon, StrategyIconConfig } from "./strategyIcons"

// Types
export type { ChartDataPoint, OutcomeName, Strategy } from "./types"
export { isSingleValueTier } from "./types"




