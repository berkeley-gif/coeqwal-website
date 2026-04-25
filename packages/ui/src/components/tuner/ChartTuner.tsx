"use client"

/**
 * ChartTuner: inline trigger button + portaled overlay for tuning charts.
 *
 * Designed as a user-friendly alternative to traditional chart-control
 * toolbars. It exposes three things, in order of approachability:
 *
 *   1. Walkthrough: a guided tour of the chart, one concept at a time.
 *   2. Presets:    one-click "saved views" (e.g. "Drought year", "Delta").
 *   3. Controls:   the existing chart-control widgets, for power users.
 *
 * The trigger is a small pill-style button that can be placed anywhere
 * (inline in a toolbar, pinned to a corner, etc.). Opening it portals an
 * overlay to `document.body` so the panel floats above all layout and can
 * never be clipped by a scroll container.
 *
 * Visual design: the inline trigger inherits the *host* theme (so it
 * blends into wherever it's dropped), but the floating overlay is wrapped
 * in a `<ThemeProvider>` carrying `createTunerDarkTheme(host)`. Every
 * `useTheme()` consumer inside the overlay, including embedded
 * controls like `ResilienceControls` and its chips + Selects, picks up
 * the dark palette automatically, so the whole surface reads as one
 * focused dark panel.
 *
 * The ChartTuner is self-contained. Each mounted instance manages its
 * own open/close state. It is *not* gated by the global Cmd/Ctrl+K
 * shortcut used by `PanelTuner`; ChartTuners are part of the normal UI
 * and always visible to users.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Box, Portal, ThemeProvider, useTheme } from "@mui/material"
import type { ChartTunerProps, TunerPreset, WalkthroughStep } from "./types"
import { createTunerDarkTheme } from "./tunerTheme"

const MIN_TUNER_WIDTH = 320
const MAX_TUNER_WIDTH = 420
const OVERLAY_GUTTER = 12

export default function ChartTuner({
  triggerLabel,
  triggerSx,
  walkthrough = [],
  presets = [],
  controls,
  description,
  onReset,
  getSnapshot,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  triggerRef: externalTriggerRef,
}: ChartTunerProps) {
  const hostTheme = useTheme()
  const isControlled = controlledOpen !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: boolean) => boolean)(open)
          : next
      if (!isControlled) setUncontrolledOpen(resolved)
      onOpenChange?.(resolved)
    },
    [isControlled, onOpenChange, open],
  )
  const [stepIdx, setStepIdx] = useState(0)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const darkTheme = useMemo(() => createTunerDarkTheme(hostTheme), [hostTheme])

  const updateAnchor = useCallback(() => {
    if (!triggerRef.current) return
    setAnchorRect(triggerRef.current.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!open) return
    updateAnchor()
    window.addEventListener("resize", updateAnchor)
    window.addEventListener("scroll", updateAnchor, true)
    return () => {
      window.removeEventListener("resize", updateAnchor)
      window.removeEventListener("scroll", updateAnchor, true)
    }
  }, [open, updateAnchor])

  // Esc closes the overlay when it's open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  // Click-outside to close.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (overlayRef.current && overlayRef.current.contains(target)) return
      if (triggerRef.current && triggerRef.current.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open, setOpen])

  const applyStep = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= walkthrough.length) return
      setStepIdx(idx)
      const step = walkthrough[idx]
      if (step?.apply) step.apply()
    },
    [walkthrough],
  )

  const applyPreset = useCallback((preset: TunerPreset) => {
    setActivePresetId(preset.id)
    preset.apply()
  }, [])

  const handleReset = useCallback(() => {
    setActivePresetId(null)
    setStepIdx(0)
    onReset?.()
  }, [onReset])

  const handleCopy = useCallback(() => {
    if (!getSnapshot) return
    try {
      const snapshot = getSnapshot()
      const text = JSON.stringify(snapshot, null, 2)
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1400)
        })
      }
    } catch {
      // ignore serialization errors; not worth surfacing
    }
  }, [getSnapshot])

  // Position the overlay: anchored under the trigger, left-aligned to it,
  // but clamped to the viewport horizontally so small screens don't clip.
  // zIndex comes from the host theme so the overlay stacks correctly
  // against the host app's modal layer.
  const overlayStyle = useMemo<React.CSSProperties | null>(() => {
    if (!anchorRect) return null
    const width = Math.max(
      MIN_TUNER_WIDTH,
      Math.min(MAX_TUNER_WIDTH, window.innerWidth - OVERLAY_GUTTER * 2),
    )
    const top = anchorRect.bottom + 8
    let left = anchorRect.left
    if (left + width > window.innerWidth - OVERLAY_GUTTER) {
      left = Math.max(
        OVERLAY_GUTTER,
        window.innerWidth - width - OVERLAY_GUTTER,
      )
    }
    if (left < OVERLAY_GUTTER) left = OVERLAY_GUTTER
    return {
      position: "fixed",
      top,
      left,
      width,
      maxHeight: `calc(100vh - ${top + OVERLAY_GUTTER}px)`,
      zIndex: hostTheme.zIndex.modal + 1,
    }
  }, [anchorRect, hostTheme.zIndex.modal])

  return (
    <>
      <Box
        component="button"
        type="button"
        ref={(el: HTMLButtonElement | null) => {
          triggerRef.current = el
          externalTriggerRef?.(el)
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((p) => !p)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          border: `1px solid ${hostTheme.palette.divider}`,
          background: hostTheme.palette.background.paper,
          color: hostTheme.palette.text.primary,
          font: "600 11px/1 system-ui, sans-serif",
          letterSpacing: 1,
          cursor: "pointer",
          transition: "background-color .15s ease, border-color .15s ease",
          "&:hover": {
            backgroundColor: hostTheme.palette.action.hover,
          },
          "&:focus-visible": {
            outline: `2px solid ${hostTheme.palette.primary.main}`,
            outlineOffset: 2,
          },
          ...(triggerSx as object),
        }}
      >
        <Box
          component="span"
          aria-hidden
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: open
              ? hostTheme.palette.primary.main
              : hostTheme.palette.text.disabled,
          }}
        />
        {triggerLabel}
      </Box>

      {open && overlayStyle ? (
        <Portal>
          <ThemeProvider theme={darkTheme}>
            <OverlayBody
              overlayRef={overlayRef}
              overlayStyle={overlayStyle}
              triggerLabel={triggerLabel}
              description={description}
              onClose={() => setOpen(false)}
              walkthrough={walkthrough}
              stepIdx={stepIdx}
              onStep={applyStep}
              presets={presets}
              activePresetId={activePresetId}
              onPreset={applyPreset}
              controls={controls}
              onReset={onReset ? handleReset : undefined}
              onCopy={getSnapshot ? handleCopy : undefined}
              copied={copied}
            />
          </ThemeProvider>
        </Portal>
      ) : null}
    </>
  )
}

interface OverlayBodyProps {
  overlayRef: React.MutableRefObject<HTMLDivElement | null>
  overlayStyle: React.CSSProperties
  triggerLabel: string
  description?: React.ReactNode
  onClose: () => void
  walkthrough: WalkthroughStep[]
  stepIdx: number
  onStep: (idx: number) => void
  presets: TunerPreset[]
  activePresetId: string | null
  onPreset: (p: TunerPreset) => void
  controls?: React.ReactNode
  onReset?: () => void
  onCopy?: () => void
  copied: boolean
}

/**
 * Renders the floating panel. Isolated so it consumes the *dark* theme
 * injected by the parent `ThemeProvider`, every `useTheme()` in here
 * (and in every descendant, including embedded chips and Selects) sees
 * the tuner palette.
 */
