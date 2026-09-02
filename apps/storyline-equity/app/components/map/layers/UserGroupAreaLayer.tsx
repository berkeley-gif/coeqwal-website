"use client"

import { Layer, Source } from "@repo/map"

export type UserGroupArea = "agriculture" | "drinking" | "ecosystem"

const SOURCE_ID = "background-user-group-area-source"
const SOURCE_LAYER = "usergroup_area.zip-rnssxa"
const SOURCE_URL = "mapbox://coeqwal.015k90"
export const USER_GROUP_AREA_COLOR = "#f4e7a1"

export default function UserGroupAreaLayer({
  visible,
  opacities,
}: {
  visible: boolean
  opacities: Record<UserGroupArea, number>
}) {
  const visibility = visible ? "visible" : "none"

  return (
    <Source id={SOURCE_ID} type="vector" url={SOURCE_URL}>
      {(["agriculture", "drinking", "ecosystem"] as const).map((group) => (
        <Layer
          key={group}
          id={`background-user-group-area-${group}`}
          type="fill"
          source-layer={SOURCE_LAYER}
          filter={["==", ["get", "group"], group]}
          paint={{
            "fill-color": USER_GROUP_AREA_COLOR,
            "fill-opacity": 0.52 * Math.max(0, Math.min(1, opacities[group])),
            "fill-outline-color": "rgba(255, 244, 184, 0.9)",
            "fill-antialias": true,
          }}
          layout={{ visibility }}
        />
      ))}
    </Source>
  )
}
