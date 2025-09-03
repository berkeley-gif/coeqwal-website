"use client"

import { TwoColumnPanel, ScrollToButton } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"

export default function MapOverlayPanels() {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 2, // Above the sticky map
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
          <Box
            sx={{
              maxWidth: (theme) => theme.layout.textContainer.maxWidth,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: theme.borderRadius.card,
              padding: { xs: 3, md: 4 },
              boxShadow: theme.shadows[3],
              pointerEvents: "auto", // Re-enable pointer events for the content box
              border: `1px solid rgba(255, 255, 255, 0.2)`,
            }}
          >
            <Typography
              variant="h2"
              component="h2"
              sx={{ 
                mb: (theme) => theme.layout.spacing.md,
                color: (theme) => theme.palette.blue.darkest,
              }}
            >
              {t("toolsPanel.title")}
            </Typography>

            <Typography 
              variant="body1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
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
        includeHeaderSpacing={true}
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
          <Box
            sx={{
              maxWidth: (theme) => theme.layout.textContainer.maxWidth,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: theme.borderRadius.card,
              padding: { xs: 3, md: 4 },
              boxShadow: theme.shadows[3],
              pointerEvents: "auto", // Re-enable pointer events for the content box
              border: `1px solid rgba(255, 255, 255, 0.2)`,
            }}
          >
            <Typography variant="body1">
              {t("scenariosPanel.content")}
            </Typography>

            <ScrollToButton
              scrollToId="content-panels"
              color={theme.palette.overlay.water}
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "center",
              }}
            />
          </Box>
        }
      />
    </Box>
  )
}
