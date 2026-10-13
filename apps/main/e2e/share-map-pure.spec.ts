import { test, expect } from "@playwright/test"
import {
  isUniformImage,
  mapExportSize,
  mapPanelCrop,
} from "../app/features/scenarioExplorer/explorer/share/capture/mapCrop"
import { readFileSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import {
  decodeMapToken,
  encodeMapToken,
  mapFilenameLabel,
} from "../app/features/scenarioExplorer/explorer/share/variants/mapToken"
import {
  shareFigureFooter,
  shareFigureFooterText,
} from "../app/features/scenarioExplorer/explorer/share/figureFooter"
import { thumbnailAspectRatioFor } from "../app/features/scenarioExplorer/explorer/share/thumbnailAspect"
import type { ShareItem } from "../app/features/scenarioExplorer/explorer/share/types"

const container = { left: 0, top: 0, width: 1600, height: 900 }

test("crop is the visible map panel, in canvas pixels", () => {
  const panel = { left: 1200, top: 100, width: 400, height: 800 }
  expect(mapPanelCrop(panel, container, 2)).toEqual({
    sx: 2400,
    sy: 200,
    sw: 800,
    sh: 1600,
  })
})

test("a panel partly outside the map is clipped to the map", () => {
  const panel = { left: 1400, top: -50, width: 400, height: 1000 }
  expect(mapPanelCrop(panel, container, 1)).toEqual({
    sx: 1400,
    sy: 0,
    sw: 200,
    sh: 900,
  })
})

test("a collapsed or off-map panel gives no crop", () => {
  expect(
    mapPanelCrop({ left: 1600, top: 0, width: 0, height: 900 }, container, 1),
  ).toBeNull()
  expect(
    mapPanelCrop({ left: 2000, top: 0, width: 300, height: 900 }, container, 1),
  ).toBeNull()
})

test("export size keeps the aspect ratio and never upscales", () => {
  expect(mapExportSize({ sx: 0, sy: 0, sw: 2400, sh: 1800 }, 1200)).toEqual({
    width: 1200,
    height: 900,
  })
  expect(mapExportSize({ sx: 0, sy: 0, sw: 600, sh: 900 }, 1200)).toEqual({
    width: 600,
    height: 900,
  })
})

test("a single-color canvas counts as blank; a varied one does not", () => {
  const flat = new Uint8ClampedArray(4 * 1000).fill(0)
  expect(isUniformImage(flat)).toBe(true)
  const varied = new Uint8ClampedArray(4 * 1000)
  for (let i = 0; i < varied.length; i++) varied[i] = (i * 37) % 256
  expect(isUniformImage(varied)).toBe(false)
})

const mapItem = {
  id: "map-1",
  type: "map",
  tool: "equity",
  outcomeCodes: ["ENV_FLOWS", "CWS_DEL"],
  scenarioId: "s0020",
  hydroclimate: "cc50",
  comparedWithBaseline: true,
  imageAspect: 0.5,
  capturedAt: "2026-10-05T12:00:00Z",
} as ShareItem & { type: "map" }

test("map token has a fixed, documented shape", () => {
  // e2e share-map-card.spec.ts builds a URL from this exact string.
  expect(encodeMapToken(mapItem)).toBe("ENV_FLOWS~CWS_DEL.s0020.cc50.equity.1")
})

test("map token round-trips everything but the image", () => {
  const back = decodeMapToken(encodeMapToken(mapItem).split("."))
  expect(back).toEqual({
    outcomeCodes: ["ENV_FLOWS", "CWS_DEL"],
    scenarioId: "s0020",
    hydroclimate: "cc50",
    tool: "equity",
    comparedWithBaseline: true,
  })
  expect(decodeMapToken(["", "s0020"])).toBeNull()
})

test("url prefixes stay unique across variant handlers (source guard)", () => {
  const dir = fileURLToPath(
    new URL(
      "../app/features/scenarioExplorer/explorer/share/variants/",
      import.meta.url,
    ),
  )
  const prefixes = readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && f !== "mapToken.ts")
    .map((f) => readFileSync(dir + f, "utf8").match(/urlPrefix: "(\w)"/)?.[1])
    .filter(Boolean)
  expect(prefixes).toContain("m")
  expect(new Set(prefixes).size).toBe(prefixes.length)
})

test("saved maps credit Mapbox and OpenStreetMap", () => {
  const text = shareFigureFooterText(shareFigureFooter(mapItem))
  expect(text).toContain("Basemap © Mapbox © OpenStreetMap.")
  expect(text).toContain("Captured Oct 5, 2026.")
})

test("thumbnail follows the saved image shape", () => {
  expect(thumbnailAspectRatioFor(mapItem)).toBe(0.5)
})

test("filename names the outcomes, scenario and hydroclimate", () => {
  const name = mapFilenameLabel(mapItem, {
    scenarioNameLookup: () => "Current operations",
    scenarioShortLabelLookup: () => "Current operations",
    outcomeNameLookup: (c) =>
      c === "ENV_FLOWS" ? "Environmental flows" : "Community surface water",
  })
  expect(name).toMatch(
    /^coeqwal-map-environmental-flows-community-surface-water-current-operations-/,
  )
})
