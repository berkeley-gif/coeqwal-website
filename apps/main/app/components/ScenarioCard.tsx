"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoIconButton } from "@repo/ui"
import { useDrawerStore } from "@repo/state"

interface ScenarioCardProps {
  isExpanded?: boolean
  isMinimized?: boolean
  onToggleMinimized?: () => void
}

export default function ScenarioCard({ 
  isExpanded = false,
  isMinimized = false, 
  onToggleMinimized 
}: ScenarioCardProps) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  const handleGlossaryOpen = (entry: string) => {
    setDrawerContent({
      selectedTerm: entry,
    })
    openDrawer("glossary")
  }

  // Simple state when not expanded
  if (!isExpanded) {
    return (
      <Box
        sx={{
          p: 3,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: theme.borderRadius.card,
          border: "1px solid",
          borderColor: theme.palette.divider,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          height: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          Operations
        </Typography>
      </Box>
    )
  }

  // Expanded state - full ScenarioExplorer content
  return (
    <Box
      sx={{
        position: "relative",
        height: "auto",
      }}
    >
      <Box
        sx={{
          backdropFilter: "blur(10px)",
          pointerEvents: "auto",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: theme.borderRadius.card,
          border: "1px solid",
          borderColor: theme.palette.divider,
          padding: 3,
          display: "flex",
          flexDirection: "column",
          height: "auto",
          opacity: isMinimized ? 0.8 : 1,
        }}
      >
        {/* Minimized state - show title only */}
        {isMinimized && (
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Box
              sx={{
                color: theme.palette.blue.darkest,
                fontFamily: theme.typography.fontFamily,
                fontWeight: 500,
                fontSize: "1.5rem",
                lineHeight: 1.3,
              }}
            >
              Current operations scenario
            </Box>
          </Box>
        )}

        {/* Expanded state - full content */}
        {!isMinimized && (
          <Box sx={{ mb: 2, flexShrink: 0 }}>
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
              SCENARIO
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mb: 1,
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
                Current operations scenario
              </Box>
              <InfoIconButton
                mode="glossary"
                glossaryEntry="Current operations scenario"
                onGlossaryOpen={handleGlossaryOpen}
              />
            </Box>
            <Box
              sx={{
                mb: 2,
                color: theme.palette.blue.darkest,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {/* Description */}
              <Box component="ul" sx={{ margin: 0, paddingLeft: "20px" }}>
                <Typography
                  component="li"
                  variant="body2"
                  sx={{
                    mb: 0,
                    color: "inherit",
                  }}
                >
                  helps us understand how California manages water
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  sx={{
                    mb: 0,
                    color: "inherit",
                  }}
                >
                  serves as a foundation to compare alternatives.
                </Typography>
              </Box>
            </Box>

            {/* HR separator */}
            <Box
              sx={{
                borderBottom: "1px solid",
                borderColor: theme.palette.grey[300],
                my: 2.5,
                mb: 0,
              }}
            />

            {/* Scenario snapshot section */}
            <Box sx={{ flexShrink: 0, pb: 2 }}>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.blue.darkest,
                      }}
                    >
                      Scenario outcomes
                    </Typography>
                    <InfoIconButton
                      mode="glossary"
                      glossaryEntry="CalSim"
                      onGlossaryOpen={handleGlossaryOpen}
                    />
                  </Box>
                </Box>
                
                {/* Simplified outcomes display - no complex charts for IntroSection */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontStyle: "italic",
                  }}
                >
                  Interactive scenario outcomes available in full Scenario Explorer
                </Typography>
              </Box>
            </Box>
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
