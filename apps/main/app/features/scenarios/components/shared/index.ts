/**
 * Shared scenario components
 *
 * These components are used by both Learn mode (progressive panels)
 * and Explore mode (scenario grid/list).
 */

// Components
export { OutcomeGlyphItem, formatOutcomeLabel } from "./OutcomeGlyphItem"
export type { OutcomeGlyphItemProps } from "./OutcomeGlyphItem"

export { OutcomeGrid } from "./OutcomeGrid"
export type { OutcomeGridProps } from "./OutcomeGrid"

export { OperationsIconGroup } from "./OperationsIconGroup"
export type { OperationsIconGroupProps } from "./OperationsIconGroup"

export { StrategyHeader } from "./StrategyHeader"
export type { StrategyHeaderProps } from "./StrategyHeader"

export { SmartSummary } from "./SmartSummary"
export type { SmartSummaryProps } from "./SmartSummary"

// Utilities
export { getIconSize } from "./strategyIcons"
export type { ScenarioIcon, ScenarioIconConfig } from "./strategyIcons"

// Icon system
export {
  OpsCircleIcon,
  getScenarioIconDefs,
  renderIconDef,
  ICON_REGISTRY,
  SCENARIO_ICONS,
} from "./opsIcons"
export type { IconDef, OpsCircleIconProps } from "./opsIcons"

// Tier summary
export { TierSummaryCell } from "./TierSummaryCell"
export type { TierSummaryCellProps } from "./TierSummaryCell"

// Types
export type { ChartDataPoint, OutcomeName, ScenarioForDisplay } from "./types"
export { isSingleValueTier } from "./types"
