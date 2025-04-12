"use client"

import React, { useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Box, Typography, Button } from "@repo/ui/mui"
import {
  Header,
  MiniDrawer,
  VerticalDivider,
  KeyboardArrowDownIcon,
} from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { TwoColumnPanel, HeroQuestionsPanel } from "@repo/ui"
import { useScrollTracking } from "./hooks/useScrollTracking"
import { sectionIds, getNavigationItems } from "./config/navigation"
import { useMap, MapTransitions } from "@repo/map"
import type { ViewState, MapboxMapRef } from "@repo/map"
import {} from "@repo/map"

// Dynamic import components that use client-side features
const MapContainer = dynamic(() => import("./components/MapContainer"), {
  ssr: false, // Disable server-side rendering
})

// Dynamic import the combined panel
const CombinedPanel = dynamic(
  () => import("./features/combinedPanel/CombinedPanel"),
  {
    ssr: true,
  },
)

export default function Home() {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { activeSection, scrollToSection } = useScrollTracking(sectionIds)
  const { mapRef, withMap } = useMap()

  // ────────────────────────────────────────────────────────────────────────
  // 1) UNCONTROLLED EXAMPLE
  //    Using a local ref for direct imperative control
  //    Using initialViewState, no explicit React state for camera
  // ────────────────────────────────────────────────────────────────────────

  // For the uncontrolled map, we'll store its ref so we can call flyTo
  const uncontrolledRef = useRef<MapboxMapRef | null>(null)

  const handleUncontrolledFlyTo = useCallback(() => {
    // Imperative call on ref-based API
    if (uncontrolledRef.current) {
      uncontrolledRef.current.flyTo(-120, 37, 7, 0, 0, 2000)
    }
  }, [])

  // ────────────────────────────────────────────────────────────────────────
  // 2) CONTROLLED EXAMPLE
  //    Using a local React state that we pass as viewState
  // ────────────────────────────────────────────────────────────────────────

  // For controlled usage, we keep a local piece of state for camera
  const [controlledViewState, setControlledViewState] = useState<ViewState>({
    longitude: -119,
    latitude: 36,
    zoom: 5,
    bearing: 0,
    pitch: 0,
  })

  const handleControlledFlyTo = () => {
    // Instead of relying on viewState transitions, use the flyTo method
    if (mapRef.current) {
      // Call the flyTo method directly with a duration
      mapRef.current.flyTo(-121.5, 38.05, 10, 0, 0, 2000)
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // 3) LAYER ADDING EXAMPLE
  //    Using withMap from the context
  // ────────────────────────────────────────────────────────────────────────
  const handleAddLayer = () => {
    withMap((map) => {
      // Example: Add a simple heatmap layer if it doesn't exist
      if (!map.getSource("water-features")) {
        map.addSource("water-features", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [-121.5, 38.05],
                },
                properties: {
                  name: "Sacramento-San Joaquin Delta",
                  importance: 10,
                },
              },
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [-122.42, 40.72],
                },
                properties: {
                  name: "Shasta Dam",
                  importance: 8,
                },
              },
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [-121.1, 37.06],
                },
                properties: {
                  name: "San Luis Reservoir",
                  importance: 6,
                },
              },
            ],
          },
        })
      }

      if (!map.getLayer("water-heatmap")) {
        map.addLayer({
          id: "water-heatmap",
          type: "heatmap",
          source: "water-features",
          paint: {
            "heatmap-weight": ["get", "importance"],
            "heatmap-intensity": 0.8,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0, 0, 255, 0)",
              0.2,
              "royalblue",
              0.4,
              "cyan",
              0.6,
              "lime",
              0.8,
              "yellow",
              1,
              "red",
            ],
            "heatmap-radius": 30,
            "heatmap-opacity": 0.8,
          },
        })
      }
    })
  }

  // Simple flyTo function that works with context mapRef
  const flyToLocation = (longitude: number, latitude: number, zoom: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo(longitude, latitude, zoom)
    }
  }

  // Custom scroll handler that also closes the drawer
  const handleSectionClick = (sectionId: string) => {
    scrollToSection(sectionId)
    setDrawerOpen(false)
  }

  // Direct scroll to combined panel with offset
  const scrollToQuestionBuilder = () => {
    const element = document.getElementById("combined-panel-container")
    if (element) {
      // Calculate the element's position relative to the document
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const offset = rect.top + scrollTop + 120 // Reduced from 200px to 120px

      // Scroll to the calculated position
      window.scrollTo({
        top: offset,
        behavior: "smooth",
      })
    }
  }

  // Get navigation items with the current active section and translation function
  const navigationItems = getNavigationItems(
    activeSection,
    handleSectionClick,
    t,
  )

  return (
    <>
      {/* ===== Background Map Layer ===== */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "all",
          zIndex: -1,
        }}
      >
        <MapContainer
          uncontrolledRef={uncontrolledRef}
          viewState={controlledViewState}
          onViewStateChange={(newViewState) =>
            setControlledViewState(newViewState)
          }
        />
      </Box>

      {/* ===== Navigation Sidebar ===== */}
      <Box
        sx={{
          pointerEvents: "none",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Box sx={{ pointerEvents: "auto" }}>
          <MiniDrawer
            items={navigationItems}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            position="right"
            title="Learn"
          />
        </Box>
      </Box>

      {/* ===== Drawer "border" ===== */}
      <VerticalDivider
        right={(theme) =>
          drawerOpen
            ? theme.layout.drawer.width
            : theme.layout.drawer.closedWidth
        }
        animated
      />

      {/* ===== Main Content Area ===== */}
      <Box
        className="no-scroll-snap"
        sx={(theme) => ({
          position: "relative",
          zIndex: 20,
          pointerEvents: "none",
          marginRight: drawerOpen
            ? `${theme.layout.drawer.width}px`
            : `${theme.layout.drawer.closedWidth}px`,
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: drawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        })}
      >
        {/* Header - Enable pointer events */}
        <Box sx={{ pointerEvents: "auto" }}>
          <Header drawerOpen={drawerOpen} drawerPosition="right" />
        </Box>

        {/* Main content sections */}
        <Box
          component="main"
          sx={{
            position: "relative",
          }}
        >
          {/* Hero Questions Panel */}
          <Box
            sx={{
              pointerEvents: "auto",
              position: "relative",
              zIndex: 5,
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <HeroQuestionsPanel
              headlines={[
                "How do reservoir operations affect Delta outflow?",
                "What scenarios improve salmon survival?",
                "Can we balance urban and agricultural needs in a hotter and drier future?",
                "Which policies help meet environmental goals?",
                "How do flow changes impact water availability?",
              ]}
              verticalAlignment="center"
              background="light"
              sx={{
                backgroundColor: "rgb(191, 218, 220)",
              }}
            />

            {/* Original VideoPanel - commented out for future reference 
            <VideoPanel
              title={t("heroPanel.title")}
              content={t<string[]>("heroPanel.content") || []}
              videoSrc="/video/background.mp4"
              posterSrc="/video/poster.jpg"
              overlayOpacity={0}
            />
            */}

            {/* Content and Scroll Down Button */}
            <Box
              sx={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                maxWidth: "600px",
                textAlign: "center",
              }}
              onClick={() => scrollToQuestionBuilder()}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "rgba(0, 0, 0, 0.8)",
                  marginBottom: 6,
                  textShadow: "0px 0px 10px rgba(255, 255, 255, 0.5)",
                }}
              >
                Water connects us. Explore California&apos;s water system and
                discover possibilities for the future of water in our state.
              </Typography>

              <Box
                sx={(theme) => ({
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.palette.common.white,
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                  },
                })}
              >
                <KeyboardArrowDownIcon
                  fontSize="large"
                  sx={(theme) => ({
                    color: theme.palette.common.white,
                    "&:hover": {
                      color: theme.palette.common.white,
                    },
                  })}
                />
              </Box>
            </Box>
          </Box>

          {/* Two Column Panel with map controls */}
          <Box sx={{ pointerEvents: "auto" }} id="california-water-panel">
            <TwoColumnPanel
              leftTitle="Map Controls Demo"
              leftContent={
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="body1">
                    This panel demonstrates different ways to interact with the
                    map:
                  </Typography>

                  {/* Map Interaction Examples */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      1. Uncontrolled (Ref-based) Approach:
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUncontrolledFlyTo}
                      sx={{ textTransform: "none" }}
                    >
                      Uncontrolled FlyTo (Default Transition)
                    </Button>

                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mt: 2 }}
                    >
                      2. Controlled (State-based) Approach:
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleControlledFlyTo}
                      sx={{ textTransform: "none" }}
                    >
                      Controlled FlyTo (Default Transition)
                    </Button>

                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mt: 2 }}
                    >
                      3. Add Map Layer (withMap):
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddLayer}
                      sx={{ textTransform: "none" }}
                    >
                      Add Water Features Heatmap
                    </Button>

                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mt: 2 }}
                    >
                      4. Context-based FlyTo (used in the existing app):
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Using default transition with a simple easing function:
                    </Typography>
                    <Button
                      variant="standard"
                      color="primary"
                      onClick={() => flyToLocation(-121.5, 38.05, 10)}
                      sx={{ textTransform: "none" }}
                    >
                      Sacramento-San Joaquin Delta
                    </Button>
                    <Button
                      variant="standard"
                      color="primary"
                      onClick={() => flyToLocation(-122.42, 40.72, 12)}
                      sx={{ textTransform: "none" }}
                    >
                      Shasta Dam
                    </Button>
                    <Button
                      variant="standard"
                      color="primary"
                      onClick={() => flyToLocation(-121.1, 37.06, 12)}
                      sx={{ textTransform: "none" }}
                    >
                      San Luis Reservoir
                    </Button>

                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mt: 4, mb: 1 }}
                    >
                      5. Transition Styles Demo:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Transitions control how the camera moves between
                      locations, including duration, easing functions, pitch,
                      and bearing effects:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Try different camera transitions to the Delta area:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => mapRef.current?.flyTo(-121.5, 38.05, 10)}
                        sx={{ textTransform: "none" }}
                      >
                        Default
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          mapRef.current?.flyTo(
                            -121.5,
                            38.05,
                            10,
                            undefined,
                            undefined,
                            undefined,
                            MapTransitions.SMOOTH,
                          )
                        }
                        sx={{ textTransform: "none" }}
                      >
                        Smooth
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          mapRef.current?.flyTo(
                            -121.5,
                            38.05,
                            10,
                            undefined,
                            undefined,
                            undefined,
                            MapTransitions.DRAMATIC,
                          )
                        }
                        sx={{ textTransform: "none" }}
                      >
                        Dramatic
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          mapRef.current?.flyTo(
                            -121.5,
                            38.05,
                            10,
                            undefined,
                            undefined,
                            undefined,
                            MapTransitions.AERIAL,
                          )
                        }
                        sx={{ textTransform: "none" }}
                      >
                        Aerial
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          mapRef.current?.flyTo(
                            -121.5,
                            38.05,
                            10,
                            undefined,
                            undefined,
                            undefined,
                            MapTransitions.CINEMATIC,
                          )
                        }
                        sx={{ textTransform: "none" }}
                      >
                        Cinematic
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          mapRef.current?.flyTo(
                            -121.5,
                            38.05,
                            10,
                            undefined,
                            undefined,
                            undefined,
                            MapTransitions.QUICK,
                          )
                        }
                        sx={{ textTransform: "none" }}
                      >
                        Quick
                      </Button>
                    </Box>
                  </Box>
                </Box>
              }
              background="transparent"
              sx={{
                color: (theme) => theme.palette.text.secondary,
                "& .MuiTypography-root": {
                  color: "inherit",
                },
              }}
            />
          </Box>

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="combined-panel-container">
            <CombinedPanel />
          </Box>
        </Box>
      </Box>
    </>
  )
}