function OverlayBody({
  overlayRef,
  overlayStyle,
  triggerLabel,
  description,
  onClose,
  walkthrough,
  stepIdx,
  onStep,
  presets,
  activePresetId,
  onPreset,
  controls,
  onReset,
  onCopy,
  copied,
}: OverlayBodyProps) {
  const theme = useTheme()
  const hasWalkthrough = walkthrough.length > 0
  const hasPresets = presets.length > 0
  const hasControls = controls !== undefined && controls !== null
  const currentStep = hasWalkthrough ? walkthrough[stepIdx] : null

  return (
    <Box
      ref={overlayRef}
      role="dialog"
      aria-label={triggerLabel}
      style={overlayStyle}
      sx={{
        display: "flex",
        flexDirection: "column",
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.75,
          py: 1.25,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box
            component="div"
            sx={{
              fontSize: 11,
              letterSpacing: 1,
              fontWeight: 700,
              color: theme.palette.text.secondary,
            }}
          >
            {triggerLabel}
          </Box>
          {description ? (
            <Box
              component="div"
              sx={{
                mt: 0.5,
                fontSize: 12,
                color: theme.palette.text.secondary,
                lineHeight: 1.4,
              }}
            >
              {description}
            </Box>
          ) : null}
        </Box>
        <Box
          component="button"
          type="button"
          aria-label={`Close ${triggerLabel}`}
          onClick={onClose}
          sx={{
            width: 24,
            height: 24,
            borderRadius: 0.75,
            border: "none",
            background: "transparent",
            color: theme.palette.text.secondary,
            cursor: "pointer",
            fontSize: 16,
            lineHeight: "22px",
            p: 0,
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          ×
        </Box>
      </Box>

      <Box
        sx={{
          overflowY: "auto",
          px: 1.75,
          py: 1.25,
          flex: 1,
          minHeight: 0,
        }}
      >
        {hasWalkthrough ? (
          <Section
            label={`Walkthrough · ${stepIdx + 1} / ${walkthrough.length}`}
          >
            <Box sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>
              {currentStep?.title}
            </Box>
            <Box
              sx={{
                fontSize: 12.5,
                lineHeight: 1.45,
                color: theme.palette.text.secondary,
              }}
            >
              {currentStep?.body}
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 0.75,
                mt: 1,
                justifyContent: "flex-end",
              }}
            >
              <StepButton
                disabled={stepIdx === 0}
                onClick={() => onStep(stepIdx - 1)}
              >
                Prev
              </StepButton>
              <StepButton
                disabled={stepIdx >= walkthrough.length - 1}
                onClick={() => onStep(stepIdx + 1)}
              >
                Next
              </StepButton>
            </Box>
          </Section>
        ) : null}

        {hasPresets ? (
          <PresetSections
            presets={presets}
            activePresetId={activePresetId}
            onPreset={onPreset}
          />
        ) : null}

        {hasControls ? (
          <Section label="Controls">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {controls}
            </Box>
          </Section>
        ) : null}

        {!hasWalkthrough && !hasPresets && !hasControls ? (
          <Box
            sx={{
              fontSize: 12.5,
              color: theme.palette.text.secondary,
              fontStyle: "italic",
            }}
          >
            No tuning options are configured for this chart yet.
          </Box>
        ) : null}
      </Box>

      {onReset || onCopy ? (
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            px: 1.75,
            py: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {onReset ? (
            <FooterButton variant="secondary" onClick={onReset}>
              Reset
            </FooterButton>
          ) : null}
          {onCopy ? (
            <FooterButton variant="primary" onClick={onCopy}>
              {copied ? "Copied!" : "Copy state"}
            </FooterButton>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}

/**
 * Render presets in groups. Presets with a shared `group` string are
 * rendered under a single heading in the order they first appear; presets
 * without a group fall back into a default "Preset views" section. Groups
 * are rendered in first-seen order so the consumer controls the narrative
 * (Start → Browse → Analyze, etc.).
 */
function PresetSections({
  presets,
  activePresetId,
  onPreset,
}: {
  presets: TunerPreset[]
  activePresetId: string | null
  onPreset: (p: TunerPreset) => void
}) {
  const groups = useMemo(() => {
    const order: string[] = []
    const bucket = new Map<string, TunerPreset[]>()
    for (const p of presets) {
      const key = p.group ?? "__default__"
      if (!bucket.has(key)) {
        bucket.set(key, [])
        order.push(key)
      }
      bucket.get(key)!.push(p)
    }
    return order.map((key) => ({
      key,
      label: key === "__default__" ? "Preset views" : key,
      items: bucket.get(key)!,
    }))
  }, [presets])

  return (
    <>
      {groups.map((g) => (
        <Section key={g.key} label={g.label}>
          <PresetGrid
            presets={g.items}
            activePresetId={activePresetId}
            onPreset={onPreset}
          />
        </Section>
      ))}
    </>
  )
}

function PresetGrid({
  presets,
  activePresetId,
  onPreset,
}: {
  presets: TunerPreset[]
  activePresetId: string | null
  onPreset: (p: TunerPreset) => void
}) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0.75,
      }}
    >
      {presets.map((p) => {
        const active = p.id === activePresetId
        return (
          <Box
            key={p.id}
            component="button"
            type="button"
            onClick={() => onPreset(p)}
            title={p.description}
            sx={{
              textAlign: "left",
              px: 1,
              py: 0.75,
              borderRadius: 1,
              border: `1px solid ${
                active ? theme.palette.primary.main : theme.palette.divider
              }`,
              background: active
                ? theme.palette.action.selected
                : "transparent",
              color: theme.palette.text.primary,
              cursor: "pointer",
              fontSize: 12,
              lineHeight: 1.3,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Box sx={{ fontWeight: 600 }}>{p.label}</Box>
            {p.description ? (
              <Box
                sx={{
                  mt: 0.25,
                  fontSize: 11,
                  color: theme.palette.text.secondary,
                }}
              >
                {p.description}
              </Box>
            ) : null}
          </Box>
        )
      })}
    </Box>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const theme = useTheme()
  return (
    <Box sx={{ mb: 1.5, "&:last-child": { mb: 0 } }}>
      <Box
        sx={{
          fontSize: 10,
          letterSpacing: 1,
          fontWeight: 700,
          textTransform: "uppercase",
          color: theme.palette.text.secondary,
          opacity: 0.8,
          mb: 0.75,
        }}
      >
        {label}
      </Box>
      {children}
    </Box>
  )
}

function StepButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  const theme = useTheme()
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        px: 1.25,
        py: 0.5,
        borderRadius: 0.75,
        border: `1px solid ${theme.palette.divider}`,
        background: "transparent",
        color: theme.palette.text.primary,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 11,
        opacity: disabled ? 0.4 : 1,
        "&:hover": {
          backgroundColor: disabled
            ? "transparent"
            : theme.palette.action.hover,
        },
      }}
    >
      {children}
    </Box>
  )
}

function FooterButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode
  onClick: () => void
  variant: "primary" | "secondary"
}) {
  const theme = useTheme()
  const primary = variant === "primary"
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        flex: 1,
        px: 1.25,
        py: 0.5,
        borderRadius: 0.75,
        border: primary ? "none" : `1px solid ${theme.palette.divider}`,
        background: primary ? theme.palette.primary.main : "transparent",
        color: primary
          ? theme.palette.primary.contrastText
          : theme.palette.text.primary,
        cursor: "pointer",
        fontSize: 11,
        fontWeight: primary ? 600 : 500,
        "&:hover": {
          backgroundColor: primary
            ? theme.palette.primary.dark
            : theme.palette.action.hover,
        },
      }}
    >
      {children}
    </Box>
  )
}
