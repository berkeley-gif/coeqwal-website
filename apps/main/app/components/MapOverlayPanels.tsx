"use client"

import { TwoColumnPanel } from "@repo/ui"
import { Box, Typography, useTheme, Theme, Button } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { useCalSimToggle } from "./CalSimContext"
import Image from "next/image"

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
              <Box sx={{ mt: (theme) => theme.spacing(1) }}>
                <Typography
                  variant="h6"
                  sx={{ mb: (theme) => theme.spacing(1.5) }}
                >
                  Legend
                </Typography>
                <Box sx={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: (theme) => theme.spacing(1),
                  columnGap: (theme) => theme.spacing(2)
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: (theme) => theme.spacing(1) }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: (theme) => theme.palette.blue.main,
                        border: (theme) => `${theme.border.thick} ${theme.palette.common.white}`,
                        boxShadow: (theme) => theme.shadows[1],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">Reservoir</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: (theme) => theme.spacing(1) }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: (theme) => theme.palette.accent.gold,
                        border: (theme) => `${theme.border.thick} ${theme.palette.common.white}`,
                        boxShadow: (theme) => theme.shadows[1],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">Basins</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: (theme) => theme.spacing(1) }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: (theme) => theme.palette.primary.main,
                        border: (theme) => `${theme.border.thick} ${theme.palette.common.white}`,
                        boxShadow: (theme) => theme.shadows[1],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">Channel</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: (theme) => theme.spacing(1) }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: (theme) => theme.palette.brand.water,
                        border: (theme) => `${theme.border.thick} ${theme.palette.common.white}`,
                        boxShadow: (theme) => theme.shadows[1],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">Delta</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: (theme) => theme.spacing(1) }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: (theme) => theme.palette.nature.forest,
                        border: (theme) => `${theme.border.thick} ${theme.palette.common.white}`,
                        boxShadow: (theme) => theme.shadows[1],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">Delivery</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: (theme) => theme.spacing(1) }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: (theme) => theme.palette.blue.dark,
                        border: (theme) => `${theme.border.thick} ${theme.palette.common.white}`,
                        boxShadow: (theme) => theme.shadows[1],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">Sacramento River</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: (theme) => theme.spacing(1) }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: (theme) => theme.palette.blue.darkest,
                        border: (theme) => `${theme.border.thick} ${theme.palette.common.white}`,
                        boxShadow: (theme) => theme.shadows[1],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">San Joaquin River</Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ 
                    mt: (theme) => theme.spacing(1.5), 
                    fontStyle: "italic", 
                    color: "text.secondary" 
                  }}
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
                mb: (theme) => theme.spacing(2),
              }}
            >
              {t("scenariosPanel.part1")}
            </Typography>
            <Box
              sx={{
                width: "100%",
                borderRadius: (theme) => theme.borderRadius.card,
                overflow: "hidden",
                boxShadow: (theme) => theme.shadows[2],
              }}
            >
              <Image
                src="/images/dorota-trzaska-1tAtO-9HYNM-unsplash.jpg"
                alt="California water landscape"
                width={400}
                height={250}
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "cover",
                  display: "block",
                }}
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
