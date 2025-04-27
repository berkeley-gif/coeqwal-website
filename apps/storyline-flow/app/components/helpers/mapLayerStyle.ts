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
    delay: 1000,
  } as unknown as string,
}

//#00aaff
//#4da6ff
//#3d8ec9
