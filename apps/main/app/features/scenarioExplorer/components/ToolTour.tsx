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
import { useTourAnchorResolver } from "../tour/TourAnchorContext"

const HIGHLIGHT_DATA_ATTR = "data-tour-highlight"

export default function ToolTour() {
  const theme = useTheme()

  const tourTool = useScenarioExplorerStore((s) => s.tour.tool)
  const tourStep = useScenarioExplorerStore((s) => s.tour.step)
  const endTour = useScenarioExplorerStore((s) => s.endTour)
  const setTourStep = useScenarioExplorerStore((s) => s.setTourStep)

  const { resolve, version } = useTourAnchorResolver()

  const steps = tourTool ? TOUR_STEPS[tourTool] : []
  const step = steps[tourStep] ?? null

  // Re-resolve the current anchor whenever the registry changes or the
  // step moves. We keep this in state so the Popper re-positions when
  // an anchor mounts late.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  // Give late-mounting anchors a short grace period before falling
  // back to a centered dialog. Without this the runner would briefly
  // render as "hidden control" every time the step changes.
  const [fallbackToCentered, setFallbackToCentered] = useState(false)

  useEffect(() => {
    if (!step) {
      setAnchorEl(null)
      setFallbackToCentered(false)
      return
    }
    if (!step.anchorId) {
      setAnchorEl(null)
      setFallbackToCentered(false)
      return
    }
    const el = resolve(step.anchorId)
    setAnchorEl(el)
    if (el) {
      setFallbackToCentered(false)
      return
    }
    setFallbackToCentered(false)
    const timer = window.setTimeout(() => {
      const retry = resolve(step.anchorId!)
      if (retry) {
        setAnchorEl(retry)
      } else {
        setFallbackToCentered(true)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [step, resolve, version])

  // Scroll the anchor into view + apply highlight ring while this step
  // is active. Cleanup restores inline styles on step change and on
  // unmount.
  useEffect(() => {
    if (!anchorEl) return
    anchorEl.scrollIntoView({ behavior: "smooth", block: "nearest" })
    const prevOutline = anchorEl.style.outline
    const prevOutlineOffset = anchorEl.style.outlineOffset
    const prevBoxShadow = anchorEl.style.boxShadow
    const prevBorderRadius = anchorEl.style.borderRadius
    const prevTransition = anchorEl.style.transition
    const prevPosition = anchorEl.style.position
    if (!anchorEl.style.position) {
      anchorEl.style.position = "relative"
    }
    anchorEl.style.transition =
      "outline-color 160ms ease, box-shadow 160ms ease"
    anchorEl.style.outline = `2px solid ${theme.palette.blue.bright}`
    anchorEl.style.outlineOffset = "2px"
    anchorEl.style.boxShadow = `0 0 0 6px ${alpha(
      theme.palette.blue.bright,
      0.18,
    )}`
    anchorEl.setAttribute(HIGHLIGHT_DATA_ATTR, "true")
    return () => {
      anchorEl.style.outline = prevOutline
      anchorEl.style.outlineOffset = prevOutlineOffset
      anchorEl.style.boxShadow = prevBoxShadow
      anchorEl.style.borderRadius = prevBorderRadius
      anchorEl.style.transition = prevTransition
      anchorEl.style.position = prevPosition
      anchorEl.removeAttribute(HIGHLIGHT_DATA_ATTR)
    }
  }, [anchorEl, theme.palette.blue.bright])

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
  // inside the tour card; everything outside is dimmed and unreachable
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
  const bodyId = useMemo(
    () => (step ? `tour-body-${step.id}` : undefined),
    [step],
  )

  if (!tourTool || !step) return null

  const useCentered =
    !step.anchorId || fallbackToCentered || anchorEl === null

  // Shared size. Row wraps instead of shrinking labels; min width keeps tap targets.
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
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      elevation={8}
      sx={{
        width: "min(440px, calc(100vw - 32px))",
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
      <Typography
        id={bodyId}
        sx={{
          fontSize: "0.875rem",
          color: theme.palette.text.primary,
          lineHeight: 1.5,
          whiteSpace: "pre-line",
        }}
      >
        {step.body}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          mt: 0.5,
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
            { name: "offset", options: { offset: [0, 12] } },
            {
              name: "preventOverflow",
              options: { padding: 12, altAxis: true, tether: false },
            },
            { name: "flip", options: { padding: 12 } },
          ]}
          sx={{ zIndex: theme.zIndex.modal }}
        >
          {card}
        </Popper>
      )}
    </Portal>
  )
}
