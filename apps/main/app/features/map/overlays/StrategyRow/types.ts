/**
 * StrategyRow types - prop interfaces for strategy panels
 */

export interface StrategyInfoPanelProps {
  /** Strategy value to display (defaults to "current-ops") */
  strategyValue?: string
  /** Callback when the title is clicked (to reopen tooltip) */
  onTitleClick?: () => void
}

export interface KeyOperationsPanelProps {
  /** Strategy value to display (defaults to "current-ops") */
  strategyValue?: string
  /** Callback when the title is clicked (to reopen tooltip) */
  onTitleClick?: () => void
}

export interface KeyOutcomesPanelProps {
  /** Scenario ID to display (defaults to "s0020" for current operations) */
  scenarioId?: string
  /** Callback when the title is clicked (to reopen tooltip) */
  onTitleClick?: () => void
}
