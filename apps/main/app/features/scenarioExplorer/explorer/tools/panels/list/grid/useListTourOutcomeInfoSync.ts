"use client"

/**
 * useListTourOutcomeInfoSync - When the list tour is on the Outcome summary step, opens the first-column
 * outcome info tooltip (same as clicking the i). Closes the tooltip when the
 * step ends or the tour is dismissed, so the popper and real tooltip move in
 * lockstep.
 */

import { useEffect, useRef } from "react"
import { useWorkspaceSlice } from "../../../../store"
import { useTourAnchorResolver } from "../../../tour/TourAnchorContext"
import { TOUR_STEPS } from "../../../tour/content"

const LIST_INFO_STEP_ID = "list.step2.info"

export function useListTourOutcomeInfoSync(
  activeTooltip: string | null,
  outcomeNames: { shortCode: string }[],
  handleOpenWithAnchor: (shortCode: string, el: HTMLElement) => void,
  forceClose: () => void,
) {
  const tourTool = useWorkspaceSlice((s) => s.tour.tool)
  const tourStep = useWorkspaceSlice((s) => s.tour.step)
  const { resolve, version } = useTourAnchorResolver()
  const wasOnListInfoStepRef = useRef(false)

  useEffect(() => {
    const isListInfoStep =
      tourTool === "list" && TOUR_STEPS.list[tourStep]?.id === LIST_INFO_STEP_ID
    if (wasOnListInfoStepRef.current && !isListInfoStep) {
      forceClose()
    }
    wasOnListInfoStepRef.current = isListInfoStep
    if (!isListInfoStep) return
    const first = outcomeNames[0]
    // `resolve` is typed as `Element` (the anchor registry accepts
    // SVG elements for the resilience tour), but this anchor is always
    // registered on an HTMLElement wrapper in StrategyGridHeader. A
    // narrow cast here is safe and keeps the querySelector fallback
    // working without losing HTMLElement-only APIs downstream.
    const el = resolve("list.outcome.infoButton") as HTMLElement | null
    if (!first || !el) return
    if (activeTooltip === first.shortCode) return
    const anchor = el.querySelector<HTMLElement>("button") ?? el
    handleOpenWithAnchor(first.shortCode, anchor)
  }, [
    tourTool,
    tourStep,
    version,
    activeTooltip,
    outcomeNames,
    resolve,
    handleOpenWithAnchor,
    forceClose,
  ])
}
