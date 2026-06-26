"use client"

/**
 * ToolTour - per-tool tour runner for Scenario Explorer
 *
 * ## How it fits together
 *
 *   Store (`tour.tool`, `tour.step`)     TourModule (steps, effects, illustrations)
 *              |                                      |
 *              v                                      v
 *         ToolTour  <--- resolve(id) ---  TourAnchorProvider (DOM registry)
 *              |
 *              +-- Popper card next to anchor, or centered fallback if no anchor
 *              +-- HighlightRing (portal, tracks anchor rect)
 *              +-- module.EffectsComponent (mounted only while active)
 *
 * Anchors: panel/toolbar components call `useTourAnchor("list.toolbar.search")`.
 * Step definitions live in `panels/<tool>/tour/steps.ts` and are wired
 * into the active `TourModule` via `tour/toolToTourMap.ts`. The set
 * of tour-enabled tools is declared in `tour/registry.ts` (hook-free,
 * so the explorer store can import it without dragging React in).
 *
 * ## Runner files (this folder)
 *
 *   ToolTour                 This file. Orchestrates: read store, pick the
 *                            step, render scrim + card + ring, call the hooks
 *   TourCard                 Card shell; composes the header/dots/actions
 *   TourCardHeader           Eyebrow + step counter + close
 *   TourStepDots             Progress dots
 *   TourCardActions          Skip / Back / Next buttons
 *   HighlightRing            Portal overlay ring, RAF-tracked to anchor bounds
 *   TourBodyContent          Renders step body; replaces `{{infoIcon}}`
 *   useTourAnchorElement     Resolve step anchor id to an element (+ late mounts)
 *   useTourKeyboardNav       Esc / arrow-key navigation while active
 *   useTourFocusManagement   Focus restore, autofocus, and Tab trap
 *
 * ## Demo effects
 *
 * Per-tool side effects live in each module's `EffectsComponent`
 * (e.g. `panels/list/tour/ListTourEffects.tsx`). The runner mounts the
 * active module's component as a sibling and keys it by tool so each
 * tool's hooks order is stable. Effects that need component-local state
 * stay as small sync hooks called from the panel (see
 * `useListInfoTooltipSync`, `useRadarInfoIconSync`).
 */

import React, { useCallback, useEffect, useMemo } from "react"
import { Box, Popper, Portal, useTheme } from "@repo/ui/mui"
import { useExplorerStore, useWorkspaceSlice } from "../../../store"
import { TOUR_MODULES } from "../toolToTourMap"
import { useTourAnchorResolver } from "../anchors/TourAnchorContext"
import { HighlightRing } from "./HighlightRing"
import { TourCard } from "./TourCard"
import { useTourAnchorElement } from "./useTourAnchorElement"
import { useTourKeyboardNav } from "./useTourKeyboardNav"
import { useTourFocusManagement } from "./useTourFocusManagement"

