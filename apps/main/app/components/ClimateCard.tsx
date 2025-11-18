"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoIconButton, DiscreteSlider } from "@repo/ui"
import { useDrawerStore } from "@repo/state"

interface ClimateCardProps {
  isMinimized?: boolean
  onToggleMinimized?: () => void
  selectedClimate?: number
  onClimateChange?: (value: number) => void
}

export default function ClimateCard({
  isMinimized = false,
  onToggleMinimized,
  selectedClimate = 1,
  onClimateChange = () => {},
}: ClimateCardProps) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  const handleGlossaryOpen = (entry: string) => {
    setDrawerContent({
      selectedTerm: entry,
    })
    openDrawer("glossary")
  }

  return (
    <Box
      sx={{
        position: "relative",
        height: "auto",
      }}
    >
      <Box
        sx={{
          pointerEvents: "auto",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: theme.borderRadius.card,
          border: "1px solid",
          borderColor: theme.palette.divider,
          padding: 2, // Reduced from 3 to 2
          display: "flex",
          flexDirection: "column",
          height: "auto",
          opacity: isMinimized ? 0.8 : 1,
        }}
      >
        {/* Minimized state - show title only */}
        {isMinimized && (
          <Box sx={{ mb: 1, flexShrink: 0 }}>
            <Box
              sx={{
                color: theme.palette.blue.darkest,
                fontFamily:
                  '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontWeight: 500,
                fontSize: "1.5rem",
                lineHeight: 1.3,
              }}
            >
              Hydroclimate
            </Box>
          </Box>
        )}

        {/* Expanded state - full content */}
        {!isMinimized && (
          <Box sx={{ flexShrink: 0 }}>
            <Box
              sx={{
                color: theme.palette.blue.medium,
                textTransform: "uppercase",
                letterSpacing: "0.75px",
                fontSize: theme.typography.compact.caption.fontSize,
                fontWeight: 500,
                display: "block",
                mb: 0.5,
              }}
            >
              HYDROCLIMATE
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mb: 0.5,
              }}
            >
              <Box
                sx={{
                  color: theme.palette.blue.darkest,
                  fontFamily:
                    '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  fontWeight: 500,
                  fontSize: "1.5rem",
                  lineHeight: 1.3,
                  mb: 0,
                }}
              >
                {
                  [
                    "Warmer Wetter",
                    "Historical",
                    "Warmer Drier I",
                    "Warmer Drier II",
                    "Warmer Drier III",
                    "Warmer Drier IV",
                  ][selectedClimate]
                }
              </Box>
              <InfoIconButton
                mode="glossary"
                glossaryEntry="Changing climate"
                onGlossaryOpen={handleGlossaryOpen}
                sx={{ color: theme.palette.blue.bright }}
              />
            </Box>

            {/* Climate instruction text */}
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Hydroclimate affects outcomes
              </Typography>
            </Box>

            {/* Climate slider */}
            <DiscreteSlider
              stops={[
                "Historical",
                "Warmer Wetter",
                "Warmer Drier I",
                "Warmer Drier II",
                "Warmer Drier III",
                "Warmer Drier IV",
              ]}
              value={selectedClimate === 1 ? 0 : selectedClimate}
              onChange={(value) => {
                onClimateChange(value)
                console.log("Climate changed to:", value)
              }}
              labelPosition="top"
            />
          </Box>
        )}
      </Box>

      {/* Minimize/maximize button */}
      {onToggleMinimized && (
        <Box
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleMinimized()
          }}
          sx={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "24px",
            height: "24px",
            backgroundColor: theme.palette.common.white,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            border: `1px solid ${theme.palette.grey[200]}`,
            transition: "all 0.2s ease",
            zIndex: 1,
            pointerEvents: "auto",
            "&:hover": {
              backgroundColor: theme.palette.grey[50],
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            },
          }}
        >
          <svg
            width="12"
            height="10"
            viewBox="0 0 12 10"
            style={{
              fill: "#3a4574",
              transition: "transform 0.2s ease",
              transform: isMinimized ? "rotate(0deg)" : "rotate(180deg)",
              pointerEvents: "none",
            }}
          >
            <path d="M6 0 L11 8 Q6 6 1 8 Z" />
          </svg>
        </Box>
      )}
    </Box>
  )
}
