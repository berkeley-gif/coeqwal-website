import { FreshWaterColor, InfrastructureColor } from "./colorPalette"

export const riverLayerStyle = {
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": FreshWaterColor,
    "line-width": 5,
  },
}

export const tunnelLayerStyle = {
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": InfrastructureColor,
    "line-width": 3,
    "line-opacity": 1,
  },
}
