// Scenario domain components
export { default as TierLegend } from "./TierLegend"
export {
  HydroclimateChooser,
  default as HydroclimateChooserDefault,
} from "./HydroclimateChooser"

// Layout components
export { ScenarioRow } from "./ScenarioRow"
export type { ScenarioRowProps } from "./ScenarioRow"

// Shared scenario/outcome components
export {
  OutcomeGlyphItem,
  OutcomeGrid,
  OperationsIconGroup,
  StrategyHeader,
  SmartSummary,
  getScenarioIcons,
  getThemeIcon,
  getThemeIconDescription,
  getIconSize,
  isSingleValueTier,
} from "./shared"
export type {
  OutcomeGlyphItemProps,
  OutcomeGridProps,
  OperationsIconGroupProps,
  StrategyHeaderProps,
  SmartSummaryProps,
  ScenarioIcon,
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "./shared"
