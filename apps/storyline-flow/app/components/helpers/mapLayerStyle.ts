import {
  FreshWaterColor,
  InfrastructureColor,
  OffWhiteColor,
  WetlandColor,
} from "./colorPalette"

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

export const riverLayerStyle = {
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": FreshWaterColor,
    "line-width": 3,
    "line-opacity": 0,
  },
  layer: {
    "source-layer": "three_socal_rivers-behi1n",
  },
}

export const canalLayerStyle = {
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  layer: {
    "source-layer": "drinking-34z621",
  },
  paint: {
    "line-color": InfrastructureColor,
    "line-width": 3,
    "line-opacity": 0,
    //"line-dasharray": [2, 2] as unknown as string,
  },
}

export const deltaWaterLayerStyle = {
  type: "fill",
  paint: {
    "fill-color": FreshWaterColor,
    "fill-opacity": 0,
  },
  layer: {
    "source-layer": "delta_freshwater_flow-2cexx5",
  },
}

export const deltaWetlandLayerStyle = {
  type: "fill",
  paint: {
    "fill-color": hexToRgb(WetlandColor, 0.6),
    "fill-opacity": 0,
  },
  layer: {
    "source-layer": "delta_freshwater_wetland-dle9vo",
  },
}

export const cityBoundaryLayerStyle = {
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": OffWhiteColor,
    "line-width": 2,
    "line-opacity": 0,
  },
  layer: {
    "source-layer": "city_boundaries_bay_socal-ccd0v4",
  },
}

export const precipitationPaintStyle = {
  "fill-color": [
    "case",
    ["==", ["get", "contour"], "1"],
    "rgba(77, 166, 255, 0.7)",
    ["==", ["get", "contour"], "2"],
    "rgba(77, 166, 255, 0.5)",
    ["==", ["get", "contour"], "3"],
    "rgba(77, 166, 255, 0.3)",
    "rgba(77, 166, 255, 0.1)",
  ] as unknown as string,
  "fill-opacity": 0,
  "fill-opacity-transition": {
    duration: 1000,
  } as unknown as string,
}

export const snowpackPaintStyle = {
  "fill-color": [
    "case",
    ["==", ["get", "contour"], "3"],
    "rgba(172, 221, 233, 0.8)",
    ["==", ["get", "contour"], "2"],
    "rgba(172, 221, 233, 0.6)",
    ["==", ["get", "contour"], "1"],
    "rgba(172, 221, 233, 0.4)",
    "rgba(172, 221, 233, 0.2)",
  ] as unknown as string,
  "fill-opacity": 0,
  "fill-opacity-transition": {
    duration: 1000,
  } as unknown as string,
}

export const boundaryPaintStyle = {
  type: "line",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": OffWhiteColor,
    "line-width": 6,
    "line-opacity": 1,
  },
}
