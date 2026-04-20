/**
 * Shared CSS-variable contract between the `PanelTuner` widget and any app
 * that wants its rounded inset panels to be live-tunable.
 *
 * Panels reference these variables via `var(<name>, <fallback>)`. The tuner
 * writes to them on `document.documentElement`. Fallbacks kick in whenever
 * the tuner hasn't initialised (SSR, production before summoning, etc.), so
 * the page always renders with sensible defaults.
 *
 * Apps should prefer the helpers (`tunerRadius()`, `tunerInsetX()`,
 * `tunerInsetY()`) over hand-writing `var()` strings so the contract stays
 * centralised. Supplying a custom fallback is rarely necessary; the defaults
 * match the current design baseline.
 */

export const PANEL_RADIUS_VAR = "--panel-radius"
export const PANEL_INSET_X_VAR = "--panel-inset-x"
export const PANEL_INSET_Y_VAR = "--panel-inset-y"

/** CSS-ready `var(--panel-radius, <fallback>)`. Drop into sx / borderRadius. */
export const tunerRadius = (fallback: string = "24px"): string =>
  `var(${PANEL_RADIUS_VAR}, ${fallback})`

/** CSS-ready `var(--panel-inset-x, <fallback>)`. Drop into sx / px / left-right padding. */
export const tunerInsetX = (
  fallback: string = "clamp(16px, 3vw, 40px)",
): string => `var(${PANEL_INSET_X_VAR}, ${fallback})`

/** CSS-ready `var(--panel-inset-y, <fallback>)`. Drop into sx / py / top-bottom padding or `top` offsets. */
export const tunerInsetY = (
  fallback: string = "clamp(16px, 3vw, 32px)",
): string => `var(${PANEL_INSET_Y_VAR}, ${fallback})`

/**
 * Measure the current computed value of a tuner CSS variable in pixels.
 *
 * Uses a throwaway `div` so `clamp(...)` / `vw` / `vh` fallbacks resolve
 * correctly via the browser's style engine. Returns `fallback` on SSR or
 * when measurement fails.
 */
const measureCssVarPx = (
  varName: string,
  fallback: number,
  cssFallback: string,
): number => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback
  }
  try {
    const probe = document.createElement("div")
    probe.style.position = "absolute"
    probe.style.visibility = "hidden"
    probe.style.pointerEvents = "none"
    probe.style.height = `var(${varName}, ${cssFallback})`
    document.body.appendChild(probe)
    const px = probe.getBoundingClientRect().height
    document.body.removeChild(probe)
    return Number.isFinite(px) ? px : fallback
  } catch {
    return fallback
  }
}

/** Current value of `--panel-inset-y` in pixels (live, reflects tuner edits). */
export const tunerInsetYPx = (fallback: number = 24): number =>
  measureCssVarPx(PANEL_INSET_Y_VAR, fallback, "clamp(16px, 3vw, 32px)")

/** Current value of `--panel-inset-x` in pixels (live, reflects tuner edits). */
export const tunerInsetXPx = (fallback: number = 28): number =>
  measureCssVarPx(PANEL_INSET_X_VAR, fallback, "clamp(16px, 3vw, 40px)")
