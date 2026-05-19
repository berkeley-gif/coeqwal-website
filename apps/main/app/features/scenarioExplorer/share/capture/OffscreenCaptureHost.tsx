"use client"

/**
 * OffscreenCaptureHost
 *
 * Generic capture pipeline shared by every visualization that
 * supports SVG capture. Mounts a snapshot component (one of the
 * `*Snapshot` wrappers from `@repo/viz`, or any component that
 * accepts an `onReady` callback) inside a hidden, fixed-size,
 * off-screen container, awaits the chart's `onReady` signal, then
 * serializes the rendered `<svg>` and rasterizes a PNG.
 *
 * The host is intentionally chart-agnostic. Callers pass a
 * function that returns the React element to render. The host
 * supplies the host div, the React root, the timeout, the
 * post-paint frame insurance, the SVG clone + style inlining, and
 * the optional PNG rasterization. Per-variant capture functions
 * live in `share/capture/captureRegistry.ts` and call this host.
 *
 * P2.4 will add `captureDoctor` warnings on slow / failed
 * captures; the hooks are wired into this host so chart-specific
 * code never has to think about diagnostics.
 */

import { createRoot } from "react-dom/client"
import { ThemeProvider, type Theme } from "@repo/ui/mui"
import {
  inlineStyles,
  rasterizeSvgClone,
  composeLiveSvgsToString,
  rasterizeSvgString,
} from "../../tools/panels/dataInDepth/utils/exportUtils"
import { captureDoctor } from "./captureDoctor"

const DEFAULT_CAPTURE_SIZE = 600
const READY_TIMEOUT_MS = 4000

export interface OffscreenCaptureInput {
  /**
   * Render the snapshot component. The host passes back an
   * `onReady` callback the snapshot must invoke once after its
   * first render has committed (RadarPlot, ResilienceHeatmap,
   * etc. all fire this in a requestAnimationFrame after their
   * draw completes).
   */
  render: (onReady: () => void) => React.ReactElement
  /**
   * MUI theme. Threaded through ThemeProvider so any theme-aware
   * children render with the same styles as the live mount.
   */
  theme: Theme
  /** Pixel width of the off-screen container. Default 600. */
  width?: number
  /** Pixel height of the off-screen container. Default 600. */
  height?: number
  /**
   * Tag the host div with a data attribute so dev-mode tooling
   * (P2.4 captureDoctor) can identify which capture each
   * outstanding host belongs to. Free-form, e.g.
   * "radar:single-scenario", "resilience:panel".
   */
  captureKind?: string
  /**
   * Optional cleanup applied to the cloned SVG before
   * serialization. Use to prune chart-specific placeholder
   * elements (e.g. RadarPlot's `g.axis-label-detail`) that exist
   * only for live interaction. Receives a clone, mutate freely.
   */
  pruneClone?: (clone: SVGSVGElement) => void
  /**
   * Whether to also rasterize the SVG into a PNG. Defaults to
   * `true` for backward compatibility with cards that read
   * `cachedImageDataUrl`. P2 cards prefer `cachedSvg` and can opt
   * out by setting `false` to skip the canvas paint.
   */
  rasterize?: boolean
  /**
   * How to assemble the captured SVG.
   * - `single` (default): expect exactly one `<svg>` in the host
   *   and serialize it. Used by single-chart variants (radar,
   *   equity TierGrid, resilience tile).
   * - `compose`: compose every descendant `<svg>` into one
   *   stand-alone SVG sized to the host. Used by composed-React
   *   variants like the resilience panel (small-multiples grid)
   *   and the bar-chart row (strip of glyphs).
   */
  mode?: "single" | "compose"
  /**
   * Background fill applied to composed SVGs. Ignored in `single`
   * mode. Defaults to white.
   */
  backgroundColor?: string
}

export interface OffscreenCaptureResult {
  /** Serialized SVG document with computed styles inlined. */
  svg: string
  /**
   * PNG data URL when `rasterize` was true (default). Empty
   * string when `rasterize` was false.
   */
  dataUrl: string
}

