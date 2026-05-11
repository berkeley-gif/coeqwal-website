"use client"

/**
 * ToolTour. Per-tool anchored tour runner for the Scenario Explorer.
 *
 * Reads `tour.tool` and `tour.step` from the store and renders:
 *   - A MUI Popper next to the current step's registered anchor, or
 *   - A centered fixed card when the step has no `anchorId` (hero and
 *     journey-wrap bookends), or when the anchor cannot be resolved
 *     (hidden control fallback).
 *
 * On step change the runner scrolls the anchor into view, applies a
 * temporary highlight ring to it, and focuses the "Next" button for
 * a lightweight focus trap and keyboard navigation.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  Button,
  Paper,
  Popper,
  Portal,
  Typography,
  alpha,
  icons,
  useTheme,
} from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import { TOUR_STEPS } from "../tour/content"
import ListTourBarIllustration from "../tour/ListTourBarIllustration"
import ListTourMapLegend from "../tour/ListTourMapLegend"
import ListTourControlIllustration, {
  type ListTourControlVariant,
} from "../tour/ListTourControlIllustration"
import { useTourAnchorResolver } from "../tour/TourAnchorContext"
import { mapActions, useMapStore } from "../../map/store"
import type { OutcomeVisualization } from "../../map/store"
import { useResolvedIdMapping } from "../../scenarios/hooks/useResolvedIdMapping"

const HIGHLIGHT_DATA_ATTR = "data-tour-highlight"

const INFO_ICON_PLACEHOLDER = "{{infoIcon}}"

// Map from `TourStep.illustration` keys that render a specific
// control sample to the `ListTourControlIllustration` variant.
// Kept as a string-indexed map so the check site can safely look up
// any illustration string (including the non-control keys) without
// branching per variant.
const CONTROL_ILLUSTRATION_VARIANT: Record<string, ListTourControlVariant> = {
  listSearch: "search",
  listChips: "chips",
  listSortButton: "sortButton",
  listCheckbox: "checkbox",
  listHydroclimate: "hydroclimate",
}

/**
 * Floating highlight ring painted over the anchor's bounding rect.
 *
 * Rendered in a Portal and positioned with `position: fixed` so it
 * can never be clipped by an ancestor's `overflow: hidden` (a common
 * issue for anchors inside the radar chart's sidebar, the axis
 * chooser panel, and the chart toolbar band).
 *
 * Tracks the anchor on every animation frame while active. That is
 * cheap for the tour's lifespan and robust to arbitrary reflows
 * (panel slides, chip toggles, sidebar scrolls, etc.) without having
 * to wire up observers against every ancestor.
 */
function HighlightRing({ anchorEl }: { anchorEl: Element | null }) {
  const theme = useTheme()
  const [rect, setRect] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    if (!anchorEl) {
      setRect(null)
      return
    }
    let raf = 0
    let prevKey = ""
    const tick = () => {
      const r = anchorEl.getBoundingClientRect()
      const key = `${r.top}|${r.left}|${r.width}|${r.height}`
      if (key !== prevKey) {
        prevKey = key
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [anchorEl])

  if (!rect) return null
  const pad = 4
  return (
    <Portal>
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          border: `2px solid ${theme.palette.blue.bright}`,
          borderRadius: 1.5,
          boxShadow: `0 0 0 4px ${alpha(theme.palette.blue.bright, 0.18)}`,
          pointerEvents: "none",
          zIndex: theme.zIndex.modal - 1,
          transition:
            "top 120ms ease, left 120ms ease, width 120ms ease, height 120ms ease",
        }}
      />
    </Portal>
  )
}

function TourBodyContent({
  body,
  infoIconColor,
}: {
  body: string
  infoIconColor: string
}) {
  if (!body.includes(INFO_ICON_PLACEHOLDER)) {
    return <>{body}</>
  }
  const parts = body.split(INFO_ICON_PLACEHOLDER)
  const InfoGlyph = icons.InfoOutlined
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 ? (
            <Box
              component="span"
              role="img"
              aria-label="info"
              sx={{
                display: "inline-flex",
                verticalAlign: "middle",
                position: "relative",
                top: -1,
                mx: 0.2,
              }}
            >
              <InfoGlyph
                sx={{
                  fontSize: "1.1em",
                  color: infoIconColor,
                }}
              />
            </Box>
          ) : null}
        </React.Fragment>
      ))}
    </>
  )
}

