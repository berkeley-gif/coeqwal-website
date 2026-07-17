/**
 * SVG capture, compositing, and rasterization helpers
 *
 * Share cards are exported either from a single live `<svg>` or from a
 * DOM subtree containing many small `<svg>` glyphs. These helpers
 * clone the source, inline its computed styles so it renders outside
 * the document's stylesheets, and draw it onto an offscreen canvas to
 * produce a PNG blob + data URL. `composeLiveSvgsToString` and
 * `embedFontStylesInSvg` cover the standalone-SVG output path.
 */

import { themeValues } from "@repo/ui/themes/theme"

/**
 * Inline all computed styles on an SVG clone so it renders identically when
 * serialised as a standalone image (outside the document's stylesheets).
 */
export function inlineStyles(clone: SVGElement, original: SVGElement) {
  const computed = window.getComputedStyle(original)
  const dominated = [
    "fill",
    "stroke",
    "stroke-width",
    "stroke-opacity",
    "fill-opacity",
    "opacity",
    "font-family",
    "font-size",
    "font-weight",
    "text-anchor",
    "dominant-baseline",
    "letter-spacing",
    "visibility",
    "display",
  ]
  for (const prop of dominated) {
    const val = computed.getPropertyValue(prop)
    if (val) clone.style.setProperty(prop, val)
  }

  const origChildren = original.children
  const cloneChildren = clone.children
  for (let i = 0; i < origChildren.length; i++) {
    if (origChildren[i] instanceof SVGElement && cloneChildren[i]) {
      inlineStyles(
        cloneChildren[i] as SVGElement,
        origChildren[i] as SVGElement,
      )
    }
  }
}

/**
 * Capture an SVG element as a rasterised PNG blob + base64 data URL.
 *
 * The SVG is cloned, its computed styles are inlined, and it is drawn onto
 * an offscreen canvas at the requested scale.
 */
export async function captureSvgToBlob(
  svgElement: SVGSVGElement,
  options: { scale?: number; backgroundColor?: string } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  const { scale = 2, backgroundColor = themeValues.palette.common.white } =
    options

  const clone = svgElement.cloneNode(true) as SVGSVGElement
  inlineStyles(clone, svgElement)

  // Use getBoundingClientRect for reliable pixel dimensions. BaseVal can be
  // 0 when the SVG uses percentage-based sizing (style="width:100%").
  const rect = svgElement.getBoundingClientRect()
  const svgWidth = rect.width || svgElement.clientWidth || 600
  const svgHeight = rect.height || svgElement.clientHeight || 600

  // Strip percentage/relative sizing from the clone so the standalone SVG
  // renders at the correct pixel dimensions when loaded as an image.
  clone.removeAttribute("style")
  clone.setAttribute("width", String(svgWidth))
  clone.setAttribute("height", String(svgHeight))
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)
  const svgDataUri =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString)

  const canvasWidth = svgWidth * scale
  const canvasHeight = svgHeight * scale

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas 2d context"))
        return
      }
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

      const dataUrl = canvas.toDataURL("image/png")
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob from SVG"))
            return
          }
          resolve({ blob, dataUrl })
        },
        "image/png",
        1.0,
      )
    }
    img.onerror = () => reject(new Error("Failed to load SVG as image"))
    img.src = svgDataUri
  })
}

/**
 * Rasterise an already-styled SVG clone to a PNG blob + data URL.
 *
 * To be used when we've already called `inlineStyles` and performed any
 * DOM surgery (e.g. pruning elements) on the clone. Pass the pixel
 * dimensions of the *original* on-screen SVG so the canvas is sized
 * correctly.
 */
