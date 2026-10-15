/**
 * captureMapImage - save what the Explore map panel shows as one JPEG:
 * the Mapbox WebGL canvas (basemap, polygon layers) with the DOM marker
 * layer (points, labels) composited on top, cropped to the visible panel,
 * with the Mapbox / OpenStreetMap credit drawn in. The caption, tier key
 * and direction key are part of the share card around the image, which is
 * the exported figure.
 *
 * The map has no preserveDrawingBuffer, so the canvas is read inside a
 * `render` callback after the map is idle. Throws on: not idle in time, a
 * blank canvas, the camera moving mid-capture, or an image over budget.
 * Side effects: one repaint; detached canvases; listeners removed on exit.
 */

import { toCanvas } from "html-to-image"
import type { MapboxGLMap } from "@repo/map"
import { useMapStore } from "../../../../map/store"
import { isUniformImage, mapExportSize, mapPanelCrop } from "./mapCrop"

/** Largest data URL a saved map may add to the share tray (about 330 KB). */
export const MAP_IMAGE_MAX_CHARS = 450_000

const ENCODINGS = [
  { maxWidth: 900, quality: 0.85 },
  { maxWidth: 700, quality: 0.75 },
  { maxWidth: 560, quality: 0.65 },
]
const WAIT_MS = 8000
const ATTRIBUTION = "© Mapbox © OpenStreetMap"

function waitFor(
  map: MapboxGLMap,
  event: "idle" | "render",
  onFire: () => void,
  trigger?: () => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handler = () => {
      window.clearTimeout(timer)
      try {
        onFire()
        resolve()
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }
    const timer = window.setTimeout(() => {
      map.off(event, handler)
      reject(
        new Error(
          `the map did not ${event === "idle" ? "finish loading" : "repaint"} in time`,
        ),
      )
    }, WAIT_MS)
    map.once(event, handler)
    trigger?.()
  })
}

/** Everything that decides the exported pixels besides the outcome:
 *  camera, canvas size, basemap style, and the panel's on-screen box. */
function captureStateKey(map: MapboxGLMap, panelEl: HTMLElement): string {
  const c = map.getCenter()
  const r = panelEl.getBoundingClientRect()
  const canvas = map.getCanvas()
  return [
    c.lng.toFixed(6),
    c.lat.toFixed(6),
    map.getZoom().toFixed(4),
    map.getBearing().toFixed(2),
    map.getPitch().toFixed(2),
    canvas.width,
    canvas.height,
    useMapStore.getState().mapStyle,
    map.isStyleLoaded() ? "loaded" : "loading",
    Math.round(r.left),
    Math.round(r.top),
    Math.round(r.width),
    Math.round(r.height),
  ].join(",")
}

/** Greedy word wrap into at most maxLines lines; the last line ends with
 *  an ellipsis if the text does not fit. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last && ctx.measureText(`${last}...`).width > maxWidth) {
    last = last.slice(0, -1)
  }
  kept[maxLines - 1] = `${last}...`
  return kept
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = src
  await img.decode()
  return img
}

export async function captureMapImage(
  map: MapboxGLMap,
  panelEl: HTMLElement,
  /** One line naming what the map shows, drawn across the top so the
   *  image still says what it is if it ever leaves its card */
  captionText: string,
): Promise<{ dataUrl: string; width: number; height: number }> {
  // The outcome click eases the camera; never read a frame mid-flight.
  if (map.isMoving() || !(map.loaded() && map.areTilesLoaded())) {
    await waitFor(map, "idle", () => undefined)
  }
  const stateAtStart = captureStateKey(map, panelEl)
  const container = map.getContainer()
  const glCanvas = map.getCanvas()
  const ratio = glCanvas.width / container.clientWidth
  const crop = mapPanelCrop(
    panelEl.getBoundingClientRect(),
    container.getBoundingClientRect(),
    ratio,
  )
  if (!crop) throw new Error("the map panel is not visible")

  let glUrl = ""
  await waitFor(
    map,
    "render",
    () => {
      glUrl = glCanvas.toDataURL("image/png")
    },
    () => map.triggerRepaint(),
  )
  const glImage = await loadImage(glUrl)

  // Blank check on the cropped region.
  const probe = document.createElement("canvas")
  probe.width = Math.min(crop.sw, 200)
  probe.height = Math.min(crop.sh, 200)
  const pctx = probe.getContext("2d")
  if (!pctx) throw new Error("no 2D canvas context")
  pctx.drawImage(
    glImage,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    probe.width,
    probe.height,
  )
  if (isUniformImage(pctx.getImageData(0, 0, probe.width, probe.height).data)) {
    throw new Error("the map image came back blank")
  }

  // Let React commit any markers set in the same tick as the paint signal.
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  const overlay = await toCanvas(map.getCanvasContainer(), {
    width: container.clientWidth,
    height: container.clientHeight,
    style: {
      width: `${container.clientWidth}px`,
      height: `${container.clientHeight}px`,
    },
    pixelRatio: ratio,
    cacheBust: true,
    skipFonts: true,
    filter: (node) =>
      !(node instanceof HTMLCanvasElement) &&
      !(
        node instanceof HTMLElement && node.classList.contains("mapboxgl-popup")
      ),
  })
  if (captureStateKey(map, panelEl) !== stateAtStart) {
    throw new Error("the map moved or resized while saving; try again")
  }

  for (const enc of ENCODINGS) {
    const size = mapExportSize(crop, enc.maxWidth)
    const out = document.createElement("canvas")
    out.width = size.width
    out.height = size.height
    const ctx = out.getContext("2d")
    if (!ctx) throw new Error("no 2D canvas context")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size.width, size.height)
    ctx.drawImage(
      glImage,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      size.width,
      size.height,
    )
    ctx.drawImage(
      overlay,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      size.width,
      size.height,
    )
    ctx.font = "bold 12px sans-serif"
    const lines = wrapText(ctx, captionText, size.width - 12, 3)
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
    ctx.fillRect(0, 0, size.width, 8 + lines.length * 15)
    ctx.fillStyle = "#3a4574"
    lines.forEach((line, i) => ctx.fillText(line, 6, 16 + i * 15))
    ctx.font = "11px sans-serif"
    const textW = ctx.measureText(ATTRIBUTION).width
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fillRect(size.width - textW - 10, size.height - 18, textW + 10, 18)
    ctx.fillStyle = "#333333"
    ctx.fillText(ATTRIBUTION, size.width - textW - 5, size.height - 5)
    const dataUrl = out.toDataURL("image/jpeg", enc.quality)
    if (dataUrl.length <= MAP_IMAGE_MAX_CHARS) {
      return { dataUrl, ...size }
    }
  }
  throw new Error("the map image is too large to save")
}
