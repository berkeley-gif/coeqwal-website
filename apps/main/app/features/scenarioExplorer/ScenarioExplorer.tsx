"use client"

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
import { HydroClimateChooser } from "../../components/HydroClimateChooser"
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: MainView) => {
    setMainView(newValue)
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
            zIndex: 10,
            flexShrink: 0,
            pointerEvents: "auto", // Keep header interactive even when parent is "none"
          }}
        >
          {/* Tab Navigation */}
          <Box
            sx={{
              backgroundColor: theme.palette.common.white,
              borderBottom: theme.border.standard,
              borderColor: theme.palette.grey[300],
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
                minHeight: theme.spacing(7),
                fontSize: theme.typography.body2.fontSize,
                textTransform: "none",
                fontWeight: theme.typography.fontWeightMedium,
                color: theme.palette.text.primary,
                transition: "all 0.2s ease-in-out",
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
            <Tab label="Explore scenarios" value="explorer" />
            <Tab label="Data explorer" value="data" />
          </Tabs>
          </Box>

          {/* Selection Banner - only show when exploring data */}
          {(mainView === "explorer" || mainView === "data") && <SelectionBanner />}

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
                  transition: "width 0.3s ease-in-out",
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
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: theme.typography.fontWeightMedium,
                            fontSize: theme.typography.caption.fontSize,
                            color: theme.palette.grey[900],
                          }}
                        >
                          View
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Tooltip title="List view" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setExploreMode("list")}
                              sx={{
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
                              <ViewListIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Map view" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setExploreMode("map")}
                              sx={{
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
                                width={24}
                                height={24}
                                style={{ opacity: exploreMode === "map" ? 1 : 0.6 }}
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Comparison view" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setExploreMode("comparison")}
                              sx={{
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
                              <CompareArrowsIcon fontSize="small" />
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
                      <HydroClimateChooser
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
                        ? theme.border.standard
                        : "none",
                    borderBottom:
                      exploreMode === "comparison"
                        ? theme.border.standard
                        : "none",
                    borderColor: theme.palette.grey[300],
                    // Allow map interaction through this area in map mode
                    pointerEvents: exploreMode === "map" ? "none" : "auto",
                  }}
                >
                  {/* Comparison header only in comparison mode */}
                  {exploreMode === "comparison" && <ComparisonHeader />}
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
            <UnifiedExploreView mode={exploreMode} />
          )}
          {mainView === "data" && <DataExplorerView />}
        </Box>
      </Box>
    </Box>
  )
}
