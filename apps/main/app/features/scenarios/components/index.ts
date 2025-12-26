// Scenario domain components
export { default as TierLegend } from "./TierLegend"
export {
  HydroclimateChooser,
  default as HydroclimateChooserDefault,
} from "./HydroclimateChooser"

// Shared strategy/outcome components
export {
  OutcomeGlyphItem,
  OutcomeGrid,
  OperationsIconGroup,
  StrategyHeader,
  getStrategyIcons,
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
  StrategyIcon,
  // Note: ChartDataPoint is exported from hooks/useTierData to avoid duplicate exports
  OutcomeName,
  Strategy,
} from "./shared"