export async function rasterizeSvgClone(
  clone: SVGSVGElement,
  width: number,
  height: number,
  options: { scale?: number; backgroundColor?: string } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  const { scale = 2, backgroundColor = themeValues.palette.common.white } =
    options

  clone.removeAttribute("style")
  clone.setAttribute("width", String(width))
  clone.setAttribute("height", String(height))
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`)
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)
  const svgDataUri =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString)

  const canvasWidth = width * scale
  const canvasHeight = height * scale

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas 2d context"))
        return
      }
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

      const dataUrl = canvas.toDataURL("image/png")
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob from SVG clone"))
            return
          }
          resolve({ blob, dataUrl })
        },
        "image/png",
        1.0,
      )
    }
    img.onerror = () => reject(new Error("Failed to load SVG clone as image"))
    img.src = svgDataUri
  })
}

/**
 * Capture a DOM element that contains one or more child SVGs by compositing
 * them onto a single canvas at their relative positions.  Works for the list
 * view outcome column (grid of SVG glyphs) as well as single-SVG containers.
 */
export async function captureElementToBlob(
  element: HTMLElement,
  options: { scale?: number; backgroundColor?: string } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  const { scale = 2, backgroundColor = themeValues.palette.common.white } =
    options
  const rect = element.getBoundingClientRect()
  const canvasW = rect.width * scale
  const canvasH = rect.height * scale

  const canvas = document.createElement("canvas")
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas 2d context")

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Skip any SVG nested inside an element explicitly marked to be excluded
  // from composite captures (e.g. share / expand action icons rendered on top
  // of the chart). This lets chart authors keep interactive glyphs out of
  // snapshot thumbnails without the utility needing to know about them.
  const svgs = Array.from(element.querySelectorAll("svg")).filter(
    (svg) => !svg.closest("[data-capture-exclude]"),
  )
  const serializer = new XMLSerializer()

  const drawPromises = svgs.map((svg) => {
    const clone = svg.cloneNode(true) as SVGSVGElement
    inlineStyles(clone, svg)
    const svgW = svg.clientWidth || svg.getBoundingClientRect().width
    const svgH = svg.clientHeight || svg.getBoundingClientRect().height
    clone.setAttribute("width", String(svgW))
    clone.setAttribute("height", String(svgH))
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

    const svgRect = svg.getBoundingClientRect()
    const offsetX = (svgRect.left - rect.left) * scale
    const offsetY = (svgRect.top - rect.top) * scale

    const uri =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(serializer.serializeToString(clone))

    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, offsetX, offsetY, svgW * scale, svgH * scale)
        resolve()
      }
      img.onerror = () =>
        reject(
          new Error(
            "Failed to load embedded SVG as image during composite capture",
          ),
        )
      img.src = uri
    })
  })

  await Promise.all(drawPromises)

  const dataUrl = canvas.toDataURL("image/png")
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob from element"))
          return
        }
        resolve({ blob, dataUrl })
      },
      "image/png",
      1.0,
    )
  })
}

/**
 * Standalone CSS that downloaded SVGs embed at the top of the
 * document
 *
 * The Typekit URL is fixed to the production kit. Bumping the
 * kit ID is a one-line change here. Subsetting the font binary
 * (the strict definition of "font subset") would require
 * fontkit + WOFF2 manipulation and is licensing-fraught with
 * Adobe Fonts, so decided to deliberately stop at the @import.
 */
const SHARE_SVG_FONT_CSS = `<style type="text/css"><![CDATA[
@import url("https://use.typekit.net/rxm7kha.css");
text { font-family: "neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif; }
]]></style>`

/**
 * Insert `SHARE_SVG_FONT_CSS` as the first child of the SVG root.
 * Operates on a serialized string by direct splicing (no DOM
 * round-trip) so the function stays cheap and does not lose any
 * vendor-specific attributes a parser might normalize away.
 *
 * Returns the original string unchanged when no `<svg ...>` opening
 * tag is found, so callers can pass arbitrary input without a
 * pre-check.
 */
export function embedFontStylesInSvg(svgString: string): string {
  const openTagMatch = svgString.match(/<svg\b[^>]*>/i)
  if (!openTagMatch) return svgString
  const insertAt = openTagMatch.index! + openTagMatch[0].length
  return (
    svgString.slice(0, insertAt) +
    SHARE_SVG_FONT_CSS +
    svgString.slice(insertAt)
  )
}

/**
 * Compose every descendant `<svg>` of `host` into one stand-alone
 * SVG document, preserving each child's pixel position relative to
 * the host. Used by composed-React share cards (bar-chart row,
 * resilience small-multiples) where the live DOM is a layout of
 * many small SVG glyphs rather than a single large SVG.
 *
 * Children inside `[data-capture-exclude]` are skipped, matching
 * `captureElementToBlob`. Each child SVG is cloned, its computed
 * styles are inlined, and it is wrapped in a `<g transform="translate(...)">`
 * sized to its own pixel rect.
 *
 * Returns the serialized composite. Pair with `rasterizeSvgString`
 * for PNG output, or persist directly as `cachedSvg`.
 */
export function composeLiveSvgsToString(
  host: HTMLElement,
  options: { backgroundColor?: string } = {},
): string {
  const { backgroundColor = themeValues.palette.common.white } = options
  const hostRect = host.getBoundingClientRect()
  const width = Math.max(1, Math.round(hostRect.width))
  const height = Math.max(1, Math.round(hostRect.height))

  const svgs = Array.from(host.querySelectorAll("svg")).filter(
    (svg) => !svg.closest("[data-capture-exclude]"),
  )

  // Build the composite via the DOM API so we get correct attribute
  // serialization and namespace handling, then serialize at the end.
  const SVG_NS = "http://www.w3.org/2000/svg"
  const wrapper = document.createElementNS(SVG_NS, "svg")
  wrapper.setAttribute("xmlns", SVG_NS)
  wrapper.setAttribute("width", String(width))
  wrapper.setAttribute("height", String(height))
  wrapper.setAttribute("viewBox", `0 0 ${width} ${height}`)

  const bg = document.createElementNS(SVG_NS, "rect")
  bg.setAttribute("x", "0")
  bg.setAttribute("y", "0")
  bg.setAttribute("width", String(width))
  bg.setAttribute("height", String(height))
  bg.setAttribute("fill", backgroundColor)
  wrapper.appendChild(bg)

  for (const svg of svgs) {
    const childRect = svg.getBoundingClientRect()
    const childW = Math.max(
      1,
      Math.round(childRect.width || svg.clientWidth || 0),
    )
    const childH = Math.max(
      1,
      Math.round(childRect.height || svg.clientHeight || 0),
    )
    if (childW <= 0 || childH <= 0) continue

    const clone = svg.cloneNode(true) as SVGSVGElement
    inlineStyles(clone, svg)
    clone.removeAttribute("style")
    clone.setAttribute("width", String(childW))
    clone.setAttribute("height", String(childH))
    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", `0 0 ${childW} ${childH}`)
    }
    clone.setAttribute("xmlns", SVG_NS)

    const offsetX = Math.round(childRect.left - hostRect.left)
    const offsetY = Math.round(childRect.top - hostRect.top)

    const group = document.createElementNS(SVG_NS, "g")
    group.setAttribute("transform", `translate(${offsetX}, ${offsetY})`)
    group.appendChild(clone)
    wrapper.appendChild(group)
  }

  return new XMLSerializer().serializeToString(wrapper)
}

/**
 * Rasterize a serialized SVG string to a PNG. Parses into an
 * SVGSVGElement and reuses `rasterizeSvgClone` so the canvas
 * compositing stays in one place. Width and height should match the
 * intended pixel dimensions of the rendered chart, the helper
 * normalizes the root attributes before drawing.
 */
export async function rasterizeSvgString(
  svgString: string,
  width: number,
  height: number,
  options: { scale?: number; backgroundColor?: string } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, "image/svg+xml")
  const root = doc.documentElement
  if (!root || root.tagName.toLowerCase() !== "svg") {
    throw new Error("rasterizeSvgString: input is not a valid SVG document")
  }
  return rasterizeSvgClone(
    root as unknown as SVGSVGElement,
    width,
    height,
    options,
  )
}