export default function ToolTour() {
  const theme = useTheme()

  // ------------------------------------------------------------------
  // Store + active module
  // ------------------------------------------------------------------

  const tourTool = useWorkspaceSlice((s) => s.tour.tool)
  const tourStep = useWorkspaceSlice((s) => s.tour.step)
  const endTour = useWorkspaceSlice((s) => s.endTour)
  const setTourStep = useWorkspaceSlice((s) => s.setTourStep)

  const { resolve, version } = useTourAnchorResolver()

  const activeModule = tourTool ? TOUR_MODULES[tourTool] : null
  const steps = activeModule?.steps ?? []
  const step = steps[tourStep] ?? null
  const EffectsComponent = activeModule?.EffectsComponent ?? null

  // ------------------------------------------------------------------
  // Anchor resolution (find the highlighted element, cope with late mounts)
  // ------------------------------------------------------------------

  const anchorEl = useTourAnchorElement({
    stepId: step?.id,
    anchorId: step?.anchorId,
    resolve,
    version,
  })

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------

  const isFirst = tourStep === 0
  const isLast = steps.length > 0 && tourStep === steps.length - 1

  const handleNext = useCallback(() => {
    if (isLast) {
      endTour()
    } else {
      setTourStep(tourStep + 1)
    }
  }, [isLast, endTour, setTourStep, tourStep])

  const handleBack = useCallback(() => {
    if (!isFirst) setTourStep(tourStep - 1)
  }, [isFirst, setTourStep, tourStep])

  // ------------------------------------------------------------------
  // Keyboard + focus (accessibility): mounted while a tour is active
  // ------------------------------------------------------------------

  useTourKeyboardNav({
    tourTool,
    onNext: handleNext,
    onBack: handleBack,
    onClose: endTour,
  })

  const { cardRef, nextBtnRef } = useTourFocusManagement(tourTool, tourStep)

  // Clear tour state on unmount so a later mount does not resume mid-flow
  useEffect(() => {
    return () => {
      const state = useExplorerStore.getState()
      if (state.tour.tool) {
        state.endTour()
      }
    }
  }, [])

  const titleId = useMemo(
    () => (step ? `tour-title-${step.id}` : undefined),
    [step],
  )
  const eyebrowId = useMemo(
    () => (step ? `tour-eyebrow-${step.id}` : undefined),
    [step],
  )
  const hasBody = Boolean(step && (step.body?.trim() ?? "").length > 0)
  const illustrationKey = step?.illustration
  const illustration = illustrationKey
    ? (activeModule?.illustrations?.[illustrationKey]?.() ?? null)
    : null
  const hasMainBlock = Boolean(step && (hasBody || Boolean(illustration)))
  const bodyId = useMemo(
    () => (step && hasMainBlock ? `tour-body-${step.id}` : undefined),
    [step, hasMainBlock],
  )

  // ------------------------------------------------------------------
  // Per-tool effects: mounted only while this tool's tour is active.
  // Keying by tool ensures hook order is stable per module.
  // ------------------------------------------------------------------

  const effectsNode =
    tourTool && EffectsComponent ? (
      <EffectsComponent
        key={tourTool}
        step={step}
        resolve={resolve}
        version={version}
      />
    ) : null

  if (!tourTool || !step) return effectsNode

  /** Popper when anchor resolves; otherwise fixed card at bottom center */
  const useCentered = !step.anchorId || anchorEl === null

  // Same card for both layouts; only its positioning wrapper differs.
  const card = (
    <TourCard
      step={step}
      steps={steps}
      tourStep={tourStep}
      isFirst={isFirst}
      isLast={isLast}
      illustration={illustration}
      onBack={handleBack}
      onNext={handleNext}
      onSkip={endTour}
      titleId={titleId}
      eyebrowId={eyebrowId}
      bodyId={bodyId}
      nextBtnRef={nextBtnRef}
      cardRef={cardRef}
    />
  )

  return (
    <>
      {effectsNode}
      <Portal>
        {/* Scrim. pointer-events: none keeps anchored controls clickable under copy */}
        <Box
          aria-hidden
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.18)",
            pointerEvents: "none",
            zIndex: theme.zIndex.modal - 1,
          }}
        />
        {!useCentered ? <HighlightRing anchorEl={anchorEl} /> : null}
        {useCentered ? (
          <Box
            sx={{
              position: "fixed",
              left: "50%",
              bottom: 32,
              transform: "translateX(-50%)",
              zIndex: theme.zIndex.modal,
            }}
          >
            {card}
          </Box>
        ) : (
          <Popper
            open
            anchorEl={anchorEl}
            placement={step.placement ?? "bottom"}
            modifiers={[
              {
                name: "offset",
                options: {
                  // Function form so we can push the popper past the
                  // anchor on the cross axis using a multiple of the
                  // anchor's own size (see `anchorSkidMultiplier`).
                  offset: ({
                    placement: p,
                    reference,
                  }: {
                    placement: string
                    reference: { width: number; height: number }
                  }) => {
                    const mult = step.anchorSkidMultiplier ?? 0
                    const isVertical =
                      p.startsWith("top") || p.startsWith("bottom")
                    const skid = isVertical
                      ? reference.width * mult
                      : reference.height * mult
                    return [skid, 12]
                  },
                },
              },
              {
                name: "preventOverflow",
                options: { padding: 12, altAxis: true, tether: false },
              },
              step.disableFlip
                ? { name: "flip", enabled: false }
                : { name: "flip", options: { padding: 12 } },
            ]}
            sx={{ zIndex: theme.zIndex.modal }}
          >
            {card}
          </Popper>
        )}
      </Portal>
    </>
  )
}
