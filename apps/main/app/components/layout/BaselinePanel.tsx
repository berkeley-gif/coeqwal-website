"use client"

import React, { forwardRef, useState } from "react"
import { Typography, Container, Box, List, ListItem } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useTranslation } from "@repo/i18n"
import VisibilityIcon from "@mui/icons-material/Visibility"
// import { initialMapView } from "../../../lib/mapViews"
import { breakpointViews } from "../../../lib/mapViews"
import { useMap } from "../../context/MapContext"
import { LearnMoreButton } from "@repo/ui/learnMoreButton"
import { useData } from "../../context/DataContext"
import { useMapInteractions } from "../../hooks/useMapInteractions"
import { useBreakpointKey } from "../../hooks/useResponsiveView"
import { WATERSHED_BASINS_LAYER_ID } from "@repo/map-hooks"
// import { useTheme } from "@mui/material/styles"
// import { Marker } from "@repo/map"

interface BaselinePanelProps {
  onLearnMoreClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  setShowCalSimToggle: React.Dispatch<React.SetStateAction<boolean>>
  setIsCalSimVisible: React.Dispatch<React.SetStateAction<boolean>>
  setIsBasinsVisible: React.Dispatch<React.SetStateAction<boolean>>
}

const BaselinePanel = forwardRef<HTMLDivElement, BaselinePanelProps>(
  (
    {
      onLearnMoreClick,
      setShowCalSimToggle,
      setIsCalSimVisible,
      setIsBasinsVisible,
    },
    ref,
  ) => {
    const { t, messages } = useTranslation()
    const { mapRef } = useMap()
    const data = useData()
    const { handleFlyTo } = useMapInteractions()
    const breakpointKey = useBreakpointKey()
    const theme = useTheme()

    // Add state to track the active scenario
    const [activeScenario, setActiveScenario] = useState<number | null>(null)

    const isXs = breakpointKey === "xs"
    const isSm = breakpointKey === "sm"
    const isMd = breakpointKey === "md"
    const isLg = breakpointKey === "lg"
    const isXl = breakpointKey === "xl"

    let paragraphKeys: string[] = []
    if (
      messages.BaselinePanel &&
      typeof messages.BaselinePanel === "object" &&
      "paragraphs" in messages.BaselinePanel
    ) {
      const paragraphs = messages.BaselinePanel.paragraphs
      if (paragraphs && typeof paragraphs === "object") {
        paragraphKeys = Object.keys(paragraphs)
      }
    }

    const handleIconClick = () => {
      if (mapRef.current && Array.isArray(data)) {
        console.log("Setting markers:", data)

        // Set markers representing CalSim nodes
        mapRef.current.setMarkers(
          data.map((item) => {
            // Create a properties object with the required index signature
            const propertiesWithIndexSignature: {
              Comment?: string
              "node-code"?: string
              [key: string]: unknown
            } = {
              Comment: item.properties?.Comment,
              "node-code": item.properties?.["node-code"],
            }

            // Copy all other properties
            if (item.properties) {
              Object.entries(item.properties).forEach(([key, value]) => {
                if (key !== "Comment" && key !== "node-code") {
                  propertiesWithIndexSignature[key] = value
                }
              })
            }

            return {
              id: item.id,
              longitude: item.coordinates[0],
              latitude: item.coordinates[1],
              color: "rgba(239, 152, 39, 0.8)",
              size: 6,
              // Use the properly formatted properties object
              properties: propertiesWithIndexSignature,
              Comment: item.properties?.Comment || "",
              nodeCode: item.properties?.["node-code"] || "",
            }
          }),
        )

        // Show the CalSim toggle in the controls panel
        setShowCalSimToggle(true)
        setIsCalSimVisible(true)

        // Fly to specified coordinates
        mapRef.current.flyTo(
          -123.21129833383884, // longitude
          38.1607804233019, // latitude
          7, // zoom
          0, // pitch
          0, // bearing
        )
      }
    }

    // New function to set random chloropleth colors for basins
    const applyScenarioColors = (scenarioIndex: number) => {
      if (!mapRef.current) return

      // Make sure basins are visible through the global state
      setIsBasinsVisible(true)

      // Use the breakpointViews (initial map load view) instead of paragraphMapViews
      const originalView = breakpointViews[breakpointKey]

      // Check if we're already at the target view
      let isAlreadyAtTargetView = false

      mapRef.current.withMap((mapboxMap) => {
        const map = mapboxMap.getMap() as mapboxgl.Map

        // Get current map position and zoom
        const center = map.getCenter()
        const currentZoom = map.getZoom()

        // Check if current view is very close to target view (with some tolerance)
        const positionTolerance = 0.01 // ~1km
        const zoomTolerance = 0.1 // 0.1 zoom level

        isAlreadyAtTargetView =
          Math.abs(center.lng - originalView.longitude) < positionTolerance &&
          Math.abs(center.lat - originalView.latitude) < positionTolerance &&
          Math.abs(currentZoom - originalView.zoom) < zoomTolerance
      })

      // Function to apply the actual basin coloring
      const applyBasinColors = () => {
        mapRef.current?.withMap((mapboxMap) => {
          const map = mapboxMap.getMap() as mapboxgl.Map

          if (!map.getLayer(WATERSHED_BASINS_LAYER_ID)) return

          // Make sure basins are visible
          map.setPaintProperty(WATERSHED_BASINS_LAYER_ID, "fill-opacity", 0.7)

          // Shared pool of blue colors for all scenarios
          const blueColors = [
            "#cce5ff", // Very light blue
            "#99cbff", // Light blue
            "#66b0ff", // Medium-light blue
            "#4da6ff", // Medium blue
            "#3394ff", // Medium-dark blue
            "#1a8cff", // Dark blue
            "#0077be", // Strong blue
            "#0066cc", // Deep blue
            "#004d99", // Navy blue
            "#003366", // Dark navy blue
          ]

          // Apply a simple but very reliable random coloring approach
          try {
            // Create different random patterns for each scenario by offsetting the IDs
            // This creates a different distribution for each scenario with the same data
            switch (scenarioIndex) {
              case 0:
                // Scenario 1: Progressive gradient - lower IDs get lighter blues, higher IDs get darker blues
                // This creates a pattern that suggests "intensity increasing with ID number"
                map.setPaintProperty(WATERSHED_BASINS_LAYER_ID, "fill-color", [
                  "step",
                  ["min", ["/", ["id"], 40], 9], // Normalize ID by dividing by 40, cap at 9
                  blueColors[0], // Very light blue for smallest IDs
                  1,
                  blueColors[1],
                  2,
                  blueColors[2],
                  3,
                  blueColors[3],
                  4,
                  blueColors[4],
                  5,
                  blueColors[5],
                  6,
                  blueColors[6],
                  7,
                  blueColors[7],
                  8,
                  blueColors[8],
                  9,
                  blueColors[9], // Darkest blue for largest IDs
                ])
                break
              case 1:
                // Scenario 2: Regional clusters - creates visually distinct regions
                // This creates a pattern that suggests "regional groupings of similar values"
                map.setPaintProperty(WATERSHED_BASINS_LAYER_ID, "fill-color", [
                  "step",
                  ["%", ["floor", ["/", ["id"], 10]], 10], // Group by tens (1-10, 11-20, etc.)
                  blueColors[0],
                  1,
                  blueColors[2],
                  2,
                  blueColors[4],
                  3,
                  blueColors[6],
                  4,
                  blueColors[8],
                  5,
                  blueColors[1],
                  6,
                  blueColors[3],
                  7,
                  blueColors[5],
                  8,
                  blueColors[7],
                  9,
                  blueColors[9],
                ])
                break
              case 2:
                // Scenario 3: Inverse gradient - higher IDs get lighter blues, lower IDs get darker blues
                // This creates a pattern that suggests "opposite trend from scenario 1"
                map.setPaintProperty(WATERSHED_BASINS_LAYER_ID, "fill-color", [
                  "step",
                  ["min", ["-", 10, ["/", ["id"], 40]], 9], // Inverse of scenario 1 pattern
                  blueColors[9], // Darkest blue for smallest IDs
                  1,
                  blueColors[8],
                  2,
                  blueColors[7],
                  3,
                  blueColors[6],
                  4,
                  blueColors[5],
                  5,
                  blueColors[4],
                  6,
                  blueColors[3],
                  7,
                  blueColors[2],
                  8,
                  blueColors[1],
                  9,
                  blueColors[0], // Lightest blue for largest IDs
                ])
                break
              default:
                // Fallback: Alternative formula for other scenarios
                map.setPaintProperty(WATERSHED_BASINS_LAYER_ID, "fill-color", [
                  "step",
                  ["%", ["+", ["*", ["id"], 3], 5], 10],
                  blueColors[0],
                  1,
                  blueColors[1],
                  2,
                  blueColors[2],
                  3,
                  blueColors[3],
                  4,
                  blueColors[4],
                  5,
                  blueColors[5],
                  6,
                  blueColors[6],
                  7,
                  blueColors[7],
                  8,
                  blueColors[8],
                  9,
                  blueColors[9],
                ])
            }
            console.log(
              `Applied unique random coloring pattern for scenario ${scenarioIndex + 1}`,
            )
          } catch (e) {
            console.error("Error with advanced coloring:", e)
            try {
              // Fallback to simpler color distribution - use a predetermined set of colors
              const simpleBlueColors = [
                "#003366",
                "#0066cc",
                "#0077be",
                "#3394ff",
                "#66b0ff",
              ]
              map.setPaintProperty(
                WATERSHED_BASINS_LAYER_ID,
                "fill-color",
                // Simplest possible expression with modulo
                [
                  "match",
                  ["%", ["id"], 5], // Using feature ID modulo 5
                  0,
                  simpleBlueColors[0],
                  1,
                  simpleBlueColors[1],
                  2,
                  simpleBlueColors[2],
                  3,
                  simpleBlueColors[3],
                  4,
                  simpleBlueColors[4],
                  simpleBlueColors[0], // Default color
                ],
              )
            } catch (e2) {
              console.error("Error with simple coloring:", e2)
              // Ultimate fallback - just use a single color
              map.setPaintProperty(
                WATERSHED_BASINS_LAYER_ID,
                "fill-color",
                "#0066cc",
              )
            }
          }

          // Update active scenario state
          setActiveScenario(scenarioIndex)
        })
      }

      // If we're not at the default view, fly there first, then apply colors
      if (!isAlreadyAtTargetView) {
        // Use flyTo directly with the original view coordinates instead of handleFlyTo
        // This matches the approach used in other places in the codebase
        mapRef.current.flyTo(
          originalView.longitude,
          originalView.latitude,
          originalView.zoom,
          originalView.pitch,
          originalView.bearing,
        )

        // Apply the coloring after the map movement completes
        mapRef.current.withMap((mapboxMap) => {
          const map = mapboxMap.getMap() as mapboxgl.Map
          map.once("moveend", () => {
            applyBasinColors()
          })
        })
      } else {
        // Already at correct view, just apply the coloring
        applyBasinColors()
      }
    }

    return (
      <Container
        ref={ref}
        sx={{
          backgroundColor: "transparent",
          minHeight: "100vh",
          pointerEvents: "none",
          "& .MuiButton-root, & .MuiSvgIcon-root": {
            pointerEvents: "auto",
          },
          pb: 20,
        }}
        role="main"
      >
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, lg: 16 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          <Box
            sx={{
              marginTop: "150px",
            }}
          >
            <Typography
              variant="h1"
              sx={{ whiteSpace: { xs: "normal", md: "pre-wrap" } }}
              gutterBottom
            >
              {t("BaselinePanel.title")}
            </Typography>
            {paragraphKeys.map((key, i) => (
              <Box
                key={i}
                sx={{
                  position: "relative",
                  p: 1,
                  pl: 2,
                  borderRadius: 1,
                  mb: 1,
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                  pointerEvents: "auto",
                  "&:hover": {
                    backgroundColor: "rgba(21, 79, 137, 0.7)",
                  },
                  "&:hover .MuiSvgIcon-root": {
                    color: theme.palette.primary.light,
                    transform: "scale(1.2)",
                  },
                }}
                onClick={() => {
                  console.log("Paragraph clicked, index:", i)
                  if (i === 0) {
                    handleIconClick()
                  } else {
                    // Use handleFlyTo to update the map view and any related state
                    handleFlyTo(i, isXs, isSm, isMd, isLg, isXl)
                  }
                }}
                role="button"
                aria-label={`View map for paragraph ${i + 1}`}
              >
                <Typography variant="body1" sx={{ mb: 0, lineHeight: 1.4 }}>
                  {t(`BaselinePanel.paragraphs.${key}`)}
                  <VisibilityIcon
                    sx={{
                      ml: 1,
                      transition: "transform 0.2s ease, color 0.2s ease",
                      verticalAlign: "middle",
                    }}
                    aria-hidden="true"
                  />
                </Typography>
              </Box>
            ))}

            {/* Scenario List */}
            <Box
              sx={{
                mb: 2,
                p: "10px",
                backgroundColor: "rgba(21, 79, 137, 0.7)",
                borderRadius: 1,
                pointerEvents: "auto",
              }}
            >
              <Typography
                variant="h6"
                sx={{ mb: 0.5, color: "#fff", fontSize: "0.95rem" }}
              >
                Water Management Scenarios:
              </Typography>
              <List
                sx={{
                  p: 0,
                  gap: 0,
                  mt: 0.5,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <ListItem
                  sx={{
                    cursor: "pointer",
                    pl: 0,
                    py: 0,
                    minHeight: "24px",
                    backgroundColor:
                      activeScenario === 0
                        ? "rgba(255, 255, 255, 0.1)"
                        : "transparent",
                    borderRadius: 1,
                    transition: "background-color 0.3s",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                    },
                  }}
                  onClick={() => applyScenarioColors(0)}
                >
                  <Typography
                    variant="body1" // Changed from body1 to body2 for smaller text
                    sx={{
                      fontWeight: activeScenario === 0 ? "bold" : "normal",
                      py: 0,
                      lineHeight: "2rem",
                    }}
                  >
                    Scenario 1: Baseline scenario
                  </Typography>
                </ListItem>
                <ListItem
                  sx={{
                    cursor: "pointer",
                    pl: 0,
                    py: 0, // Removed vertical padding
                    minHeight: "24px",
                    backgroundColor:
                      activeScenario === 1
                        ? "rgba(255, 255, 255, 0.1)"
                        : "transparent",
                    borderRadius: 1,
                    transition: "background-color 0.3s",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                    },
                  }}
                  onClick={() => applyScenarioColors(1)}
                >
                  <Typography
                    variant="body1" // Changed from body1 to body2 for smaller text
                    sx={{
                      fontWeight: activeScenario === 0 ? "bold" : "normal",
                      py: 0,
                      lineHeight: "2rem",
                    }}
                  >
                    Scenario 2: Baseline scenario with TUCPs
                  </Typography>
                </ListItem>
                <ListItem
                  sx={{
                    cursor: "pointer",
                    pl: 0,
                    py: 0, // Removed vertical padding
                    minHeight: "24px",
                    backgroundColor:
                      activeScenario === 2
                        ? "rgba(255, 255, 255, 0.1)"
                        : "transparent",
                    borderRadius: 1,
                    transition: "background-color 0.3s",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                    },
                  }}
                  onClick={() => applyScenarioColors(2)}
                >
                  <Typography
                    variant="body1" // Changed from body1 to body2 for smaller text
                    sx={{
                      fontWeight: activeScenario === 0 ? "bold" : "normal",
                      py: 0,
                      lineHeight: "2rem",
                    }}
                  >
                    Scenario 3: Baseline scenario with a drier future
                  </Typography>
                </ListItem>
              </List>
            </Box>

            <LearnMoreButton onClick={onLearnMoreClick} />
          </Box>
        </Box>
      </Container>
    )
  },
)

// Helps React DevTools identify this component
BaselinePanel.displayName = "BaselinePanel"
export default BaselinePanel
