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
  OperationsIconGroup,
  StrategyHeader,
  SmartSummary,
  OpsCircleIcon,
  getScenarioIconDefs,
  renderIconDef,
  ICON_REGISTRY,
  SCENARIO_ICONS,
  getIconSize,
  isSingleValueTier,
} from "./shared"
export type {
  OutcomeGlyphItemProps,
  OperationsIconGroupProps,
  StrategyHeaderProps,
  SmartSummaryProps,
  IconDef,
  OpsCircleIconProps,
  ScenarioIcon,
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "./shared"
