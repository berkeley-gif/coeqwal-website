"use client"

/**
 * TierGlyphWithTooltip - Self-contained tier glyph with tooltip
 *
 * Combines OutcomeGlyphItem + TierTooltipPortal + state management
 * into a single reusable component. Click to open tooltip, click away to close.
 *
 * Use this component when you need a tier glyph with tooltip behavior
 * that matches the scenario explorer.
 */

import React, { useState, useRef, useCallback, useEffect } from "react"
import {
  OutcomeGlyphItem,
  type ChartDataPoint,
} from "../scenarios/components/shared"
import { TierTooltipPortal } from "./TierTooltipPortal"

export interface TierGlyphWithTooltipProps {
  /** Outcome code (e.g., "CWS_DEL", "RES_STOR") */
  outcomeCode: string
  /** Chart data for the glyph visualization */
  chartData: ChartDataPoint[]
  /** Scenario label for the tooltip */
  scenarioLabel: string
  /** Glyph size in pixels */
  size?: number
  /** Override z-index for tooltip (use theme.zIndex.tooltipAboveModal when inside a modal) */
  zIndex?: number
}

export function TierGlyphWithTooltip({
  outcomeCode,
  chartData,
  scenarioLabel,
  size = 90,
  zIndex,
}: TierGlyphWithTooltipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isOpen = Boolean(anchorEl)

  // Toggle tooltip on glyph click
  const handleGlyphClick = useCallback(() => {
    if (isOpen) {
      setAnchorEl(null)
    } else if (containerRef.current) {
      setAnchorEl(containerRef.current)
    }
  }, [isOpen])

  // Close tooltip
  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return

    const handleScroll = () => setAnchorEl(null)
    window.addEventListener("scroll", handleScroll, true)
    return () => window.removeEventListener("scroll", handleScroll, true)
  }, [isOpen])

  return (
    <>
      <div ref={containerRef}>
        <OutcomeGlyphItem
          displayName={outcomeCode}
          name={outcomeCode}
          chartData={chartData}
          isActive={chartData.length > 0}
          isTooltipActive={isOpen}
          size={size}
          showLabel={false}
          showInfoButton={false}
          showSortButton={false}
          onGlyphClick={handleGlyphClick}
        />
      </div>
      <TierTooltipPortal
        outcomeCode={isOpen ? outcomeCode : null}
        anchorEl={anchorEl}
        onClose={handleClose}
        onForceClose={handleClose}
        scenarioLabel={scenarioLabel}
        chartData={chartData}
        zIndex={zIndex}
      />
    </>
  )
}

export default TierGlyphWithTooltip
