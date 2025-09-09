"use client"

import { Box, Typography, useTheme, Select, MenuItem } from "@repo/ui/mui"
import { InfoIconButton } from "@repo/ui"
import { useDrawerStore, useGlyphSettingsStore } from "@repo/state"
import { ScenarioGlyph } from "@repo/viz"
import { OUTCOMES } from "../lib/outcomes"
import { useCalSimToggle } from "./CalSimContext"

interface ScenarioCardProps {
  isMinimized?: boolean
  onToggleMinimized?: () => void
  minimizedTitle?: string
}

export default function ScenarioCard({
  isMinimized = false,
  onToggleMinimized,
  minimizedTitle = "Current operations",
}: ScenarioCardProps) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()
  const { selectedOutcome, setSelectedOutcome } = useCalSimToggle()
  const glyphVariant = useGlyphSettingsStore((s) => s.variant)

  // Generate dummy data for current operations (copied from ScenarioExplorer)
  const generateDummyData = (outcomeIndex: number) => {
    const baseMedian = outcomeIndex * 0.1 - 0.2
    const medianShift = 0 // Historical climate
    const variabilityMultiplier = 1

    const median = baseMedian + medianShift
    const baseSpread = 0.4 * variabilityMultiplier
    const q1 = median - baseSpread * 0.5
    const q3 = median + baseSpread * 0.3
    const min = median - baseSpread * 0.8

    return [q3, median, q1, min] as [number, number, number, number]
  }

  const handleGlossaryOpen = (entry: string) => {
    setDrawerContent({
      selectedTerm: entry,
    })
    openDrawer("glossary")
  }

  const handleOutcomeSelect = (outcome: string) => {
    if (selectedOutcome === outcome) {
      // If clicking the same outcome, deselect it
      setSelectedOutcome(null)
      console.log("🎯 Outcome deselected:", outcome)
    } else {
      // Select new outcome
      setSelectedOutcome(outcome)
      console.log("🎯 Outcome selected:", outcome)
    }

    // Also open glossary drawer with the specific outcome term
    handleGlossaryOpen(outcome)
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
          <Box sx={{ mb: 1, flexShrink: 0 }}>
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
              OPERATIONS
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
                Current operations
              </Box>
              <InfoIconButton
                mode="glossary"
                glossaryEntry="Current operations"
                onGlossaryOpen={handleGlossaryOpen}
                sx={{ color: theme.palette.blue.bright }}
              />
            </Box>
            <Box
              sx={{
                mb: 1,
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
                my: 1.5,
                mb: 0,
              }}
            />

            {/* Scenario snapshot section */}
            <Box sx={{ flexShrink: 0, pb: 1 }}>
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
                      sx={{ color: theme.palette.blue.bright }}
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
                                backgroundColor:
                                  theme.palette.blue.bright + "30",
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
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <Box
                      component="span"
                      sx={{
                        color: theme.palette.blue.bright,
                      }}
                    >
                      Click
                    </Box>{" "}
                    on each outcome to see how it is defined and how the results
                    are distributed across the state on the map.
                  </Typography>
                </Box>

                {/* Outcomes charts grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr", // 4 columns for outcomes (2 rows)
                    gap: 1.5,
                    alignItems: "start",
                  }}
                >
                  {OUTCOMES.map((outcome, outcomeIndex) => (
                    <Box
                      key={outcome}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        cursor: "pointer",
                        p: 1,
                        borderRadius: theme.borderRadius.rounded,
                        border:
                          selectedOutcome === outcome
                            ? `2px solid ${theme.palette.blue.bright}`
                            : "2px solid transparent",
                        backgroundColor:
                          selectedOutcome === outcome
                            ? theme.palette.blue.bright + "10"
                            : "transparent",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: theme.palette.blue.bright + "05",
                          border: `2px solid ${theme.palette.blue.medium}`,
                        },
                      }}
                      onClick={() => {
                        handleOutcomeSelect(outcome)
                      }}
                    >
                      <ScenarioGlyph
                        tierColors={[
                          theme.palette.tiers.tier1,
                          theme.palette.tiers.tier2,
                          theme.palette.tiers.tier3,
                          theme.palette.tiers.tier4,
                        ]}
                        values={generateDummyData(outcomeIndex)}
                        variant={glyphVariant}
                        size={60}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.blue.darkest,
                          fontWeight: 500,
                          textAlign: "center",
                          fontSize: "0.75rem",
                          mt: 0.5,
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
