"use client"

/**
 * LearnPanel
 *
 * Learn tab content uses the persistent map from page level.
 *
 * Architecture:
 * - Calls setMapMode('learn') on mount to configure the persistent map
 * - The actual map lives in PersistentMap at the page level
 * - Overlay content scrolls over the persistent map
 * - Map "releases" from fixed position when scrollytelling ends
 *
 * The persistent map approach means:
 * - No map remounting when switching tabs
 * - WebGL context stays alive (performance)
 * - Map is preloaded during IntroSection scroll
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { Box, useTheme, Typography } from "@repo/ui/mui"
import MapOverlayPanels from "../../features/map/overlays/MapOverlayPanels"
import { useMapReady, useMapError, mapActions, useActiveSection } from "../../features/map/store"
import { InfoCard, InfoCardGrid } from "@repo/ui"
import { usePanelRoute } from "../../hooks/usePanelRoute"
import { WATER_ISSUE_THEMES } from "../../features/scenarioExplorer/getStarted/content"

import VerticalNav from "../verticalNav/VerticalNav"

export default function LearnPanel() {
  const mapReady = useMapReady()
  const mapError = useMapError()
  const theme = useTheme()
  const scrollytellingRef = useRef<HTMLDivElement>(null)
  const activeSubSection = useActiveSection()
  const [activeSection, setActiveSection] = useState("get-started")
  const { openThemePanel } = usePanelRoute()

  // Set map mode to 'learn' on mount, reset to 'hidden' on unmount
  useEffect(() => {
    // Reset Learn-specific state and activate Learn mode
    mapActions.resetLearnState()
    mapActions.setMapMode("learn")

    return () => {
      // Hide the map when leaving Learn tab
      mapActions.setMapMode("hidden")
      mapActions.setLearnMapScrollOffset(0)
    }
  }, [])

  // Track scroll to "release" the map when scrollytelling ends
  const handleScroll = useCallback(() => {
    const container = scrollytellingRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const windowHeight = window.innerHeight

    // When bottom of scrollytelling container is above the viewport bottom,
    // start scrolling the map up with the content
    const containerBottom = rect.bottom
    const releasePoint = windowHeight // When container bottom reaches viewport bottom

    if (containerBottom < releasePoint) {
      // Calculate how much the map should scroll up
      const offset = releasePoint - containerBottom
      mapActions.setLearnMapScrollOffset(offset)
    } else {
      // Map stays fixed
      mapActions.setLearnMapScrollOffset(0)
    }
  }, [])

  const handleNavigate = useCallback((sectionId: string) => {
    setActiveSection(sectionId)
    if (sectionId !== "get-started") {
      mapActions.setMapMode("hidden")
    } else {
      mapActions.setMapMode("learn")
    }
  }, [])

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  return (
    <>
      <VerticalNav activeSectionId={activeSection} activeSubSectionId={activeSubSection} onNavigate={handleNavigate} />
      {activeSection === "get-started" && (
        <div
          style={{
            position: "relative",
            pointerEvents: "none", // Allow map panning through - child elements re-enable as needed
          }}
        >
          {/* 
        Scrollytelling Container
        The persistent map is positioned fixed at page level.
        When this container's bottom scrolls above the viewport,
        the map "releases" and scrolls up with the content.
      */}
          <Box
            ref={scrollytellingRef}
            sx={{
              position: "relative",
              minHeight: "100vh",
              // Transparent background - map shows through
              backgroundColor: "transparent",
              pointerEvents: "none", // Allow map panning
            }}
          >
            {/* Spacer for the initial map view - transparent, allows map panning */}
            <Box
              sx={{
                height: "100vh",
                backgroundColor: "transparent",
                pointerEvents: "none",
              }}
            />

            {/* Overlay content - scrolls over the fixed persistent map */}
            <Box
              sx={{
                position: "relative",
                marginTop: "-100vh", // Pull up to overlap the map area
                zIndex: 1,
                pointerEvents: "none", // Let map interactions through
                backgroundColor: "transparent",
              }}
            >
              {mapReady || mapError ? (
                <MapOverlayPanels />
              ) : (
                <Box
                  sx={{
                    height: "200vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.palette.common.white,
                    flexDirection: "column",
                    gap: theme.space.gap.lg,
                    pointerEvents: "none", // Don't block map panning while loading

                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.borderRadius.circle,
                      border: "3px solid",
                      borderColor: "grey.300",
                      borderTopColor: "primary.main",
                      animation: "spin 1s linear infinite",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                  Loading map...
                </Box>
              )}
            </Box>
          </Box>
        </div>
      )}
      {activeSection === "water-issues" && (
        <Box sx={{
          p: 4, color: theme.palette.common.white, backgroundColor: theme.palette.blue.dark, minHeight: "100vh",
          paddingTop: (theme) => theme.space.panel.paddingXl,
          paddingLeft: (theme) => theme.space.panel.paddingXl,
          paddingRight: (theme) => theme.space.panel.padding,
        }}>
          <Typography
            variant="h3"
            sx={{ maxWidth: "66%" }}
          >
            What water issues matter to you?
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: "66%", mt: theme.space.listGap.sm }}
          >
            Water is important to all of us — from farmers in the Central
            Valley to communities in the Delta, from salmon in the Sacramento
            River to urban water users in Los Angeles. We can consider how
            decisions affect the issues people care about.
          </Typography>
          <Box sx={{ mt: theme.space.listGap.sm }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: theme.space.listGap.xs}}>
              Click on each water issue to learn more.
            </Typography>
            <InfoCardGrid columns={5}>
              {WATER_ISSUE_THEMES.map(({ title, description, themeKey, dimmed }) => (
                <InfoCard
                  key={themeKey}
                  title={title}
                  description={description}
                  onClick={dimmed ? undefined : () => openThemePanel(themeKey)}
                  dimmed={dimmed}
                  variant="onDark"
                />
              ))}
            </InfoCardGrid>
          </Box>

        </Box>
      )}

      {activeSection === "water-stories" && (
        <Box sx={{ p: 4, color: "black", backgroundColor: "white", minHeight: "100vh" }}>
          Water Stories — content coming soon
        </Box>
      )}
    </>

  )
}
