"use client"

import { TwoColumnPanel } from "@repo/ui"
import { Box, Typography, useTheme, Theme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"

export default function MapOverlayPanels() {
  const theme = useTheme() // eslint-disable-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation()

  // Shared style for overlay panel content boxes, for now
  const overlayPanelStyle = {
    maxWidth: (theme: Theme) => theme.layout.textContainer.maxWidth,
    backgroundColor: "rgba(42, 82, 135, 0.7)", // Same as home panel gradient start
    backdropFilter: "blur(10px)",
    borderRadius: (theme: Theme) => theme.borderRadius.card,
    padding: (theme: Theme) => theme.layout.spacing.lg,
    pointerEvents: "auto", // Re-enable pointer events for the content box
  }

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content, // Above the sticky map
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
          alignItems: "flex-start",
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
        }}
        rightContent={
          <Box sx={overlayPanelStyle}>
            <Typography
              variant="h3"
              component="h3"
              sx={{
                mb: (theme) => theme.layout.spacing.md,
                color: (theme) => theme.palette.common.white,
              }}
            >
              {t("toolsPanel.title")}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: (theme) => theme.palette.common.white,
              }}
            >
              {t("toolsPanel.content")}
            </Typography>
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
          alignItems: "flex-start",
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
        }}
        rightContent={
          <Box sx={overlayPanelStyle}>
            <Typography
              variant="body1"
              sx={{
                color: (theme) => theme.palette.common.white,
              }}
            >
              {t("scenariosPanel.content")}
            </Typography>
          </Box>
        }
      />
    </Box>
  )
}
