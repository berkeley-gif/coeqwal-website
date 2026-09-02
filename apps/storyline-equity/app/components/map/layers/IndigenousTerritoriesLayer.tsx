"use client"

import { Layer, Source } from "@repo/map"
import { indigenousTerritoriesLabels } from "@repo/data"

const SOURCE_ID = "indigenous-territories-source"
const SOURCE_LAYER = "indigenous_territories_jen_cl-425g7l"
const FILL_LAYER_ID = "indigenous-territories-fill"
const LABELS_SOURCE_ID = "indigenous-territories-labels-source"
const NAME_PROPERTY = "mapname"
const FALLBACK_COLOR = "hsl(0, 0%, 79%)"

// Saved pastel palette, one fixed color per territory name (matches the
// 60 names in indigenous_territories_labels.geojson). Generated once via
// golden-angle hue stepping (hue = index * 137.508deg mod 360, 60% sat,
// 82% lightness) so every territory gets a visibly distinct hue, then
// hardcoded here so the mapping is stable across sessions instead of
// depending on the order vector tiles happen to load in.
const TERRITORY_COLORS: Record<string, string> = {
  Achumawi: "#edb6b6",
  Atsugewi: "#b6edc6",
  Cahto: "#d6b6ed",
  Chemehuevi: "#ede6b6",
  Chimariko: "#b6e3ed",
  Chumash: "#edb6d3",
  "Coast Miwok": "#c3edb6",
  Ohlone: "#b8b6ed",
  Cupeño: "#edc8b6",
  Esselen: "#b6edd8",
  "Foothill Yokuts": "#e8b6ed",
  Gabrieliño: "#e1edb6",
  Halchidhoma: "#b6d1ed",
  Hupa: "#edb6c1",
  Juaneño: "#b6edba",
  Karuk: "#cab6ed",
  Kawaiisu: "#eddab6",
  Kitanemuk: "#b6edea",
  Konkow: "#edb6df",
  Kumeyaay: "#cfedb6",
  "Lake Miwok": "#b6bfed",
  Lassik: "#edbdb6",
  Luiseño: "#b6edcd",
  Maidu: "#ddb6ed",
  Mattole: "#ecedb6",
  Miwok: "#b6dced",
  Modoc: "#edb6cc",
  Mojave: "#bcedb6",
  "Mono Lake Northern Paiute": "#bfb6ed",
  Nisenan: "#edcfb6",
  Nomlaki: "#b6eddf",
  Nongatl: "#edb6ea",
  "Northern Paiute": "#daedb6",
  "Northern Valley Yokuts": "#b6caed",
  "Owens Valley Paiute-Shoshone": "#edb6ba",
  Patwin: "#b6edc1",
  Pomo: "#d1b6ed",
  Quechan: "#ede1b6",
  Salinan: "#b6e8ed",
  Serrano: "#edb6d8",
  Shasta: "#c8edb6",
  Sinkyone: "#b6b8ed",
  "Southern Paiute": "#edc4b6",
  "Southern Valley Yokuts": "#b6edd4",
  Tataviam: "#e4b6ed",
  Tolowa: "#e5edb6",
  Tubatulabal: "#b6d5ed",
  Wailaka: "#edb6c5",
  Wappo: "#b6edb6",
  Washoe: "#c6b6ed",
  "Western Mono": "#edd6b6",
  "Western Shoshone": "#b6ede6",
  Whilkut: "#edb6e3",
  Wintu: "#d3edb6",
  Wiyot: "#b6c3ed",
  Yana: "#edb8b6",
  Yuki: "#b6edc8",
  Yurok: "#d8b6ed",
  Cahuilla: "#ede8b6",
  Chilula: "#b6e1ed",
}

export const INDIGENOUS_TERRITORY_PALETTE = Object.values(TERRITORY_COLORS)

// ["match", ["get", "mapname"], name1, color1, name2, color2, ..., fallback]
const TERRITORY_FILL_COLOR_EXPRESSION = [
  "match",
  ["get", NAME_PROPERTY],
  ...Object.entries(TERRITORY_COLORS).flat(),
  FALLBACK_COLOR,
]

export default function IndigenousTerritoriesLayer({
  visible,
  opacity,
}: {
  visible: boolean
  opacity: number
}) {
  const visibility = visible ? "visible" : "none"
  const layerOpacity = Math.max(0, Math.min(1, opacity))

  return (
    <>
      <Source id={SOURCE_ID} type="vector" url="mapbox://coeqwal.x8q5m3">
        <Layer
          id={FILL_LAYER_ID}
          type="fill"
          source-layer={SOURCE_LAYER}
          paint={{
            "fill-color": TERRITORY_FILL_COLOR_EXPRESSION as unknown as string,
            "fill-opacity": 0.55 * layerOpacity,
            "fill-antialias": true,
          }}
          layout={{ visibility }}
        />
      </Source>
      {/* One point per unique territory name (placed on its largest part),
          so multi-part territories like Chumash or Gabrieliño don't repeat
          their label once per island/mainland piece. */}
      <Source
        id={LABELS_SOURCE_ID}
        type="geojson"
        data={
          indigenousTerritoriesLabels as unknown as GeoJSON.FeatureCollection
        }
      >
        <Layer
          id="indigenous-territories-labels"
          type="symbol"
          layout={{
            "text-field": ["get", "mapname"],
            "text-font": ["Neue Haas Grotesk", "Arial Unicode MS Bold"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 5, 11, 7, 14],
            "text-max-width": 12,
            "text-padding": 2,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
            visibility,
          }}
          paint={{
            "text-color": "#fcfbfa",
            "text-opacity": layerOpacity,
            "text-halo-color": "rgba(7, 20, 44, 0.92)",
            "text-halo-width": 1.5,
            "text-halo-blur": 0.5,
          }}
        />
      </Source>
    </>
  )
}
