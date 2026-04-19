"use client"

/**
 * PanelTuner — floating widget for live tuning of rounded-panel border
 * radius and inset values across the site.
 *
 * Writes three CSS custom properties on `<html>` — defined in
 * `./cssVars` and consumed by apps via `tunerRadius()`, `tunerInsetX()`,
 * and `tunerInsetY()`:
 *
 *   --panel-radius
 *   --panel-inset-x
 *   --panel-inset-y
 *
 * Visibility: hidden by default. Press Cmd+K (Mac) / Ctrl+K (Win/Linux) to
 * summon the panel; Esc or the same shortcut closes it. Selections persist
 * in localStorage across reloads so a design team can pick a setting once
 * and review the whole site with it.
 *
 * No production gating — the component renders nothing until the shortcut
 * is pressed, so it's safe to mount in any build. The shortcut is
 * effectively a secret handshake for the design/review workflow.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  PANEL_INSET_X_VAR,
  PANEL_INSET_Y_VAR,
  PANEL_RADIUS_VAR,
} from "./cssVars"

const STORAGE_KEY = "coeqwal:panel-tuner:v1"

type Values = {
  radius: number
  insetX: number
  insetY: number
}

type Preset = {
  id: string
  label: string
  description: string
  values: Values
}

const PRESETS: Preset[] = [
  {
    id: "square",
    label: "Square",
    description: "No rounding, full-bleed",
    values: { radius: 0, insetX: 0, insetY: 0 },
  },
  {
    id: "subtle",
    label: "Subtle",
    description: "Gentle 8px corners, small frame",
    values: { radius: 8, insetX: 16, insetY: 8 },
  },
  {
    id: "soft",
    label: "Soft",
    description: "16px corners, medium frame",
    values: { radius: 16, insetX: 24, insetY: 14 },
  },
  {
    id: "rounded",
    label: "Rounded",
    description: "24px corners, balanced frame (current default)",
    values: { radius: 24, insetX: 32, insetY: 18 },
  },
  {
    id: "prominent",
    label: "Prominent",
    description: "32px corners, generous frame",
    values: { radius: 32, insetX: 40, insetY: 24 },
  },
  {
    id: "bold",
    label: "Bold",
    description: "40px corners, large frame",
    values: { radius: 40, insetX: 56, insetY: 36 },
  },
  {
    id: "tight-big",
    label: "Tight+Big",
    description: "Big 32px corners, almost-touching frame",
    values: { radius: 32, insetX: 8, insetY: 4 },
  },
  {
    id: "full-bleed-rounded",
    label: "Full-bleed",
    description: "Rounded corners, no frame (edges touch viewport)",
    values: { radius: 24, insetX: 0, insetY: 0 },
  },
]

const DEFAULT_VALUES: Values = PRESETS.find((p) => p.id === "rounded")!.values

function applyToDOM(values: Values) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.style.setProperty(PANEL_RADIUS_VAR, `${values.radius}px`)
  root.style.setProperty(PANEL_INSET_X_VAR, `${values.insetX}px`)
  root.style.setProperty(PANEL_INSET_Y_VAR, `${values.insetY}px`)
}

function clearFromDOM() {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.style.removeProperty(PANEL_RADIUS_VAR)
  root.style.removeProperty(PANEL_INSET_X_VAR)
  root.style.removeProperty(PANEL_INSET_Y_VAR)
}

function readFromStorage(): Values | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Values>
    if (
      typeof parsed.radius === "number" &&
      typeof parsed.insetX === "number" &&
      typeof parsed.insetY === "number"
    ) {
      return parsed as Values
    }
  } catch {
    // ignore
  }
  return null
}

function writeToStorage(values: Values) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
  } catch {
    // ignore
  }
}

function clearStorage() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export default function PanelTuner() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Values>(DEFAULT_VALUES)
  const [copied, setCopied] = useState(false)

  // Hydrate persisted values (and apply them) on mount.
  useEffect(() => {
    setMounted(true)
    const stored = readFromStorage()
    if (stored) {
      setValues(stored)
      applyToDOM(stored)
    }
  }, [])

  // Global keyboard listener: Cmd/Ctrl+K toggles, Esc closes.
  useEffect(() => {
    if (typeof document === "undefined") return
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"
      if (isToggle) {
        e.preventDefault()
        e.stopPropagation()
        setOpen((prev) => !prev)
        return
      }
      if (e.key === "Escape") {
        setOpen((prev) => (prev ? false : prev))
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const update = useCallback((next: Values) => {
    setValues(next)
    applyToDOM(next)
    writeToStorage(next)
  }, [])

  const reset = useCallback(() => {
    clearStorage()
    clearFromDOM()
    setValues(DEFAULT_VALUES)
  }, [])

  const copySnippet = useCallback(() => {
    const snippet = `/* Panel values */
