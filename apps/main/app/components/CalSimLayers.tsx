"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Source, Layer, Marker } from "@repo/map"
import { Box, LocationOnIcon, Typography, useTheme } from "@repo/ui/mui"
import { useCalSimToggle } from "./CalSimContext"
import type { NetworkGeoJSONResponse } from "./CalSimMarkers"

const API_BASE_URL = "https://api.coeqwal.org"

// More specific API response type (for future use when API is fully migrated)
// interface EnhancedTrailResponse {
//   type: "FeatureCollection"
//   trail_info: {
//     name: string
//     description: string
//     trail_type: "enhanced" | "foundation" | "comprehensive" | "complete"
//     feature_count: number
//     progression_level: {
//       level: number
//       description: string
//       data_quality: string
//       coverage: string
//       expected_features: string
//     }
//     additional_infrastructure: number
//   }
//   features: TrailFeature[]
// }

// TrailFeature interface (for future use when API is fully migrated)
// interface TrailFeature {
//   type: "Feature"
//   geometry: {
//     type: "Point" | "LineString" | "MultiLineString"
//     coordinates: [number, number] | [number, number][] | [number, number][][]
//   }
//   properties: {
//     id: number
//     short_code: string
//     schematic_type: "node" | "arc"
//     type: "STR" | "PS" | "WTP" | "WWTP" | "CH" | "DD" | "DA" | "D" | "OM"
//     sub_type?: string
//     from_node?: string
//     to_node?: string
//     river_name?: string
//     arc_name?: string
//     hydrologic_region?: string
//     geometry_type: "point" | "line"
//     source: "trail_backbone" | "enhanced_infrastructure"
//     name?: string
//     capacity_taf?: number
//   }
// }

// System Pattern Constants
const SYSTEM_PATTERNS = {
  SACRAMENTO: "SAC",
  SAN_JOAQUIN: "SJR",
  CALIFORNIA_AQUEDUCT: "CAA",
  DELTA_MENDOTA_CANAL: "DMC",
  OLD_MIDDLE_RIVER: "OMR",
  MOKELUMNE: "MOK",
  AMERICAN_RIVER: "AMR",
  FEATHER_RIVER: "FTR",
} as const

