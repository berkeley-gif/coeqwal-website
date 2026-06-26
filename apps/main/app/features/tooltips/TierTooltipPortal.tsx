"use client"

/**
 * TierTooltipPortal - Tier tooltip shown next to its glyph.
 *
 * Positioning, the arrow, and the mobile-modal fallback all come from the
 * shared AnchoredPortal; this component only supplies the tier content and
 * close button. Click-away and Escape call onClose (debounced upstream to
 * survive the opening click); the X button calls onForceClose.
 *
 * WCAG 4.1.2: when scenarioLabel and chartData are provided, the content shows
 * the scenario's actual tier level alongside the tier definitions.
 */

import { AnchoredPortal, TooltipCloseButton } from "@repo/ui"
import TierTooltipContent from "./TierTooltipContent"
import type { TooltipChartDataPoint } from "./useTierTooltipState"

const TIER_TOOLTIP_WIDTH = 450

interface TierTooltipPortalProps {
  /** The outcome code to show tooltip for (null = hidden) */
  outcomeCode: string | null
  /** Anchor element for positioning */
  anchorEl: HTMLElement | null
  /** Called on click-away (debounced upstream) */
  onClose: () => void
  /** Called when the user clicks the close button */
  onForceClose: () => void
  /** Optional: scenario label for context */
  scenarioLabel?: string
  /** Optional: chart data for tier distribution display */
  chartData?: TooltipChartDataPoint[]
  /** Optional: override z-index (use theme.zIndex.tooltipAboveModal inside a modal) */
  zIndex?: number
}

export function TierTooltipPortal({
  outcomeCode,
  anchorEl,
  onClose,
  onForceClose,
  scenarioLabel,
  chartData,
  zIndex,
}: TierTooltipPortalProps) {
  const isOpen = Boolean(outcomeCode && anchorEl)

  return (
    <AnchoredPortal
      open={isOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      placement="left"
      fallbackPlacements={["right", "top", "bottom"]}
      width={TIER_TOOLTIP_WIDTH}
      maxWidth="calc(100vw - 48px)"
      mobileMaxWidth={TIER_TOOLTIP_WIDTH}
      zIndex={zIndex}
    >
      <TooltipCloseButton onClick={onForceClose} offset={{ top: 8, right: 8 }} />
      <TierTooltipContent
        outcomeCode={outcomeCode!}
        showTitle={true}
        scenarioLabel={scenarioLabel}
        chartData={chartData}
      />
    </AnchoredPortal>
  )
}

export default TierTooltipPortal
