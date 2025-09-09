"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { TwoColumnPanel, GlossaryLinkedText } from "@repo/ui"
import {
  Box,
  Typography,
  useTheme,
  Theme,
  Button,
  LocationOnIcon,
} from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { useCalSimToggle } from "./CalSimContext"
import { useDrawerStore } from "@repo/state"
import { motion } from "@repo/motion"

export default function MapOverlayPanels() {
  const theme = useTheme()
  const { t } = useTranslation()
  const { isCalSimVisible, toggleCalSim, showBasins, toggleBasins } =
    useCalSimToggle()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  // Animation state for first panel entrance
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)
  const firstPanelRef = useRef<HTMLDivElement>(null)

  // Handler to open glossary to specific entry
  const handleGlossaryOpen = useCallback(
    (glossaryEntry: string) => {
      setDrawerContent({
        selectedTerm: glossaryEntry,
      })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )

  // Intersection observer for first panel entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "california-map" && entry.isIntersecting) {
            setIsFirstPanelVisible(true)
            console.log(
              "🎬 California map entered viewport - triggering panel slide-up animation",
            )
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% of panel is visible
        rootMargin: "0px 0px -200px 0px", // Delay trigger until well into viewport
      },
    )

    // Observe the California map panel instead - trigger when map becomes sticky
    const mapPanel = document.getElementById("california-map")
    if (mapPanel) {
      observer.observe(mapPanel)
      console.log("👀 Observing California map panel for entrance animation")
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  // Shared style for overlay panel content boxes, for now
  const overlayPanelStyle = {
    maxWidth: (theme: Theme) => theme.layout.textContainer.maxWidth,
    backgroundColor: (theme: Theme) => theme.palette.brand.sky, // Same as home panel gradient start
    backdropFilter: "blur(10px)",
    borderRadius: (theme: Theme) => theme.borderRadius.card,
    padding: (theme: Theme) => theme.layout.spacing.lg,
    pointerEvents: "auto", // Re-enable pointer events for the content box
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  }

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content, // Above the sticky map
        pointerEvents: "none", // Allow markers to be clickable through overlays
        marginTop: "-100vh", // Pull up to overlay the sticky map immediately
      }}
    >
      {/* Tools Panel - Right-side overlay */}
      <TwoColumnPanel
        id="tools-overlay"
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={false}
        contentColumn="right"
        contentAlignment={{
          justifyContent: "center", // Center vertically in viewport
          alignItems: "flex-end", // Keep right alignment
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
          paddingLeft: 0, // Remove TwoColumnPanel's default padding that blocks clicks
          paddingRight: 0, // Ditto
        }}
        rightContent={
          <motion.div
            initial={{ marginTop: "100vh", opacity: 0 }} // Start one viewport below, hidden
            animate={{
              marginTop: isFirstPanelVisible ? 0 : "100vh", // Slide up to natural position over sticky map
              opacity: isFirstPanelVisible ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 40, // Lower stiffness for gentler movement
              damping: 30, // Higher damping for smoother, less bouncy settling
              duration: 1.8, // Longer duration for elegant entrance ✨
              // Separate faster timing for opacity
              opacity: {
                duration: 0.6, // Much faster opacity fade-in
                ease: "easeOut",
              },
            }}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end", // Ensure right alignment is maintained
            }}
          >
            <Box
              ref={firstPanelRef}
              sx={{
                ...overlayPanelStyle,
                mr: { xs: 8, md: 16 },
              }}
            >
              <Typography
                variant="h3"
                component="h3"
                sx={{
                  color: (theme) => theme.palette.blue.darkest,
                }}
              >
                {t("toolsPanel.title")}
              </Typography>

              <Typography variant="body1" fontWeight="bold">
                {t("toolsPanel.boldText")}
              </Typography>

              <Box
                sx={{
                  color: (theme) => theme.palette.blue.darkest,
                  mb: 2,
                  fontSize: "1rem",
                  lineHeight: 1.5,
                }}
              >
                <GlossaryLinkedText
                  text={t("toolsPanel.content")}
                  terms={[
                    { name: "CalSim", glossaryTerm: "CalSim" },
                    {
                      name: "California's major water projects",
                      glossaryTerm: "California's major water projects",
                    },
                    { name: "Central Valley", glossaryTerm: "Central Valley" },
                  ]}
                  onActivate={handleGlossaryOpen}
                  color={theme.palette.blue.darkest}
                  underlineColor={theme.palette.blue.medium}
                />
              </Box>

              {/* CalSim toggle button */}
              <Button
                variant="standard"
                onClick={toggleCalSim}
                sx={{
                  backgroundColor: isCalSimVisible
                    ? (theme) => theme.palette.accent.gold
                    : (theme) => theme.palette.common.white,
                  color: isCalSimVisible
                    ? (theme) => theme.palette.utility.black
                    : (theme) => theme.palette.blue.darkest,
                  "&:hover": {
                    backgroundColor: isCalSimVisible
                      ? (theme) => theme.palette.accent.cream
                      : (theme) => theme.palette.grey[100],
                  },
                  mb: 1,
                }}
              >
                {isCalSimVisible
                  ? "Hide CalSim Network"
                  : "Show CalSim Network"}
              </Button>

              {/* CalSim Legend */}
              {isCalSimVisible && (
                <Box sx={{ mt: (theme) => theme.spacing(1) }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: (theme) => theme.spacing(1.5) }}
                  >
                    Legend
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: (theme) => theme.spacing(1),
                      columnGap: (theme) => theme.spacing(2),
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: (theme) => theme.spacing(2),
                      }}
                    >
                      {/* Full replica of reservoir marker for legend */}
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
                            fontSize: "4.5rem", // Make it bigger to match the largest actual markers
                            color: (theme) => theme.palette.brand.sky,
                            flexShrink: 0,
                            // Enhanced shadow for better contrast against panel background
                            filter:
                              "drop-shadow(0 4px 8px rgba(0,0,0,0.3)) drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                            "&:hover": { transform: "scale(1.05)" },
                            transition: "all 0.2s ease",
                            // Add white outline to differentiate from panel background
                            WebkitTextStroke: "2px white",
                            textShadow:
                              "2px 2px 4px rgba(0,0,0,0.3), -2px -2px 4px rgba(0,0,0,0.3), 2px -2px 4px rgba(0,0,0,0.3), -2px 2px 4px rgba(0,0,0,0.3)",
                          }}
                        />
                        {/* TAF circle matching the actual markers */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: "15%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "2rem", // Scale up the circle proportionally
                            height: "2rem",
                            borderRadius: "50%",
                            backgroundColor: (theme) =>
                              theme.palette.blue.medium,
                            border: "1px solid rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem", // Scale up text size
                            lineHeight: 1.2,
                            fontWeight: "bold",
                            color: "white",
                            pointerEvents: "none",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            textAlign: "center",
                          }}
                        >
                          <Box component="span" sx={{ fontSize: "0.65rem" }}>
                            4.6K
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              fontSize: "calc(0.65rem * 0.7)", // Smaller font for units
                              lineHeight: 1.2,
                              marginTop: "-0.1rem",
                            }}
                          >
                            TAF
                          </Box>
                        </Box>

                        {/* Reservoir name label positioned on the stalk */}
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: "25%", // Position on the stalk of the location marker
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(4px)",
                            borderRadius: "12px",
                            padding: "3px 8px",
                            boxShadow: (theme) => theme.shadows[1],
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
                            Reservoir
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2">
                        Major reservoirs with capacity in thousand acre feet
                        (TAF)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: (theme) => theme.spacing(1),
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        backgroundColor: (theme) => theme.palette.brand.sky, // Same as overlay panel
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.3)", // Semi-transparent white
                        },
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={toggleBasins}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "16px", // Same as map basin labels
                          fontWeight: "bold",
                          color: "#ffffff",
                          textAlign: "center",
                          lineHeight: 1.1,
                          textShadow: "0 0 3px #3a4574, 0 0 6px #3a4574", // Smooth glow effect instead of harsh outline
                          fontFamily: "Neue Haas Grotesk, Arial, sans-serif",
                          opacity: showBasins ? 1 : 0.6,
                          transition: "all 0.2s ease",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                      >
                        {showBasins ? "Basins" : "Show Basins"}
                      </Typography>
                    </Box>
                    {/* Sacramento River nodes - deeper blue */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: (theme) => theme.spacing(1),
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#186b88", // theme.palette.blue.dark
                          border: "1px solid #ffffff", // Finer white stroke
                          boxShadow: (theme) => theme.shadows[1],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">
                        Sacramento River nodes
                      </Typography>
                    </Box>

                    {/* San Joaquin River nodes - purple */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: (theme) => theme.spacing(1),
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#7b1fa2", // Purple
                          border: "1px solid #ffffff", // Finer white stroke
                          boxShadow: (theme) => theme.shadows[1],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">
                        San Joaquin River nodes
                      </Typography>
                    </Box>

                    {/* California Aqueduct nodes - gold */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: (theme) => theme.spacing(1),
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#ffd87e", // theme.palette.accent.gold
                          border: "1px solid #ffffff", // Finer white stroke
                          boxShadow: (theme) => theme.shadows[1],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">
                        California Aqueduct nodes
                      </Typography>
                    </Box>

                    {/* Delta Mendota Canal nodes - earth brown */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: (theme) => theme.spacing(1),
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#c2a14f", // theme.palette.nature.earth
                          border: "1px solid #ffffff", // Finer white stroke
                          boxShadow: (theme) => theme.shadows[1],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">
                        Delta Mendota Canal nodes
                      </Typography>
                    </Box>

                    {/* All other nodes - sky blue (map panel color) */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: (theme) => theme.spacing(1),
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#92C1D5", // theme.palette.brand.sky - map panel color
                          border: "1px solid #ffffff", // Finer white stroke
                          boxShadow: (theme) => theme.shadows[1],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">
                        Other system nodes
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </motion.div>
        }
      />

      {/* Scenarios Panel - Right-side overlay */}
      <TwoColumnPanel
        id="scenarios-overlay"
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={false}
        contentColumn="right"
        contentAlignment={{
          justifyContent: "center", // Center vertically in viewport
          alignItems: "flex-end", // Align panels to the right edge
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
          paddingLeft: 0, // Remove TwoColumnPanel's default padding that blocks clicks
          paddingRight: 0, // Same as above
        }}
        rightContent={
          <Box
            sx={{
              ...overlayPanelStyle,
              mr: { xs: 8, md: 16 },
            }}
          >
            <Typography
              variant="h3"
              component="h3"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
              }}
            >
              Rethink California water
            </Typography>

            <Box
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            >
              <GlossaryLinkedText
                text={t("scenariosPanel.part1")}
                terms={[
                  { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                  { name: "CalSim", glossaryTerm: "CalSim" },
                  {
                    name: "operational strategies",
                    glossaryTerm: "Operational strategies",
                  },
                  { name: "hydroclimates", glossaryTerm: "Hydroclimate" },
                ]}
                onActivate={handleGlossaryOpen}
                color={theme.palette.blue.darkest}
                underlineColor={theme.palette.blue.medium}
              />
            </Box>
          </Box>
        }
      />

      {/* Scenarios Panel - Right-side overlay */}
      <TwoColumnPanel
        id="scenarios-overlay2"
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={false}
        contentColumn="right"
        contentAlignment={{
          justifyContent: "center", // Center vertically in viewport
          alignItems: "flex-end", // Align panels to the right edge
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
          paddingLeft: 0, // Remove TwoColumnPanel's default padding that blocks clicks
          paddingRight: 0, // Here also -- Todo: work on this
        }}
        rightContent={
          <Box
            sx={{
              ...overlayPanelStyle,
              mr: { xs: 8, md: 16 }, // Moved further right to show more map // Push panel right, for now
            }}
          >
            <Box
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            >
              <GlossaryLinkedText
                text={t("scenariosPanel.part2")}
                terms={[
                  { name: "scenarios", glossaryTerm: "Scenarios" },
                  {
                    name: "operational strategies",
                    glossaryTerm: "Operational strategies",
                  },
                  { name: "hydroclimates", glossaryTerm: "Hydroclimate" },
                  {
                    name: "water allocations",
                    glossaryTerm: "Water allocations",
                  },
                ]}
                onActivate={handleGlossaryOpen}
                color={theme.palette.blue.darkest}
                underlineColor={theme.palette.blue.medium}
              />
            </Box>
          </Box>
        }
      />

      {/* Invisible marker for intersection detection */}
      <TwoColumnPanel
        id="scenario-explorer-overlay"
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={false}
        contentColumn="right"
        contentAlignment={{
          justifyContent: "center",
          alignItems: "center",
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
          paddingLeft: 0,
          paddingRight: 0,
        }}
        rightContent={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              width: "100%",
            }}
          >
            <Typography
              variant="h2"
              sx={{
                color: theme.palette.blue.darkest,
                textAlign: "center",
                opacity: 0.1, // Very subtle so it doesn't interfere with the map
                pointerEvents: "none",
              }}
            >
              Scenario Explorer
            </Typography>
          </Box>
        }
      />
    </Box>
  )
}
