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
 * ## File sections
 *
 *   ToolTour            Runner: resolve anchor, render card, a11y
 *   TourCard            Render-only card (in this folder)
 *   HighlightRing       Portal overlay ring, RAF-tracked to anchor bounds
 *   TourBodyContent     Renders step body text; replaces `{{infoIcon}}` placeholder
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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Box, Popper, Portal, useTheme } from "@repo/ui/mui"
import { useExplorerStore, useWorkspaceSlice } from "../../../store"
import { TOUR_MODULES } from "../toolToTourMap"
import { useTourAnchorResolver } from "../anchors/TourAnchorContext"
import { HighlightRing } from "./HighlightRing"
import { TourCard } from "./TourCard"

const HIGHLIGHT_DATA_ATTR = "data-tour-highlight"

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

  const stepId = step?.id
  const anchorId = step?.anchorId
  /** Stable deps key for anchor resolution (fixed length for Fast Refresh) */
  const tourStepAnchorKey = useMemo(
    () =>
      [tourTool ?? "", String(tourStep), stepId ?? "", anchorId ?? ""].join(
        "\u0000",
      ),
    [tourTool, tourStep, stepId, anchorId],
  )

  // ------------------------------------------------------------------
  // Anchor resolution (TourAnchorProvider registry)
  // ------------------------------------------------------------------

  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  /** True when anchor id exists but no element registered after grace period */
  const [fallbackToCentered, setFallbackToCentered] = useState(false)

  useEffect(() => {
    if (!stepId) {
      setAnchorEl((prev) => (prev == null ? prev : null))
      setFallbackToCentered((prev) => (prev === false ? prev : false))
      return
    }
    if (!anchorId) {
      setAnchorEl((prev) => (prev == null ? prev : null))
      setFallbackToCentered((prev) => (prev === false ? prev : false))
      return
    }
    const el = resolve(anchorId)
    setAnchorEl((prev) => (prev === el ? prev : el))
    if (el) {
      setFallbackToCentered((prev) => (prev === false ? prev : false))
      return
    }
    setFallbackToCentered((prev) => (prev === false ? prev : false))
    const timer = window.setTimeout(() => {
      const retry = resolve(anchorId)
      if (retry) {
        setAnchorEl((prev) => (prev === retry ? prev : retry))
      } else {
        setFallbackToCentered((prev) => (prev === true ? prev : true))
      }
    }, 250)
    return () => window.clearTimeout(timer)
    // stepId and anchorId are encoded in tourStepAnchorKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStepAnchorKey, version, resolve])

  // Scroll anchor into view and set data-tour-highlight for optional CSS hooks
  useEffect(() => {
    if (!anchorEl) return
    anchorEl.scrollIntoView({ behavior: "smooth", block: "nearest" })
    anchorEl.setAttribute(HIGHLIGHT_DATA_ATTR, "true")
    return () => {
      anchorEl.removeAttribute(HIGHLIGHT_DATA_ATTR)
    }
  }, [anchorEl])

  // ------------------------------------------------------------------
  // Navigation + accessibility
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

  // ESC / arrow keys (skipped when focus is in an input)
  useEffect(() => {
    if (!tourTool) return
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        endTour()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handleBack()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [tourTool, endTour, handleNext, handleBack])

  // Restore focus to the element that had focus when the tour opened
  const triggerElRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!tourTool) return
    triggerElRef.current = document.activeElement as HTMLElement | null
    return () => {
      triggerElRef.current?.focus?.()
    }
  }, [tourTool])

  // Clear tour state on unmount so a later mount does not resume mid-flow
  useEffect(() => {
    return () => {
      const state = useExplorerStore.getState()
      if (state.tour.tool) {
        state.endTour()
      }
    }
  }, [])

  const nextBtnRef = useRef<HTMLButtonElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!tourTool) return
    const timer = window.setTimeout(() => {
      nextBtnRef.current?.focus({ preventScroll: true })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [tourTool, tourStep])

  // Tab cycles within the dialog only
  useEffect(() => {
    if (!tourTool) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const card = cardRef.current
      if (!card) return
      const focusables = card.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables.item(0)
      const last = focusables.item(focusables.length - 1)
      if (first == null || last == null) return
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !card.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !card.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [tourTool])

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
  const useCentered = !step.anchorId || fallbackToCentered || anchorEl === null

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
          </Popper>
        )}
      </Portal>
    </>
  )
}