export default function ToolTour() {
  const theme = useTheme()

  const tourTool = useScenarioExplorerStore((s) => s.tour.tool)
  const tourStep = useScenarioExplorerStore((s) => s.tour.step)
  const endTour = useScenarioExplorerStore((s) => s.endTour)
  const setTourStep = useScenarioExplorerStore((s) => s.setTourStep)
  const setShowMap = useScenarioExplorerStore((s) => s.setShowMap)
  // Subscribe to showMap so the honest-click effect can wait until
  // the map is actually visible. Critical: UnifiedToolLayout has a
  // useEffect([showMap]) whose cleanup calls
  // mapActions.clearOutcomeVisualization(). When showMap flips
  // false to true, that cleanup wipes any visualization we set
  // before the transition. Gating our set on showMap === true
  // ensures we run AFTER UnifiedToolLayout has settled.
  const showMap = useScenarioExplorerStore((s) => s.showMap)
  const setShowKeyOperations = useScenarioExplorerStore(
    (s) => s.setShowKeyOperations,
  )
  const setShowAxisSelector = useScenarioExplorerStore(
    (s) => s.setShowAxisSelector,
  )
  const setHighlightBaseline = useScenarioExplorerStore(
    (s) => s.setHighlightBaseline,
  )
  const setShowRadarRange = useScenarioExplorerStore((s) => s.setShowRadarRange)

  const { resolve, version } = useTourAnchorResolver()

  const steps = tourTool ? TOUR_STEPS[tourTool] : []
  const step = steps[tourStep] ?? null
  const stepId = step?.id
  const anchorId = step?.anchorId
  // Single key for the anchor `useEffect` deps so the dependency array
  // always has the same length (3). React warns if the effect's deps
  // array changes size between renders, which can happen when Fast
  // Refresh replaces a 3-tuple with a 4-tuple or vice versa. Encoding
  // step and anchor in one string keeps behavior equivalent to
  // [stepId, anchorId, ...] without a variable-length list.
  const tourStepAnchorKey = useMemo(
    () =>
      [tourTool ?? "", String(tourStep), stepId ?? "", anchorId ?? ""].join(
        "\u0000",
      ),
    [tourTool, tourStep, stepId, anchorId],
  )

  const hasTourBody = Boolean(step && (step.body?.trim() ?? "").length > 0)
  const hasTourMainBlock = Boolean(
    step && (hasTourBody || Boolean(step.illustration)),
  )

  // Re-resolve the current anchor whenever the registry changes or the
  // step moves. We keep this in state so the Popper re-positions when
  // an anchor mounts late.
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  // Give late-mounting anchors a short grace period before falling
  // back to a centered dialog. Without this the runner would briefly
  // render as "hidden control" every time the step changes.
  const [fallbackToCentered, setFallbackToCentered] = useState(false)

  // Keep a fixed-length deps array ([tourStepAnchorKey, version, resolve])
  // so React never complains when Fast Refresh swaps a 3-tuple for a
  // 4-tuple. stepId and anchorId are encoded in tourStepAnchorKey.
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
    // stepId and anchorId are read inside the effect but their changes
    // are already captured by tourStepAnchorKey. Listing them would
    // grow the deps array to 5 and trip "changed size between renders"
    // during Fast Refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStepAnchorKey, version, resolve])

  // Scroll the anchor into view + tag it for downstream CSS hooks.
  // The actual highlight ring is painted by <HighlightRing> in a
  // portal, keyed to the anchor's bounding rect, so it can't be
  // clipped by an ancestor's `overflow: hidden`.
  useEffect(() => {
    if (!anchorEl) return
    anchorEl.scrollIntoView({ behavior: "smooth", block: "nearest" })
    anchorEl.setAttribute(HIGHLIGHT_DATA_ATTR, "true")
    return () => {
      anchorEl.removeAttribute(HIGHLIGHT_DATA_ATTR)
    }
  }, [anchorEl])

  // Map-reveal + honest-click side effects for the list-tour map step.
  //
  // 1. Snapshot the map visibility + the currently active map outcome on
  //    entry so we can return both to whatever the user had on exit.
  // 2. Slide the map open if it was closed.
  // 3. Once the map is actually visible (the map-action hook recomputes
  //    `isMapVisible` after the store updates), fire the exact same
  //    showOutcomeOnMap call that the live bar cell would fire. The
  //    (scenarioId, outcomeCode) pair is stashed on the anchored cell
  //    via data attributes by StrategyGridRow's layout effect.
  //
  // Uses a shared ref so the enter and the cleanup cooperate across
  // the two effects below without re-subscribing to store slices that
  // we change ourselves (which would re-trigger these effects).
  const mapDemoRef = useRef<{
    prevShowMap: boolean
    prevActive: OutcomeVisualization | null
    demoFired: boolean
  } | null>(null)

  const { idMapping: hcIdMapping } = useResolvedIdMapping()

  // Temporarily reveal the Key operations column while the operations
  // tour step is active, then restore the user's previous chip state
  // on exit. Snapshot lives in a ref so the snapshot effect doesn't
  // re-subscribe to `showKeyOperations` (which we are about to change).
  const opsDemoRef = useRef<{
    prevShowKeyOperations: boolean
  } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "list.step1.operations") return
    const prevShowKeyOperations =
      useScenarioExplorerStore.getState().showKeyOperations
    opsDemoRef.current = { prevShowKeyOperations }
    if (!prevShowKeyOperations) {
      setShowKeyOperations(true)
    }
    return () => {
      const snap = opsDemoRef.current
      opsDemoRef.current = null
      if (!snap) return
      if (!snap.prevShowKeyOperations) {
        setShowKeyOperations(false)
      }
    }
  }, [step, setShowKeyOperations])

  // Temporarily slide the axis chooser panel open while the radar
  // axis-chooser tour step is active, then restore the user's
  // previous state on exit. Same ref pattern as opsDemoRef so the
  // snapshot effect does not re-subscribe to the slice it mutates.
  const axisSelectorDemoRef = useRef<{
    prevShowAxisSelector: boolean
  } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "radar.step1.axisChooser") return
    const prevShowAxisSelector =
      useScenarioExplorerStore.getState().showAxisSelector
    axisSelectorDemoRef.current = { prevShowAxisSelector }
    if (!prevShowAxisSelector) {
      setShowAxisSelector(true)
    }
    return () => {
      const snap = axisSelectorDemoRef.current
      axisSelectorDemoRef.current = null
      if (!snap) return
      if (!snap.prevShowAxisSelector) {
        setShowAxisSelector(false)
      }
    }
  }, [step, setShowAxisSelector])

  // Demo the "highlight current operations" chip. Flip the baseline
  // overlay on while the step is active so the popper copy lines up
  // with what the chart is doing, then restore the user's previous
  // setting on exit.
  const highlightBaselineDemoRef = useRef<{
    prevHighlightBaseline: boolean
  } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "radar.step1.highlightBaseline") return
    const prevHighlightBaseline =
      useScenarioExplorerStore.getState().highlightBaseline
    highlightBaselineDemoRef.current = { prevHighlightBaseline }
    if (!prevHighlightBaseline) {
      setHighlightBaseline(true)
    }
    return () => {
      const snap = highlightBaselineDemoRef.current
      highlightBaselineDemoRef.current = null
      if (!snap) return
      if (!snap.prevHighlightBaseline) {
        setHighlightBaseline(false)
      }
    }
  }, [step, setHighlightBaseline])

  // Demo the "show range" chip. Same snapshot/restore pattern.
  const radarRangeDemoRef = useRef<{
    prevShowRadarRange: boolean
  } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "radar.step1.libraryRange") return
    const prevShowRadarRange =
      useScenarioExplorerStore.getState().showRadarRange
    radarRangeDemoRef.current = { prevShowRadarRange }
    if (!prevShowRadarRange) {
      setShowRadarRange(true)
    }
    return () => {
      const snap = radarRangeDemoRef.current
      radarRangeDemoRef.current = null
      if (!snap) return
      if (!snap.prevShowRadarRange) {
        setShowRadarRange(false)
      }
    }
  }, [step, setShowRadarRange])

  useEffect(() => {
    if (!step) return
    if (step.id !== "list.step4.map") return

    const prevShowMap = useScenarioExplorerStore.getState().showMap
    const prevActive = useMapStore.getState().activeOutcomeVisualization
    mapDemoRef.current = {
      prevShowMap,
      prevActive,
      demoFired: false,
    }
    if (!prevShowMap) {
      setShowMap(true)
    }

    return () => {
      const snap = mapDemoRef.current
      mapDemoRef.current = null
      if (!snap) return
      if (snap.demoFired) {
        if (snap.prevActive) {
          mapActions.setOutcomeVisualization(
            snap.prevActive.outcomeCode,
            snap.prevActive.scenarioId,
            snap.prevActive.siblingGroupId,
          )
        } else {
          mapActions.clearOutcomeVisualization()
        }
      }
      if (!snap.prevShowMap) {
        setShowMap(false)
      }
    }
  }, [step, setShowMap])

  // Fire the honest click directly on the map store, mirroring what a
  // real glyph click does (clear tooltips when the outcome changes,
  // then set the active visualization).
  //
  // Two things make this tricky:
  //   1. UnifiedToolLayout has `useEffect(..., [showMap])` whose
  //      cleanup calls `clearOutcomeVisualization()`. When the tour
  //      flips showMap from false to true, that cleanup wipes any
  //      visualization we set BEFORE the transition completes. We
  //      dodge it by gating on `showMap === true` so the effect only
  //      runs after the transition has settled.
  //   2. Sibling-component effect ordering on an update is not
  //      something we want to hinge correctness on, so we defer the
  //      actual set by one animation frame. That guarantees we run
  //      after UnifiedToolLayout's cleanup+effect pair for this
  //      render, no matter the tree order.
  useEffect(() => {
    if (!step) return
    if (step.id !== "list.step4.map") return
    if (!showMap) return
    if (mapDemoRef.current?.demoFired) return

    const raf = window.requestAnimationFrame(() => {
      if (mapDemoRef.current?.demoFired) return
      // `resolve` is widened to `Element`. This particular anchor is
      // always an HTMLElement (a DOM button in the bar chart), so a
      // narrow cast here is safe and keeps the dataset access typed.
      const el = resolve("list.outcome.barChart") as HTMLElement | null
      if (!el) return
      const scenarioId = el.dataset.tourScenarioId
      const outcomeCode = el.dataset.tourOutcomeCode
      if (!scenarioId || !outcomeCode) return
      const resolvedId = hcIdMapping[scenarioId] ?? scenarioId
      const current = useMapStore.getState().activeOutcomeVisualization
      if (!current || current.outcomeCode !== outcomeCode) {
        mapActions.clearMapTooltips()
      }
      mapActions.setOutcomeVisualization(outcomeCode, resolvedId, scenarioId)
      if (mapDemoRef.current) {
        mapDemoRef.current.demoFired = true
      }
    })

    return () => window.cancelAnimationFrame(raf)
  }, [step, showMap, resolve, version, hcIdMapping])

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

  // Keyboard: ESC closes, Left/Right navigate. Ignored when the user
  // is typing in an input, so a tour covering a search field does not
  // hijack their keystrokes.
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

  // Restore focus to whatever was focused before the tour opened.
  const triggerElRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!tourTool) return
    triggerElRef.current = document.activeElement as HTMLElement | null
    return () => {
      triggerElRef.current?.focus?.()
    }
  }, [tourTool])

  // Safety net: if this runner unmounts for any reason (parent stops
  // rendering us when the user leaves the explorer, a route change,
  // etc.), clear the tour state so it doesn't silently resume the
  // next time the runner mounts. Uses getState so we don't anchor
  // the effect to a changing slice.
  useEffect(() => {
    return () => {
      const state = useScenarioExplorerStore.getState()
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

  // Lightweight focus trap. Tab/Shift+Tab cycles among the buttons
  // inside the tour card. Everything outside is dimmed and unreachable
  // by keyboard, matching the visual modality.
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
  const bodyId = useMemo(
    () => (step && hasTourMainBlock ? `tour-body-${step.id}` : undefined),
    [step, hasTourMainBlock],
  )

  if (!tourTool || !step) return null

  const useCentered = !step.anchorId || fallbackToCentered || anchorEl === null

  // Shared size. Row wraps instead of shrinking labels. Min width keeps tap targets.
  const tourActionShape = {
    textTransform: "none" as const,
    fontSize: "0.8125rem",
    minWidth: 88,
    flexShrink: 0,
    borderRadius: 1.5,
  }

  const card = (
    <Paper
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={step.title.trim() ? titleId : eyebrowId}
      aria-describedby={hasTourMainBlock ? bodyId : undefined}
      elevation={8}
      sx={{
        width: step.illustration
          ? "min(520px, calc(100vw - 32px))"
          : "min(440px, calc(100vw - 32px))",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        p: 2.25,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          id={step.title.trim() ? undefined : eyebrowId}
          variant="caption"
          sx={{
            color: theme.palette.text.primary,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
            fontSize: "0.6875rem",
          }}
        >
          {step.eyebrow ?? `Step ${tourStep + 1} of ${steps.length}`}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[700],
            fontSize: "0.6875rem",
            fontWeight: 500,
          }}
        >
          {tourStep + 1} / {steps.length}
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={endTour}
          aria-label="Close tour"
          sx={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: theme.palette.grey[700],
            display: "inline-flex",
            alignItems: "center",
            p: 0.25,
            "&:hover": { color: theme.palette.text.primary },
          }}
        >
          <icons.Close sx={{ fontSize: "1.1rem" }} />
        </Box>
      </Box>

      {step.title.trim() ? (
        <Box
          id={titleId}
          component="h2"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            m: 0,
            fontWeight: 600,
            fontSize: "1rem",
            color: theme.palette.text.primary,
            lineHeight: 1.3,
          }}
        >
          {step.titleIcon === "pin" && (
            <icons.PushPin
              sx={{
                fontSize: "1.2rem",
                color: theme.palette.grey[600],
                flexShrink: 0,
                transform: "rotate(45deg)",
              }}
              aria-hidden
            />
          )}
          {step.titleIcon === "share" && (
            <icons.IosShare
              sx={{
                fontSize: "1.2rem",
                color: theme.palette.grey[600],
                flexShrink: 0,
              }}
              aria-hidden
            />
          )}
          <span>{step.title}</span>
        </Box>
      ) : null}
      {hasTourMainBlock ? (
        <Box
          id={bodyId}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
            minWidth: 0,
          }}
        >
          {step.illustration === "listMapLegend" ? <ListTourMapLegend /> : null}
          {step.illustration === "listBarTiers" ? (
            <ListTourBarIllustration />
          ) : null}
          {step.illustration &&
          CONTROL_ILLUSTRATION_VARIANT[step.illustration] ? (
            <ListTourControlIllustration
              variant={CONTROL_ILLUSTRATION_VARIANT[step.illustration]!}
            />
          ) : null}
          {hasTourBody ? (
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: theme.palette.text.primary,
                lineHeight: 1.55,
                whiteSpace: "pre-line",
              }}
              component="div"
            >
              <TourBodyContent
                body={step.body ?? ""}
                infoIconColor={theme.palette.grey[700]}
              />
            </Typography>
          ) : null}
        </Box>
      ) : null}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          mt: hasTourMainBlock ? 0.5 : 0,
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box
          component="ol"
          aria-hidden
          sx={{
            m: 0,
            p: 0,
            listStyle: "none",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.5,
            minWidth: 0,
            rowGap: 0.5,
          }}
        >
          {steps.map((s, i) => (
            <Box
              key={s.id}
              component="li"
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                backgroundColor:
                  i === tourStep
                    ? theme.palette.blue.bright
                    : theme.palette.grey[300],
              }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.75,
            rowGap: 0.75,
            width: "100%",
            minWidth: 0,
          }}
        >
          <Button
            size="small"
            type="button"
            variant="outlined"
            onClick={endTour}
            sx={{
              ...tourActionShape,
              color: theme.palette.grey[700],
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.background.paper,
              "&:hover": {
                borderColor: theme.palette.grey[400],
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Skip
          </Button>
          {!isFirst && (
            <Button
              size="small"
              type="button"
              variant="outlined"
              onClick={handleBack}
              sx={{
                ...tourActionShape,
                color: theme.palette.grey[700],
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.background.paper,
                "&:hover": {
                  borderColor: theme.palette.grey[400],
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              Back
            </Button>
          )}
          <Button
            ref={nextBtnRef}
            size="small"
            type="button"
            variant="contained"
            onClick={handleNext}
            sx={tourActionShape}
          >
            {isLast ? "Finish" : "Next"}
          </Button>
        </Box>
      </Box>
    </Paper>
  )

  return (
    <Portal>
      {/* Dim. Pointer-events none so highlighted anchors remain
          clickable (useful when the tour mentions a control the user
          wants to try immediately). */}
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
  )
}
