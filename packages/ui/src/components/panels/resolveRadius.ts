/**
 * resolveRadius - shared helper for panel border-radius props.
 *
 * Accepts either a token key on `theme.borderRadius` (e.g. "md", "lg"),
 * a raw number (interpreted as CSS px when applied via MUI sx), or a raw
 * CSS string (e.g. "20px", "1.5rem", "clamp(12px, 2vw, 24px)").
 *
 * Returns undefined when the input is undefined so callers can spread
 * the result into sx without forcing a radius.
 */

export type RadiusTokenKey =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "pill"
  | "circle"

export type RadiusValue = RadiusTokenKey | number | string

export type RadiusTokens = Record<RadiusTokenKey, string>

export function resolveRadius(
  value: RadiusValue | undefined,
  tokens: RadiusTokens,
): string | number | undefined {
  if (value === undefined) return undefined
  if (typeof value === "number") return value
  if (Object.prototype.hasOwnProperty.call(tokens, value)) {
    return tokens[value as RadiusTokenKey]
  }
  return value
}

/**
 * Inset config for panels. `true` uses a sensible responsive default.
 * `false` / undefined = no inset (full-bleed).
 */
export type PanelInset =
  | boolean
  | {
      x?: number | string
      y?: number | string
    }

/** Responsive default used when `inset={true}` (no explicit config). */
export const DEFAULT_PANEL_INSET_X = "clamp(16px, 3vw, 40px)"
export const DEFAULT_PANEL_INSET_Y: number | string = 0

export function resolveInset(
  inset: PanelInset | undefined,
): { x: number | string; y: number | string } | null {
  if (!inset) return null
  if (inset === true) {
    return { x: DEFAULT_PANEL_INSET_X, y: DEFAULT_PANEL_INSET_Y }
  }
  return {
    x: inset.x ?? DEFAULT_PANEL_INSET_X,
    y: inset.y ?? DEFAULT_PANEL_INSET_Y,
  }
}
