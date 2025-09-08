"use client"

import { TwoColumnPanel } from "@repo/ui"
import { Box, Typography, useTheme, Theme, Button } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { useCalSimToggle } from "./CalSimContext"

export default function MapOverlayPanels() {
  const theme = useTheme() // eslint-disable-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation()
  const { isCalSimVisible, toggleCalSim } = useCalSimToggle()

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
          justifyContent: "flex-start",
          alignItems: "flex-end",
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
          paddingLeft: 0, // Remove TwoColumnPanel's default padding that blocks clicks
          paddingRight: 0, // Ditto
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
                mb: (theme) => theme.layout.spacing.md,
                color: (theme) => theme.palette.blue.darkest,
              }}
            >
              {t("toolsPanel.title")}
            </Typography>

            <Typography variant="body1" fontWeight="bold">
              {t("toolsPanel.boldText")}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 2,
              }}
            >
              {t("toolsPanel.content")}
            </Typography>

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
                mb: 2,
              }}
            >
              {isCalSimVisible ? "Hide CalSim Network" : "Show CalSim Network"}
            </Button>

            {/* CalSim Legend */}
            {isCalSimVisible && (
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontSize: "0.8rem", fontWeight: 500 }}
                >
                  CalSim Node Types:
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#2563eb", // Bright blue - matches active reservoirs
                        border: "1px solid white",
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                      Reservoirs & Storage
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#dc2626", // Bright red - matches active pump stations
                        border: "1px solid white",
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                      Pump Stations
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#059669", // Bright green - matches active treatment
                        border: "1px solid white",
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                      Water Treatment
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#8b5cf6", // Bright purple for channels
                        border: "1px solid white",
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                      Channels & Other
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, mb: 1, fontSize: "0.7rem", fontWeight: 500 }}
                >
                  Water Flow Paths:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 3,
                        backgroundColor: "#00bcd4",
                        borderRadius: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.7rem" }}>
                      Enhanced Pathways
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 3,
                        backgroundColor: "#2196f3",
                        borderRadius: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.7rem" }}>
                      Natural River Flows
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 3,
                        backgroundColor: "#ff9800",
                        borderRadius: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.7rem" }}>
                      Regional Distribution
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, fontSize: "0.7rem", fontStyle: "italic" }}
                >
                  Click any facility to trace water journey
                </Typography>
              </Box>
            )}
          </Box>
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
          justifyContent: "flex-start",
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
              variant="body1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
              }}
            >
              {t("scenariosPanel.part1")}
            </Typography>
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
          justifyContent: "flex-start",
          alignItems: "flex-end",
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
            <Typography
              variant="body1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
              }}
            >
              {t("scenariosPanel.part2")}
            </Typography>
          </Box>
        }
      />
    </Box>
  )
}
