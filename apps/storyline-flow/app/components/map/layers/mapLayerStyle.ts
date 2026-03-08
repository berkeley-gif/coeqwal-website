import {
  FreshWaterColor,
  SnowWaterColor,
  WetlandColor,
} from "../../helpers/colorPalette"
import { DataDrivenPropertyValueSpecification } from "@repo/map"

const hexToRgb = (hex: string, opacity: number = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return "rgba(0, 0, 0, 1)"
  const { r, g, b } = {
    r: parseInt(result[1] || "0", 16),
    g: parseInt(result[2] || "0", 16),
    b: parseInt(result[3] || "0", 16),
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export const precipitationPaintStyle = {
  "fill-color": [
    "case",
    ["==", ["get", "contour"], "1"],
    hexToRgb(FreshWaterColor, 0.7),
    ["==", ["get", "contour"], "2"],
    hexToRgb(FreshWaterColor, 0.5),
    ["==", ["get", "contour"], "3"],
    hexToRgb(FreshWaterColor, 0.3),
    hexToRgb(FreshWaterColor, 0.1),
  ] as DataDrivenPropertyValueSpecification<string>,
  "fill-opacity-transition": {
    duration: 1000,
  },
}

export const snowpackPaintStyle = {
  "fill-color": [
    "case",
    ["==", ["get", "contour"], "3"],
    hexToRgb(SnowWaterColor, 0.8),
    ["==", ["get", "contour"], "2"],
    hexToRgb(SnowWaterColor, 0.6),
    ["==", ["get", "contour"], "1"],
    hexToRgb(SnowWaterColor, 0.4),
    hexToRgb(SnowWaterColor, 0.2),
  ] as DataDrivenPropertyValueSpecification<string>,
  "fill-opacity-transition": {
    duration: 1000,
  },
}

export const wetlandPaintStyle = {
  "fill-color": hexToRgb(WetlandColor, 0.6),
}
