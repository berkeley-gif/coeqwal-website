"use client"

import { useEffect, useRef } from "react"
import { useScenarioExplorerStore } from "../store"
import { useTourAnchorResolver } from "../tour/TourAnchorContext"
import { TOUR_STEPS } from "../tour/content"

const LIST_INFO_STEP_ID = "list.step2.info"

/**
 * When the list tour is on the Outcome summary step, opens the first-column
 * outcome info tooltip (same as clicking the i). Closes the tooltip when the
 * step ends or the tour is dismissed, so the popper and real tooltip move in
 * lockstep.
 */
export function useListTourOutcomeInfoSync(
  activeTooltip: string | null,
  outcomeNames: { shortCode: string }[],
  handleOpenWithAnchor: (shortCode: string, el: HTMLElement) => void,
  forceClose: () => void,
) {
  const tourTool = useScenarioExplorerStore((s) => s.tour.tool)
  const tourStep = useScenarioExplorerStore((s) => s.tour.step)
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
    const el = resolve("list.outcome.infoButton")
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
