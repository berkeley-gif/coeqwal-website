"use client"

import React, { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  Box,
  Typography,
  Stack,
  KeyboardArrowDownIcon,
  VisibilityIcon,
} from "@repo/ui/mui"
import { Header, MiniDrawer, VerticalDivider, LearnMoreButton } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { HeroQuestionsPanel, BasePanel } from "@repo/ui"
import { useScrollTracking } from "./hooks/useScrollTracking"
import { sectionIds, getNavigationItems } from "./config/navigation"
import type { MapboxMapRef } from "@repo/map"
import { useMap } from "@repo/map"

// Dynamic import components that use client-side features
const MapContainer = dynamic(() => import("./components/MapContainer"), {
  ssr: false, // Disable server-side rendering
})

// Dynamic import the map state display
const MapStateDisplay = dynamic(
  () => import("./features/mapControls/MapStateDisplay"),
  {
    ssr: false,
  },
)

// Dynamic import the combined panel
const CombinedPanel = dynamic(
  () => import("./features/combinedPanel/CombinedPanel"),
  {
    ssr: true,
  },
)

export default function Home() {
  const { t } = useTranslation()
  const { mapRef } = useMap()

  useEffect(() => {
    console.log("✅ useEffect in page.tsx running")

    const interval = setInterval(() => {
      if (mapRef?.current) {
        const center = mapRef.current.getMap().getCenter()
        console.log("✅ mapRef is now available:", center)
      } else {
        console.log("❌ mapRef is still null")
      }
    }, 2000) // every 2 seconds

    return () => clearInterval(interval)
  }, [mapRef])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { activeSection, scrollToSection } = useScrollTracking(sectionIds)

  // For the uncontrolled map, we'll store its ref so we can call flyTo
  const uncontrolledRef = useRef<MapboxMapRef | null>(
    null,
  ) as React.RefObject<MapboxMapRef>

  // Custom scroll handler that also closes the drawer
  const handleSectionClick = (sectionId: string) => {
    scrollToSection(sectionId)
    setDrawerOpen(false)
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
        <MapContainer uncontrolledRef={uncontrolledRef} />

        {/* Map State Display */}
        <MapStateDisplay />
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
              headlines={
                (t("heroPanel.headlines") as string[]) || [
                  "How do reservoir operations affect Delta water quality?",
                  "Which water futures support salmon survival?",
                  "How do cities and farms share water in a hotter, drier future?",
                  "Which policies help meet environmental goals?",
                  "What happens if we let our rivers run?",
                ]
              }
              verticalAlignment="center"
              background="light"
              includeHeaderSpacing={false}
              sx={{
                backgroundColor: "rgb(191, 218, 220)",
                "& > div": {
                  // Target the inner Box component
                  marginTop: "-15vh", // Move headlines up by 15% of viewport height
                },
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
                cursor: "default",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                maxWidth: "900px",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "rgba(0, 0, 0, 0.8)",
                  marginBottom: 6,
                  textShadow: "0px 0px 10px rgba(255, 255, 255, 0.5)",
                }}
              >
                {t("heroPanel.scrollText")}
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
                })}
              >
                <KeyboardArrowDownIcon
                  fontSize="large"
                  sx={(theme) => ({
                    color: theme.palette.common.white,
                  })}
                />
              </Box>
            </Box>
          </Box>

          {/* Interstitial Panel */}
          <BasePanel
            fullHeight={false}
            background="dark"
            paddingVariant="very-wide"
            includeHeaderSpacing={false}
            sx={{
              backgroundColor: "rgb(44, 110, 145)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "left",
              pointerEvents: "auto",
            }}
          >
            <Box maxWidth="900px">
              <Stack spacing={2}>
                <Typography variant="body2" color="white">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("interstitial.boldText")}
                  </Box>
                  {" " + t("interstitial.part1")}
                </Typography>
                <Typography
                  variant="body2"
                  color="white"
                  sx={{ fontWeight: 300 }}
                >
                  {t("interstitial.part2")}
                </Typography>
              </Stack>
            </Box>
          </BasePanel>

          {/* Custom California Water panel with two columns */}
          <Box sx={{ pointerEvents: "auto" }} id="california-water-panel">
            <BasePanel
              background="transparent"
              paddingVariant="wide"
              includeHeaderSpacing={false}
              sx={{
                color: (theme) => theme.palette.text.secondary,
              }}
            >
              {/* Custom two-column layout */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  width: "100%",
                }}
              >
                {/* Left column */}
                <Box
                  sx={{
                    width: { xs: "100%", md: "50%" },
                    pr: { md: 4 },
                  }}
                >
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    {t("californiaWater.title")}
                  </Typography>

                  <Stack spacing={1}>
                    <Box
                      sx={{
                        cursor: "pointer",
                        p: 1,
                        borderRadius: 1,
                        transition: "background-color 0.3s ease",
                        "&:hover": {
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                        },
                        "&:hover .MuiSvgIcon-root": {
                          color: "#42a5f5",
                          transform: "scale(1.2)",
                        },
                        "&:active": {
                          backgroundColor: "rgba(25, 118, 210, 0.16)",
                        },
                      }}
                      onClick={() => console.log("Clicked paragraph 1")}
                    >
                      <Typography variant="body1">
                        {t("californiaWater.paragraph1")}
                        <VisibilityIcon
                          sx={{
                            ml: 1,
                            verticalAlign: "middle",
                          }}
                        />
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        cursor: "pointer",
                        p: 1,
                        borderRadius: 1,
                        transition: "background-color 0.3s ease",
                        "&:hover": {
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                        },
                        "&:hover .MuiSvgIcon-root": {
                          color: "#42a5f5",
                          transform: "scale(1.2)",
                        },
                        "&:active": {
                          backgroundColor: "rgba(25, 118, 210, 0.16)",
                        },
                      }}
                      onClick={() => console.log("Clicked paragraph 2")}
                    >
                      <Typography variant="body1">
                        {t("californiaWater.paragraph2")}
                        <VisibilityIcon
                          sx={{
                            ml: 1,
                            verticalAlign: "middle",
                          }}
                          onClick={(e) => {
                            e.stopPropagation()

                            console.log("👁 flyTo clicked", mapRef.current)

                            mapRef.current?.flyTo({
                              center: [-122.305, 37.075],
                              zoom: 7.82,
                              pitch: 60,
                              bearing: 45,
                              duration: 3000, // Optional
                              essential: true,
                            })
                          }}
                        />
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        cursor: "pointer",
                        p: 1,
                        borderRadius: 1,
                        transition: "background-color 0.3s ease",
                        "&:hover": {
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                        },
                        "&:hover .MuiSvgIcon-root": {
                          color: "#42a5f5",
                          transform: "scale(1.2)",
                        },
                        "&:active": {
                          backgroundColor: "rgba(25, 118, 210, 0.16)",
                        },
                      }}
                      onClick={() => console.log("Clicked paragraph 3")}
                    >
                      <Typography variant="body1">
                        {t("californiaWater.paragraph3")}
                        <VisibilityIcon
                          sx={{
                            ml: 1,
                            verticalAlign: "middle",
                          }}
                        />
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        cursor: "pointer",
                        p: 1,
                        borderRadius: 1,
                        transition: "background-color 0.3s ease",
                        "&:hover": {
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                        },
                        "&:hover .MuiSvgIcon-root": {
                          color: "#42a5f5",
                          transform: "scale(1.2)",
                        },
                        "&:active": {
                          backgroundColor: "rgba(25, 118, 210, 0.16)",
                        },
                      }}
                      onClick={() => console.log("Clicked paragraph 4")}
                    >
                      <Typography variant="body1">
                        {t("californiaWater.paragraph4")}
                        <VisibilityIcon
                          sx={{
                            ml: 1,
                            verticalAlign: "middle",
                          }}
                        />
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ mt: 3 }}>
                    <LearnMoreButton
                      onClick={() => setDrawerOpen(true)}
                      variant="outlined"
                      sx={{
                        borderColor: "white",
                        color: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Right column (empty) */}
                <Box sx={{ width: { xs: "100%", md: "50%" } }} />
              </Box>
            </BasePanel>
          </Box>

          {/* To Be Continued Panel */}
          <Box sx={{ pointerEvents: "auto" }}>
            <BasePanel
              background="transparent"
              paddingVariant="wide"
              includeHeaderSpacing={false}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "30vh",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontStyle: "italic",
                  color: "white",
                  textAlign: "center",
                }}
              >
                (to be continued)
              </Typography>
            </BasePanel>
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
