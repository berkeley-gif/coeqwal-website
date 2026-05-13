/**
 * Resolve a CSS length expression to its current pixel value.
 *
 * Useful when a theme token is a `clamp(...)` / `vw` / `vh` string and a
 * caller needs an integer pixel value at click time (e.g. scroll-offset
 * math that depends on the viewport-resolved size of `theme.layout.panel.insetY`).
 *
 * Mounts a hidden probe `div`, sets its `height` to the expression, reads
 * the bounding rect, and removes the probe. Returns `fallback` on SSR or
 * when measurement fails.
 *
 * @example
 * const insetYPx = resolveCssLengthPx(theme.layout.panel.insetY, 24)
 * scrollTo({ top: target.offsetTop - theme.layout.headerHeight + insetYPx })
 */
export function resolveCssLengthPx(cssExpr: string, fallback: number): number {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback
  }
  try {
    const probe = document.createElement("div")
    probe.style.position = "absolute"
    probe.style.visibility = "hidden"
    probe.style.pointerEvents = "none"
    probe.style.height = cssExpr
    document.body.appendChild(probe)
    const px = probe.getBoundingClientRect().height
    document.body.removeChild(probe)
    return Number.isFinite(px) ? px : fallback
  } catch {
    return fallback
  }
}