/**
 * Run an off-screen render and capture the result. Resolves
 * with the serialized SVG and (optionally) a rasterized PNG.
 * Rejects when the snapshot fails to fire `onReady` within
 * `READY_TIMEOUT_MS` or when no `<svg>` is found in the host.
 */
export async function offscreenCapture(
  input: OffscreenCaptureInput,
): Promise<OffscreenCaptureResult> {
  const width = input.width ?? DEFAULT_CAPTURE_SIZE
  const height = input.height ?? DEFAULT_CAPTURE_SIZE
  const rasterize = input.rasterize ?? true

  const host = document.createElement("div")
  host.style.position = "fixed"
  host.style.left = "-100000px"
  host.style.top = "0"
  host.style.width = `${width}px`
  host.style.height = `${height}px`
  host.style.pointerEvents = "none"
  host.style.opacity = "0"
  host.setAttribute("data-offscreen-capture", "true")
  if (input.captureKind) {
    host.setAttribute("data-capture-kind", input.captureKind)
  }
  document.body.appendChild(host)

  const root = createRoot(host)
  const doctor = captureDoctor.start(input.captureKind)

  const ready = new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      // Common causes are an empty-data render path that forgot to fire
      // onReady, or a snapshot whose own first paint never settled. The
      // breadcrumbs below help a future developer triage which case it
      // is without needing to add ad-hoc logging.
      const svgPresent = host.querySelector("svg") !== null
      const renderedHtmlLength = host.innerHTML.length
      reject(
        new Error(
          `offscreenCapture(${input.captureKind ?? "unknown"}): onReady did not fire within ${READY_TIMEOUT_MS}ms ` +
            `(svgPresent=${svgPresent}, renderedHtmlLength=${renderedHtmlLength}). ` +
            `Likely causes: snapshot bailed early without firing onReady (empty data, zero dims), ` +
            `or its first paint never settled. Snapshot wrappers must fire onReady on every render path.`,
        ),
      )
    }, READY_TIMEOUT_MS)

    root.render(
      <ThemeProvider theme={input.theme}>
        {input.render(() => {
          window.clearTimeout(timer)
          captureDoctor.ready(doctor)
          resolve()
        })}
      </ThemeProvider>,
    )
  })

  try {
    await ready

    // One more frame for any post-paint layout commits to land.
    // Cheap insurance against a torn paint when the chart fires
    // onReady from a deep render path.
    await new Promise<void>((r) => requestAnimationFrame(() => r()))

    const mode = input.mode ?? "single"

    if (mode === "compose") {
      const svg = composeLiveSvgsToString(host, {
        backgroundColor: input.backgroundColor,
      })
      let dataUrl = ""
      if (rasterize) {
        const result = await rasterizeSvgString(svg, width, height, {
          backgroundColor: input.backgroundColor,
        })
        dataUrl = result.dataUrl
      }
      captureDoctor.success(doctor)
      return { svg, dataUrl }
    }

    const svgEl = host.querySelector("svg") as SVGSVGElement | null
    if (!svgEl) {
      throw new Error(
        `offscreenCapture(${input.captureKind ?? "unknown"}): rendered <svg> not found`,
      )
    }

    const clone = svgEl.cloneNode(true) as SVGSVGElement
    inlineStyles(clone, svgEl)

    input.pruneClone?.(clone)

    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    clone.setAttribute("width", String(width))
    clone.setAttribute("height", String(height))
    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", `0 0 ${width} ${height}`)
    }

    // Serialize from a separate copy so rasterizeSvgClone can
    // mutate its own clone (it adopts CSS into <style> nodes,
    // injects xmlns, etc).
    const serializeClone = clone.cloneNode(true) as SVGSVGElement
    const svg = new XMLSerializer().serializeToString(serializeClone)

    let dataUrl = ""
    if (rasterize) {
      const result = await rasterizeSvgClone(clone, width, height)
      dataUrl = result.dataUrl
    }

    captureDoctor.success(doctor)
    return { svg, dataUrl }
  } catch (err) {
    captureDoctor.fail(doctor, err)
    throw err
  } finally {
    root.unmount()
    host.remove()
  }
}
