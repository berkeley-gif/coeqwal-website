const OceanWaterCandidates = {
  1: "#031a35", // Original chosen color in alpha
  2: "#093a6a", // Website old main blue
  3: "#1a4472",
}

const RiverWaterCandidates = {
  1: "#0f235e", // Original chosen color in mapbox studio
  2: "#3d84c9", // Original chosen color in alpha
  3: "#1a4472",
  4: "#75cddb",
}

const FreshWaterCandidates = {
  1: "#75cddb", // too green, but could be used for highlighted river
  2: "#acdde9", // could be used for snow
  3: "#50B1E7", // too bright, but this is good for everything else other than map
  4: "#3d8ec9", // Original chosen color in alpha, only good for map
  5: "#64a4d6", // main.app
}

const SnowWaterCandidates = {
  1: "#f2f0ef", // Original chosen color in alpha,
  2: "#acdde9",
  3: "#92C1D5",
}

const InfrastructureCandidates = {
  1: "#F8A42D",
  2: "#F27322",
  3: "#FCB321",
  4: "#FFA200",
  5: "#E54545",
}

const WetlandCandidates = {
  1: "#255a16", // Original chosen color in alpha
  2: "#40835D",
  3: "#719941",
}

export const OceanWaterColor = OceanWaterCandidates[3]
export const FreshWaterColor = FreshWaterCandidates[5] // Precipitation
export const RiverWaterColor = RiverWaterCandidates[4]
export const SnowWaterColor = SnowWaterCandidates[3]
export const OffWhiteColor = "#f2f0ef" // Used to replace pure white color
export const InfrastructureColor = InfrastructureCandidates[2] // Used for infrastructure
export const WetlandColor = WetlandCandidates[2] // Used for wetland

const MapFreshWaterColor = FreshWaterCandidates[5] // Used for map, but not for the website
export const FreshWaterColorScale = [
  `${MapFreshWaterColor}30`,
  `${MapFreshWaterColor}70`,
  `${MapFreshWaterColor}90`,
  `${MapFreshWaterColor}`,
]

export const SnowWaterColorScale = [
  `${SnowWaterColor}50`,
  `${SnowWaterColor}70`,
  `${SnowWaterColor}`,
]

export const WebsiteMainBlue = "#2a5287"
export const WebsiteMainBlueLight = "#acdde9"
