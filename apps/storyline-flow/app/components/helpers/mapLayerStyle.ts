export const riverLayerStyle = {
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": "#3d8ec9",
    "line-width": 3,
    "line-opacity": 0,
  },
}

export const deltaWaterLayerStyle = {
  type: "fill",
  paint: {
    "fill-color": "#031a35",
    "fill-opacity": 0,
  },
  layer: {
    "source-layer": "delta_water-cxxi58",
  },
}

export const deltaWetlandLayerStyle = {
  type: "fill",
  paint: {
    "fill-color": "rgba(37, 90, 22, 0.3)",
    "fill-opacity": 0,
  },
  layer: {
    "source-layer": "delta_freshwater_wetland-5wdgh4",
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
  "fill-opacity-transition": {
    duration: 1000,
  } as unknown as string,
}

export const snowpackPaintStyle = {
  "fill-color": [
    "case",
    ["==", ["get", "contour"], "3"],
    "rgba(242, 240, 239, 0.8)",
    ["==", ["get", "contour"], "2"],
    "rgba(242, 240, 239, 0.6)",
    ["==", ["get", "contour"], "1"],
    "rgba(242, 240, 239, 0.4)",
    "rgba(242, 240, 239, 0.2)",
  ] as unknown as string,
  "fill-opacity-transition": {
    duration: 1000,
  } as unknown as string,
}

//#00aaff
//#4da6ff
//#3d8ec9
