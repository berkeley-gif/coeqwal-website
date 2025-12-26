"use client"

/**
 * ScenarioExplorer - Main scenario exploration interface
 *
 * Provides tabbed views for exploring scenarios: List, Data Explorer,
 * About, and Comparison modes.
 */

import React, { useState } from "react"
import {
  Box,
  Tabs,
  Tab,
  useTheme,
  IconButton,
  Tooltip,
  Typography,
  ViewListIcon,
  CompareArrowsIcon,
} from "@repo/ui/mui"
import Image from "next/image"
import AboutScenariosView from "./views/AboutScenariosView"
import UnifiedExploreView, {
  type ExploreMode,
} from "./views/UnifiedExploreView"
import DataExplorerView from "./views/DataExplorerView/DataExplorerView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"
import { HydroclimateChooser } from "../scenarios/components"
import { ComparisonHeader } from "./components/ComparisonHeader"

type MainView = "about" | "explorer" | "data"

/**
 * ScenarioExplorer
 *
 * Three main views:
 * - About: Introduction explaining COEQWAL scenarios, the tier system, and outcomes
 * - Explorer: Unified view with list/map/comparison modes (with smooth transitions)
 * - Data: Detailed data comparison and exports
 *
 * The Explorer view handles its own internal mode switching (list ↔ map ↔ comparison)
 * with animated transitions. The persistent map shows through in map mode.
 */
