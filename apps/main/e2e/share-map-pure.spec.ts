import { test, expect } from "@playwright/test"
import {
  isUniformImage,
  mapExportSize,
  mapPanelCrop,
} from "../app/features/scenarioExplorer/explorer/share/capture/mapCrop"

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
