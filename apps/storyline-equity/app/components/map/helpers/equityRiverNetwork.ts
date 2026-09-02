import { riverNetwork } from "@repo/data"

type RiverFeature = (typeof riverNetwork.features)[number]

export type RiverFeatureCollection = Omit<typeof riverNetwork, "features"> & {
  features: RiverFeature[]
}

export function selectRivers(
  matcher: (name: string) => boolean,
): RiverFeatureCollection {
  return {
    ...riverNetwork,
    features: riverNetwork.features.filter((feature) =>
      matcher(String(feature.properties?.GNIS_Name ?? "")),
    ),
  }
}

export function selectRiversByName(...names: string[]) {
  const selectedNames = new Set(names)
  return selectRivers((name) => selectedNames.has(name))
}