export default function ScenarioExplorerNew() {
  const theme = useTheme()
  const [mainView, setMainView] = useState<MainView>("explorer")
  const [exploreMode, setExploreMode] = useState<ExploreMode>("list")

  // Track highlighted scenario for comparison chart (shared between header and chart)
  const [highlightedScenario, setHighlightedScenario] = useState<string | null>(
    null,
  )

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: MainView,
  ) => {
    setMainView(newValue)
  }

  // Toggle handler for scenario highlighting
  const handleScenarioClick = (scenarioId: string) => {
    setHighlightedScenario((prev) => (prev === scenarioId ? null : scenarioId))
  }

  // Map mode in explorer needs transparent background so persistent map shows through
  const needsTransparentBg = mainView === "explorer" && exploreMode === "map"

  return (
    <Box
      sx={{
        // Fill the parent container (TabPanel sets height for explore tab)
        height: "100%",
        backgroundColor: needsTransparentBg
          ? "transparent"
          : theme.palette.explore.background,
        color: theme.palette.text.primary,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Allow map panning through when in map mode
        pointerEvents: needsTransparentBg ? "none" : "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          // Allow map panning through when in map mode
          pointerEvents: needsTransparentBg ? "none" : "auto",
        }}
      >
        {/* Header section - sticky to stay visible */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: theme.zIndex.pageContent,
            flexShrink: 0,
            pointerEvents: "auto", // Keep header interactive even when parent is "none"
          }}
        >
          {/* Tab Navigation */}
          <Box
            sx={{
              backgroundColor: theme.palette.common.white,
              borderBottom: theme.border.medium,
              px: theme.spacing(theme.cards.spacing.standard),
            }}
          >
            <Tabs
              value={mainView}
              onChange={handleTabChange}
              TabIndicatorProps={{
                style: {
                  height: 3,
                  backgroundColor: theme.palette.blue.bright,
                },
              }}
              sx={{
                minHeight: theme.spacing(7),
                "& .MuiTab-root": {
                  ...theme.typography.body2,
                  minHeight: theme.spacing(7),
                  textTransform: "none",
                  fontWeight: theme.typography.fontWeightMedium,
                  color: theme.palette.text.primary,
                  transition: theme.transition.default,
                  borderTopLeftRadius: theme.shape.borderRadius,
                  borderTopRightRadius: theme.shape.borderRadius,
                  marginTop: theme.spacing(1),
                  marginRight: theme.spacing(0.5),
                  paddingLeft: theme.spacing(3),
                  paddingRight: theme.spacing(3),
                  "&.Mui-selected": {
                    color: theme.palette.blue.bright,
                    fontWeight: theme.typography.fontWeightBold,
                    backgroundColor: `${theme.palette.blue.bright}1A`,
                  },
                  "&:hover:not(.Mui-selected)": {
                    color: theme.palette.blue.dark,
                    backgroundColor: `${theme.palette.blue.bright}1A`,
                  },
                },
              }}
            >
              <Tab label="About COEQWAL scenarios" value="about" />
              <Tab label="Choose scenarios" value="explorer" />
              <Tab label="Data explorer" value="data" />
            </Tabs>
          </Box>

          {/* Selection Banner - only show when exploring data */}
          {(mainView === "explorer" || mainView === "data") && (
            <SelectionBanner />
          )}

          {/* Search bar row for explorer view - 50/50 split when in map or comparison mode */}
          {mainView === "explorer" && (
            <Box
              sx={{
                display: "flex",
                width: "100%",
              }}
            >
              {/* Left side: Search bar with controls (100% in list mode, 50% in map/comparison) */}
              <Box
                sx={{
                  width: exploreMode === "list" ? "100%" : "50%",
                  transition: theme.transition.layout,
                  backgroundColor: theme.palette.common.white,
                }}
              >
                <SearchBar
                  placeholder="Search scenarios by name or description"
                  rightContent={
                    <>
                      {/* Divider after search */}
                      <Box
                        sx={{
                          width: "1px",
                          alignSelf: "stretch",
                          backgroundColor: theme.palette.grey[300],
                          minHeight: 40,
                        }}
                      />

                      {/* View mode section */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          // 10px header-to-content spacing
                          gap: 1.25,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: theme.typography.fontWeightMedium,
                            color: theme.palette.grey[900],
                          }}
                        >
                          View
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: theme.spacingTokens.gap.xs,
                          }}
                        >
                          <Tooltip title="List view" arrow>
                            <IconButton
                              onClick={() => setExploreMode("list")}
                              sx={{
                                // Match hydroclimate icon container size (28-32px)
                                width: { xs: 28, lg: 32 },
                                height: { xs: 28, lg: 32 },
                                backgroundColor:
                                  exploreMode === "list"
                                    ? `${theme.palette.blue.bright}1A`
                                    : "transparent",
                                color:
                                  exploreMode === "list"
                                    ? theme.palette.blue.bright
                                    : theme.palette.grey[600],
                                "&:hover": {
                                  backgroundColor: `${theme.palette.blue.bright}1A`,
                                },
                              }}
                            >
                              <ViewListIcon sx={{ fontSize: "1.25rem" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Map view" arrow>
                            <IconButton
                              onClick={() => setExploreMode("map")}
                              sx={{
                                // Match hydroclimate icon container size (28-32px)
                                width: { xs: 28, lg: 32 },
                                height: { xs: 28, lg: 32 },
                                backgroundColor:
                                  exploreMode === "map"
                                    ? `${theme.palette.blue.bright}1A`
                                    : "transparent",
                                "&:hover": {
                                  backgroundColor: `${theme.palette.blue.bright}1A`,
                                },
                              }}
                            >
                              <Image
                                src="/images/icons/map.svg"
                                alt="Map view"
                                width={20}
                                height={20}
                                style={{
                                  opacity: exploreMode === "map" ? 1 : 0.6,
                                }}
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Comparison view" arrow>
                            <IconButton
                              onClick={() => setExploreMode("comparison")}
                              sx={{
                                // Match hydroclimate icon container size (28-32px)
                                width: { xs: 28, lg: 32 },
                                height: { xs: 28, lg: 32 },
                                backgroundColor:
                                  exploreMode === "comparison"
                                    ? `${theme.palette.blue.bright}1A`
                                    : "transparent",
                                color:
                                  exploreMode === "comparison"
                                    ? theme.palette.blue.bright
                                    : theme.palette.grey[600],
                                "&:hover": {
                                  backgroundColor: `${theme.palette.blue.bright}1A`,
                                },
                              }}
                            >
                              <CompareArrowsIcon sx={{ fontSize: "1.25rem" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Divider */}
                      <Box
                        sx={{
                          width: "1px",
                          alignSelf: "stretch",
                          backgroundColor: theme.palette.grey[300],
                          minHeight: 40,
                        }}
                      />

                      {/* Hydroclimate chooser */}
                      <HydroclimateChooser
                        layout="horizontal"
                        size="small"
                        showTitle={true}
                        showLabels={false}
                      />
                    </>
                  }
                />
              </Box>

              {/* Right 50%: Content varies by mode */}
              {exploreMode !== "list" && (
                <Box
                  sx={{
                    width: "50%",
                    // Map mode: transparent to let map show through
                    // Comparison mode: white background with header content
                    backgroundColor:
                      exploreMode === "map"
                        ? "transparent"
                        : theme.palette.common.white,
                    borderLeft:
                      exploreMode === "comparison"
                        ? theme.border.medium
                        : "none",
                    borderBottom:
                      exploreMode === "comparison"
                        ? theme.border.medium
                        : "none",
                    // Allow map interaction through this area in map mode
                    pointerEvents: exploreMode === "map" ? "none" : "auto",
                  }}
                >
                  {/* Comparison header only in comparison mode */}
                  {exploreMode === "comparison" && (
                    <ComparisonHeader
                      highlightedScenario={highlightedScenario}
                      onScenarioClick={handleScenarioClick}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* View content */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            // Allow map panning through when in map mode (UnifiedExploreView handles its own pointer events)
            pointerEvents: needsTransparentBg ? "none" : "auto",
          }}
        >
          {mainView === "about" && <AboutScenariosView />}
          {mainView === "explorer" && (
            <UnifiedExploreView
              mode={exploreMode}
              highlightedScenario={highlightedScenario}
              onScenarioClick={handleScenarioClick}
            />
          )}
          {mainView === "data" && (
            <DataExplorerView
              onNavigateToExplorer={() => setMainView("explorer")}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
