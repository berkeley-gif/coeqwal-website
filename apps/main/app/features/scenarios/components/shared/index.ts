/**
 * Shared scenario components
 *
 * These components are used by both Learn mode (progressive panels)
 * and Explore mode (scenario grid/list).
 */

// Components
export { OutcomeGlyphItem, formatOutcomeLabel } from "./OutcomeGlyphItem"
export type { OutcomeGlyphItemProps } from "./OutcomeGlyphItem"

export { NoDataAtThisTime } from "./NoDataAtThisTime"
export type { NoDataAtThisTimeProps } from "./NoDataAtThisTime"

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
export { OpsCircleIcon } from "./OpsCircleIcon"
export type { OpsCircleIconProps } from "./OpsCircleIcon"
export {
  getScenarioIconDefs,
  renderIconDef,
  ICON_REGISTRY,
  SCENARIO_ICONS,
} from "./iconRegistry"
export type { IconDef } from "./iconRegistry"

// Tier summary
export { TierSummaryCell } from "./TierSummaryCell"
export type { TierSummaryCellProps } from "./TierSummaryCell"

// Types
export type { ChartDataPoint, OutcomeName, ScenarioForDisplay } from "./types"
export { isSingleValueTier } from "./types"