export default function CalSimLayers() {
  const { isCalSimVisible } = useCalSimToggle()
  const theme = useTheme()
  const [geoJsonData, setGeoJsonData] = useState<NetworkGeoJSONResponse | null>(
    null,
  )

  // Major reservoir data (same as original CalSimMarkers)
  const majorReservoirData = useMemo(
    () =>
      new Map([
        ["SHSTA", { name: "Shasta", capacity_taf: 4552.0, rank: 1 }],
        ["OROVL", { name: "Oroville", capacity_taf: 3538.0, rank: 2 }],
        ["TRNTY", { name: "Trinity", capacity_taf: 2448.0, rank: 3 }],
        ["SLUIS", { name: "San Luis", capacity_taf: 2041.0, rank: 4 }],
        ["BRYSA", { name: "Berryessa", capacity_taf: 1602.0, rank: 5 }],
        ["ALMNR", { name: "Almanor", capacity_taf: 1174.0, rank: 6 }],
        ["MCLRE", { name: "McClure", capacity_taf: 1025.0, rank: 7 }],
        ["FOLSM", { name: "Folsom", capacity_taf: 977.0, rank: 8 }],
      ]),
    [],
  )

  const majorReservoirCodes = useMemo(
    () => new Set(majorReservoirData.keys()),
    [majorReservoirData],
  )

  // Reservoir scaling calculations (same as original CalSimMarkers)
  const reservoirScaling = useMemo(() => {
    const capacities = Array.from(majorReservoirData.values()).map(
      (r) => r.capacity_taf,
    )
    const maxCapacity = Math.max(...capacities)
    const minCapacity = Math.min(...capacities)

    const minMarkerSize = 4.5 // LocationOnIcon size
    const maxMarkerSize = 7.0
    const minCircleSize = 2.0 // Slightly bigger from 1.8
    const maxCircleSize = 3.2 // Slightly bigger from 2.8

    return {
      getMarkerSize: (capacity_taf: number, isSelected = false) => {
        const normalizedSize =
          minMarkerSize +
          ((capacity_taf - minCapacity) / (maxCapacity - minCapacity)) *
            (maxMarkerSize - minMarkerSize)
        return isSelected ? normalizedSize * 1.15 : normalizedSize
      },
      getCircleSize: (capacity_taf: number, isSelected = false) => {
        const normalizedSize =
          minCircleSize +
          ((capacity_taf - minCapacity) / (maxCapacity - minCapacity)) *
            (maxCircleSize - minCircleSize)
        return isSelected ? normalizedSize * 1.15 : normalizedSize
      },
      getFontSize: (capacity_taf: number) => {
        const baseSize =
          0.6 + // Slightly bigger to match larger circles
          ((capacity_taf - minCapacity) / (maxCapacity - minCapacity)) * 0.25 // Slightly more range
        return `${baseSize}rem`
      },
    }
  }, [majorReservoirData])

  // Load CalSim data when visible
  const loadCalSimData = useCallback(async () => {
    if (!isCalSimVisible) return

    try {
      console.log("🚀 Loading CalSim enhanced data...")

      const trailsUrl = `${API_BASE_URL}/api/network/trails/overview?trail_type=enhanced`
      console.log("🎯 URL:", trailsUrl)

      const response = await fetch(trailsUrl)
      console.log("📡 API Response status:", response.status)

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 ENHANCED API Results:")
      console.log(
        "   📈 Feature Count:",
        data.trail_info?.feature_count || "unknown",
      )
      console.log("   🎯 Expected: 875 features")
      console.log("   🔍 Features array length:", data.features?.length || 0)
      console.log(
        "   🎯 Data Quality:",
        data.trail_info?.progression_level?.data_quality || "unknown",
      )
      console.log(
        "   🔧 Additional Infrastructure:",
        data.trail_info?.additional_infrastructure || "unknown",
      )

      setGeoJsonData(data)
      console.log("✅ CalSim enhanced data loaded")
    } catch (error) {
      console.error("❌ Failed to load CalSim data:", error)
      setGeoJsonData(null)
    }
  }, [isCalSimVisible])

  // Load data when CalSim becomes visible
  useEffect(() => {
    if (isCalSimVisible) {
      console.log("✅ API is ready - loading real comprehensive data...")
      loadCalSimData()
    } else {
      setGeoJsonData(null)
    }
  }, [isCalSimVisible, loadCalSimData])

  // Memoize Feature Filtering for performance
  const { majorReservoirFeatures, regularFeatures } = useMemo(() => {
    if (!geoJsonData) return { majorReservoirFeatures: [], regularFeatures: [] }

    const major = geoJsonData.features.filter((f) => {
      const props = f.properties as any // eslint-disable-line @typescript-eslint/no-explicit-any
      return (
        (props.schematic_type === "node" || props.element_type === "node") && // eslint-disable-line react/prop-types
        props.type === "STR" && // eslint-disable-line react/prop-types
        majorReservoirCodes.has(props.short_code) // eslint-disable-line react/prop-types
      )
    })

    const regular = geoJsonData.features.filter((f) => {
      const props = f.properties as any // eslint-disable-line @typescript-eslint/no-explicit-any
      return (
        (props.schematic_type === "node" || props.element_type === "node") && // eslint-disable-line react/prop-types
        (props.type !== "STR" || !majorReservoirCodes.has(props.short_code)) // eslint-disable-line react/prop-types
      )
    })

    return { majorReservoirFeatures: major, regularFeatures: regular }
  }, [geoJsonData, majorReservoirCodes])

  // Don't render if CalSim is not visible or no data
  if (!isCalSimVisible || !geoJsonData) {
    return null
  }

  console.log(
    "🎨 HYBRID RENDERING: Mapbox layers for regular nodes + DOM markers for reservoirs...",
  )

  console.log(
    `   🏞️ Major Reservoirs (DOM LocationOnIcon): ${majorReservoirFeatures.length}`,
  )
  console.log(
    `   🔧 Regular nodes + other reservoirs (Mapbox): ${regularFeatures.length}`,
  )

  return (
    <>
      {/* MAPBOX LAYERS: High-performance rendering for regular nodes */}
      <Source
        id="calsim-regular-nodes-source"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: regularFeatures as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        }}
      >
        {/* Regular infrastructure nodes */}
        <Layer
          id="calsim-regular-nodes"
          type="circle"
          paint={{
            "circle-radius": [
              "case",
              // Sacramento River nodes - bigger
              [
                "==",
                ["slice", ["get", "short_code"], 0, 3],
                SYSTEM_PATTERNS.SACRAMENTO,
              ],
              [
                "case",
                ["==", ["get", "type"], "CH"],
                4, // SAC Channels - bigger
                ["==", ["get", "type"], "PS"],
                5, // SAC Pump stations - bigger
                ["==", ["get", "type"], "WWTP"],
                5, // SAC Wastewater treatment - bigger
                ["==", ["get", "type"], "WTP"],
                5, // SAC Water treatment - bigger
                4, // SAC Default - bigger
              ],
              // San Joaquin River nodes - bigger
              [
                "==",
                ["slice", ["get", "short_code"], 0, 3],
                SYSTEM_PATTERNS.SAN_JOAQUIN,
              ],
              [
                "case",
                ["==", ["get", "type"], "CH"],
                4, // SJR Channels - bigger
                ["==", ["get", "type"], "PS"],
                5, // SJR Pump stations - bigger
                ["==", ["get", "type"], "WWTP"],
                5, // SJR Wastewater treatment - bigger
                ["==", ["get", "type"], "WTP"],
                5, // SJR Water treatment - bigger
                4, // SJR Default - bigger
              ],
              // California Aqueduct nodes - bigger
              [
                "==",
                ["slice", ["get", "short_code"], 0, 3],
                SYSTEM_PATTERNS.CALIFORNIA_AQUEDUCT,
              ],
              [
                "case",
                ["==", ["get", "type"], "CH"],
                4, // CAA Channels - bigger
                ["==", ["get", "type"], "PS"],
                5, // CAA Pump stations - bigger
                ["==", ["get", "type"], "WWTP"],
                5, // CAA Wastewater treatment - bigger
                ["==", ["get", "type"], "WTP"],
                5, // CAA Water treatment - bigger
                4, // CAA Default - bigger
              ],
              // Delta Mendota Canal nodes - bigger
              [
                "==",
                ["slice", ["get", "short_code"], 0, 3],
                SYSTEM_PATTERNS.DELTA_MENDOTA_CANAL,
              ],
              [
                "case",
                ["==", ["get", "type"], "CH"],
                4, // DMC Channels - bigger
                ["==", ["get", "type"], "PS"],
                5, // DMC Pump stations - bigger
                ["==", ["get", "type"], "WWTP"],
                5, // DMC Wastewater treatment - bigger
                ["==", ["get", "type"], "WTP"],
                5, // DMC Water treatment - bigger
                4, // DMC Default - bigger
              ],
              // All other nodes - regular size
              ["==", ["get", "type"], "CH"],
              3, // Other Channels
              ["==", ["get", "type"], "PS"],
              4, // Other Pump stations
              ["==", ["get", "type"], "WWTP"],
              4, // Other Wastewater treatment
              ["==", ["get", "type"], "WTP"],
              4, // Other Water treatment
              ["==", ["get", "type"], "OM"],
              3, // Other/Delta
              3, // Default
            ],
            "circle-color": [
              "case",
              // Sacramento River nodes - deeper blue
              [
                "==",
                ["slice", ["get", "short_code"], 0, 3],
                SYSTEM_PATTERNS.SACRAMENTO,
              ],
              "#186b88", // theme.palette.blue.dark
              // San Joaquin River nodes - purple
              [
                "==",
                ["slice", ["get", "short_code"], 0, 3],
                SYSTEM_PATTERNS.SAN_JOAQUIN,
              ],
              "#7b1fa2", // Purple
              // California Aqueduct nodes - gold
              [
                "==",
                ["slice", ["get", "short_code"], 0, 3],
                SYSTEM_PATTERNS.CALIFORNIA_AQUEDUCT,
              ],
              "#ffd87e", // theme.palette.accent.gold
              // Delta Mendota Canal nodes - earth brown
              [
                "==",
                ["slice", ["get", "short_code"], 0, 3],
                SYSTEM_PATTERNS.DELTA_MENDOTA_CANAL,
              ],
              "#c2a14f", // theme.palette.nature.earth
              // Default: map panel overlay color (sky blue)
              "#9CBF4F", // theme.palette.learn.background - same as panel background
            ],
            "circle-stroke-width": 1, // Finer stroke
            "circle-stroke-color": "#ffffff", // White stroke for all
            "circle-opacity": 0.9,
          }}
        />
      </Source>

      {/* DOM MARKERS: Beautiful LocationOnIcon markers for 8 major reservoirs */}
      {majorReservoirFeatures.map((feature) => {
        const coordinates = feature.geometry.coordinates as [number, number]
        const props = feature.properties as any // eslint-disable-line @typescript-eslint/no-explicit-any
        const { id, short_code } = props // eslint-disable-line react/prop-types

        // Get TAF data from our curated major reservoir data
        const reservoirInfo = majorReservoirData.get(short_code)
        const capacity_taf = reservoirInfo?.capacity_taf || 1000
        const name = reservoirInfo?.name || short_code

        // Use the same scaling as the original design
        const markerSize = reservoirScaling.getMarkerSize(capacity_taf, false)
        const circleSize = reservoirScaling.getCircleSize(capacity_taf, false)
        const fontSize = reservoirScaling.getFontSize(capacity_taf)

        return (
          <Marker
            key={`reservoir-${id}`}
            longitude={coordinates[0]}
            latitude={coordinates[1]}
            anchor="bottom"
          >
            <Box
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocationOnIcon
                  sx={{
                    fontSize: `${markerSize}rem`,
                    color: theme.palette.brand.sky, // Sky blue
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                    "&:hover": { transform: "scale(1.05)" },
                    transition: "all 0.2s ease",
                  }}
                />

                {/* TAF circle inside the location icon */}
                <Box
                  sx={{
                    position: "absolute",
                    top: "15%",
                    left: "50%",
                    transform: "translate(-50%, 0)",
                    width: `${circleSize}rem`,
                    height: `${circleSize}rem`,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.blue.medium,
                    border: "1px solid rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: fontSize,
                    lineHeight: 1.2,
                    fontWeight: "bold",
                    color: "white",
                    pointerEvents: "none",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    textAlign: "center",
                  }}
                >
                  {capacity_taf ? (
                    <>
                      <Box component="span" sx={{ fontSize: fontSize }}>
                        {(capacity_taf / 1000).toFixed(1)}K
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          fontSize: `calc(${fontSize} * 0.7)`,
                          lineHeight: 1.2,
                          marginTop: "-0.1rem",
                        }}
                      >
                        TAF
                      </Box>
                    </>
                  ) : (
                    "?"
                  )}
                </Box>
              </Box>

              {/* Reservoir name label positioned on the stalk */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: "25%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  padding: "3px 8px",
                  boxShadow: theme.shadows[1],
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#333",
                    lineHeight: 1.1,
                    textAlign: "center",
                  }}
                >
                  {name}
                </Typography>
              </Box>
            </Box>
          </Marker>
        )
      })}
    </>
  )
}