${PANEL_RADIUS_VAR}: ${values.radius}px;
${PANEL_INSET_X_VAR}: ${values.insetX}px;
${PANEL_INSET_Y_VAR}: ${values.insetY}px;

// Or as props:
borderRadius: "${values.radius}px"
inset: { x: "${values.insetX}px", y: "${values.insetY}px" }`
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(snippet).then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1400)
      })
    }
  }, [values])

  const activePresetId = useMemo(() => {
    return (
      PRESETS.find(
        (p) =>
          p.values.radius === values.radius &&
          p.values.insetX === values.insetX &&
          p.values.insetY === values.insetY,
      )?.id ?? null
    )
  }, [values])

  if (!mounted) return null
  if (!open) return null

  return (
    <div style={panelStyle} role="dialog" aria-label="Panel tuner">
      <div style={headerRowStyle}>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
          PANEL TUNER
          <span style={hintStyle}>Cmd/Ctrl+K</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close panel tuner"
          style={closeButtonStyle}
        >
          ×
        </button>
      </div>

      <div style={sectionLabelStyle}>Presets</div>
      <div style={presetGridStyle}>
        {PRESETS.map((p) => {
          const active = p.id === activePresetId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => update(p.values)}
              title={p.description}
              style={{
                ...presetButtonStyle,
                ...(active ? presetButtonActiveStyle : null),
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <div style={sectionLabelStyle}>Fine-tune</div>
      <Slider
        label="Radius"
        value={values.radius}
        min={0}
        max={80}
        step={1}
        onChange={(v) => update({ ...values, radius: v })}
      />
      <Slider
        label="Inset X"
        value={values.insetX}
        min={0}
        max={120}
        step={1}
        onChange={(v) => update({ ...values, insetX: v })}
      />
      <Slider
        label="Inset Y"
        value={values.insetY}
        min={0}
        max={80}
        step={1}
        onChange={(v) => update({ ...values, insetY: v })}
      />

      <div style={footerRowStyle}>
        <button type="button" onClick={reset} style={secondaryButtonStyle}>
          Reset
        </button>
        <button type="button" onClick={copySnippet} style={primaryButtonStyle}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label style={sliderLabelStyle}>
      <span style={sliderLabelTextStyle}>
        <span>{label}</span>
        <span style={sliderValueStyle}>{value}px</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderInputStyle}
      />
    </label>
  )
}

/* ---------------------------------------------------------------------- */
/* Inline styles (kept here so the widget has zero theme dependency and   */
/* can't be accidentally affected by global styling changes).             */
/* ---------------------------------------------------------------------- */

const panelStyle: React.CSSProperties = {
  position: "fixed",
  right: 16,
  bottom: 16,
  zIndex: 2147483647,
  width: 260,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15, 18, 24, 0.94)",
  color: "white",
  font: "12px/1.3 system-ui, sans-serif",
  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  backdropFilter: "blur(10px)",
}

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
}

const hintStyle: React.CSSProperties = {
  marginLeft: 8,
  fontWeight: 400,
  fontSize: 10,
  opacity: 0.55,
  letterSpacing: 0.3,
}

const closeButtonStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 6,
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: "22px",
  padding: 0,
}

const sectionLabelStyle: React.CSSProperties = {
  marginTop: 6,
  marginBottom: 4,
  opacity: 0.55,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
}

const presetGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 4,
  marginBottom: 4,
}

const presetButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "6px 8px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 11,
  textAlign: "left",
}

const presetButtonActiveStyle: React.CSSProperties = {
  background: "rgba(90, 160, 255, 0.25)",
  borderColor: "rgba(90, 160, 255, 0.6)",
}

const sliderLabelStyle: React.CSSProperties = {
  display: "block",
  marginTop: 6,
}

const sliderLabelTextStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 2,
}

const sliderValueStyle: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  opacity: 0.75,
  fontSize: 11,
}

const sliderInputStyle: React.CSSProperties = {
  width: "100%",
  accentColor: "#5aa0ff",
}

const footerRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 10,
}

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 10px",
  border: "none",
  borderRadius: 6,
  background: "#5aa0ff",
  color: "#0a1020",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 11,
}

const secondaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 10px",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 6,
  background: "transparent",
  color: "white",
  cursor: "pointer",
  fontSize: 11,
}
