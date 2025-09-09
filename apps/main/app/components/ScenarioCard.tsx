"use client"

import { Box, Typography, useTheme, Select, MenuItem } from "@repo/ui/mui"
import { InfoIconButton } from "@repo/ui"
import { useDrawerStore, useGlyphSettingsStore } from "@repo/state"
import { OUTCOMES } from "../lib/outcomes"

interface ScenarioCardProps {
  isMinimized?: boolean
  onToggleMinimized?: () => void
  minimizedTitle?: string
}

export default function ScenarioCard({ 
  isMinimized = false, 
  onToggleMinimized,
  minimizedTitle = "Current operations scenario"
}: ScenarioCardProps) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()
  const glyphVariant = useGlyphSettingsStore((s) => s.variant)

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
              {minimizedTitle}
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
                    mb: 0,
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
                  {/* Glyph variant selector */}
                  <Select
                    size="small"
                    value={glyphVariant}
                    onChange={(e) =>
                      useGlyphSettingsStore
                        .getState()
                        .setVariant(
                          e.target.value as "bars" | "rose" | "quartile",
                        )
                    }
                    sx={{
                      fontSize: theme.typography.compact.caption.fontSize,
                      minWidth: "100px",
                      height: "32px",
                      backgroundColor: theme.palette.common.white,
                      borderRadius: theme.borderRadius.rounded,
                      "& .MuiSelect-select": {
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderWidth: "1px",
                        borderColor: theme.palette.grey[300],
                        borderRadius: theme.borderRadius.rounded,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.blue.medium,
                        borderWidth: "1px",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.blue.bright,
                        borderWidth: "2px",
                        boxShadow: `0 0 0 1px ${theme.palette.blue.bright}20`,
                      },
                      "& .MuiSelect-icon": {
                        color: theme.palette.grey[500],
                        fontSize: "1.2rem",
                        right: "8px",
                      },
                      "&:hover .MuiSelect-icon": {
                        color: theme.palette.blue.medium,
                      },
                      "&.Mui-focused .MuiSelect-icon": {
                        color: theme.palette.blue.bright,
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: theme.borderRadius.rounded,
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                          border: `1px solid ${theme.palette.grey[200]}`,
                          backgroundColor: theme.palette.common.white,
                          mt: 0.5,
                          "& .MuiMenuItem-root": {
                            fontSize: theme.typography.compact.caption.fontSize,
                            padding: "8px 16px",
                            minHeight: "auto",
                            backgroundColor: theme.palette.common.white,
                            "&:hover": {
                              backgroundColor: theme.palette.blue.bright + "10",
                              color: theme.palette.blue.darkest,
                            },
                            "&.Mui-selected": {
                              backgroundColor: theme.palette.blue.bright + "20",
                              color: theme.palette.blue.darkest,
                              fontWeight: 500,
                              "&:hover": {
                                backgroundColor: theme.palette.blue.bright + "30",
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="bars">Bars</MenuItem>
                    <MenuItem value="rose">Rose</MenuItem>
                    <MenuItem value="quartile">Quartile</MenuItem>
                  </Select>
                </Box>

                <Box
                  sx={{
                    mb: 0,
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <Box
                      component="span"
                      sx={{
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Click
                    </Box>{" "}
                    on each outcome to see how it is defined and how the
                    results are distributed across the state on the map.
                  </Typography>
                </Box>

                {/* Outcomes charts grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr", // 2 columns for outcomes
                    gap: 2,
                    alignItems: "start",
                  }}
                >
                  {OUTCOMES.map((outcome) => (
                    <Box
                      key={outcome}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        p: 2,
                        backgroundColor: theme.palette.grey[50],
                        borderRadius: theme.borderRadius.rounded,
                        border: `1px solid ${theme.palette.grey[200]}`,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: theme.palette.blue.bright + "10",
                          borderColor: theme.palette.blue.medium,
                        },
                      }}
                      onClick={() => handleGlossaryOpen(outcome)}
                    >
                      {/* Placeholder for ScenarioGlyph - simplified for IntroSection */}
                      <Box
                        sx={{
                          width: 60,
                          height: 40,
                          backgroundColor: theme.palette.blue.medium,
                          borderRadius: theme.borderRadius.rounded,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "white", fontWeight: "bold" }}>
                          {glyphVariant}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.blue.darkest,
                          fontWeight: 500,
                          textAlign: "center",
                          fontSize: "0.75rem",
                        }}
                      >
                        {outcome}
                      </Typography>
                    </Box>
                  ))}
                </Box>
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
