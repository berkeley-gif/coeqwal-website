"use client"

import React, { useState, useCallback } from "react"
import {
  Box,
  Typography,
  Stack,
  useTheme,
  SelectChangeEvent,
  Select,
  MenuItem,
  Button,
  Tooltip,
  Theme,
  AddIcon,
  LocationOnIcon,
  EditNoteIcon,
} from "@repo/ui/mui"
import {
  DashboardPanel,
  DashboardGrid,
  DashboardCardContainer,
  Card,
  DiscreteSlider,
  CustomDropdown,
  SectionHeader,
  StrategyList,
  ControlsContainer,
  ActionButton,
  Strategy,
  StrategyDefinitionPanel,
} from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import { OUTCOMES } from "../../lib/outcomes"
import {
  strategies,
  hydroclimateOptions,
  hydroclimateLabels,
  strategyDefinitions,
} from "../../lib/scenarios"

// Consolidated styles
const getStyles = (theme: Theme) => ({
  // Card content styles
  strategyDetails: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.grey[50],
    borderRadius: 1,
    border: `2px dashed ${theme.palette.grey[300]}`,
    minHeight: "200px",
    p: theme.spacing(3),
  },
  hydroclimateInstructions: {
    mb: theme.spacing(3),
    paddingLeft: theme.spacing(3),
  },
  sliderContainer: {
    paddingLeft: theme.spacing(1),
  },

  // Scorecard styles
  scorecardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: theme.spacing(2),
  },
  hydroclimateTag: {
    backgroundColor: theme.palette.grey[200],
    borderRadius: theme.spacing(3),
    px: theme.spacing(2),
    py: theme.spacing(0.5),
  },
  iconRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: theme.spacing(3),
  },
  iconContainer: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
  },
  strategyIcon: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  // Chart styles
  outcomeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: theme.spacing(3),
    mb: theme.spacing(4),
  },
  outcomeItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(1),
  },

  // Action footer styles
  actionFooter: {
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.spacing(1),
    p: theme.spacing(2),
    mt: theme.spacing(2),
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(2),
  },
  actionIcon: {
    backgroundColor: theme.palette.grey[300],
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
})

export default function ScenarioExplorer2() {
  const theme = useTheme()
  const styles = getStyles(theme)

  // State management
  const [selectedStrategy, setSelectedStrategy] = useState("")
  const [addedStrategies, setAddedStrategies] = useState<Strategy[]>([])
  const [selectedHydroclimate] = useState(1) // Start with "Historical" (index 1), setSelectedHydroclimate temporarily disabled
  const [displayedStrategy, setDisplayedStrategy] = useState<Strategy | null>(
    null,
  )
  const [visibleStrategies, setVisibleStrategies] = useState<Set<string>>(
    new Set(),
  )
  // TEMPORARY: Chart orientation selector - remove once decision is made
  const [chartOrientation, setChartOrientation] = useState<
    "bars" | "verticalBars"
  >("bars")

  // Strategy handlers
  const handleStrategyChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const value = event.target.value
      setSelectedStrategy(value)
      const strategy = strategies.find((s) => s.value === value)
      setDisplayedStrategy(strategy || null)
    },
    [],
  )

  const showStrategyDescription = useCallback(
    (value: string) => {
      if (visibleStrategies.has(value)) return

      const strategy = strategies.find((s) => s.value === value)
      const hydroclimate = hydroclimateOptions.find(
        (h) => h.value === value || h.label === value,
      )
      setDisplayedStrategy(strategy || hydroclimate || null)
    },
    [visibleStrategies],
  )

  const hideStrategyDescription = useCallback(() => {
    if (!selectedStrategy) {
      setDisplayedStrategy(null)
    }
  }, [selectedStrategy])

  const handleAddStrategy = useCallback(() => {
    if (!selectedStrategy) return

    const strategy = strategies.find((s) => s.value === selectedStrategy)
    const isAlreadyAdded = addedStrategies.some(
      (s) => s.value === strategy?.value,
    )

    if (strategy && !isAlreadyAdded) {
      setAddedStrategies((prev) => [...prev, strategy])
      setSelectedStrategy("")
      setDisplayedStrategy(null)
    }
  }, [selectedStrategy, addedStrategies])

  const handleRemoveStrategy = useCallback((strategyValue: string) => {
    setAddedStrategies((prev) => prev.filter((s) => s.value !== strategyValue))
    setVisibleStrategies((prev) => {
      const newSet = new Set(prev)
      newSet.delete(strategyValue)
      return newSet
    })
  }, [])

  const handleStrategyVisibilityChange = useCallback(
    (strategyValue: string, checked: boolean) => {
      setVisibleStrategies((prev) => {
        const newSet = new Set(prev)
        if (checked) {
          newSet.add(strategyValue)
        } else {
          newSet.delete(strategyValue)
        }
        return newSet
      })
    },
    [],
  )

  // Hydroclimate handlers - temporarily disabled
  //   const handleHydroclimateChange = useCallback((index: number) => {
  //     setSelectedHydroclimate(index)
  //   }, [])

  const handleHydroclimateHover = useCallback((index: number) => {
    const hydroclimate = hydroclimateOptions[index]
    setDisplayedStrategy(hydroclimate || null)
  }, [])

  const handleHydroclimateLeave = useCallback(() => {
    // Only hide if no strategy is selected
    if (!selectedStrategy) {
      setDisplayedStrategy(null)
    }
  }, [selectedStrategy])

  // TEMPORARY: Chart orientation handler - remove once decision is made
  const handleChartOrientationChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      setChartOrientation(event.target.value as "bars" | "verticalBars")
    },
    [],
  )

  return (
    <DashboardPanel
      backgroundColor={theme.palette.grey[100]}
      color={theme.palette.text.primary}
      headerHeight={theme.layout.headerHeight}
      includeHeaderSpacing={true}
      sx={{ pointerEvents: "auto" }}
    >
      <DashboardGrid spacing={16}>
        {/* Left section: controls and configuration cards */}
        <DashboardCardContainer
          width={{
            xs: "100%",
            sm: "100%",
            md: "100%",
            lg: "40%",
            xl: "40%",
          }}
        >
          <Stack spacing={2}>
            {/* Card 1: Choose operations */}
            <Card>
              <SectionHeader>
                1. Choose water management strategies
              </SectionHeader>

              {/* Dropdown and Add button */}
              <ControlsContainer>
                <CustomDropdown
                  value={selectedStrategy}
                  onChange={handleStrategyChange}
                  options={strategies}
                  placeholder="Select a strategy..."
                  onOptionHover={showStrategyDescription}
                  onOptionLeave={hideStrategyDescription}
                  disabledValues={addedStrategies.map((s) => s.value)}
                />

                <ActionButton
                  onClick={handleAddStrategy}
                  disabled={!selectedStrategy}
                >
                  Add strategy
                </ActionButton>
              </ControlsContainer>

              {/* List of added strategies */}
              <StrategyList
                strategies={addedStrategies}
                visibleStrategies={visibleStrategies}
                onStrategyHover={showStrategyDescription}
                onStrategyLeave={hideStrategyDescription}
                onStrategyVisibilityChange={handleStrategyVisibilityChange}
                onRemoveStrategy={handleRemoveStrategy}
              />
            </Card>

            {/* Card 2: Adjust Hydroclimate */}
            <Card>
              <SectionHeader>2. Adjust hydroclimate</SectionHeader>

              {/* Hydroclimate instruction text */}
              <Box sx={styles.hydroclimateInstructions}>
                <Typography variant="body2" sx={{ mb: theme.spacing(1) }}>
                  Additional hydroclimate options coming soon. Currently showing
                  historical California hydroclimate.
                </Typography>
              </Box>

              {/* Climate slider */}
              <Box sx={styles.sliderContainer}>
                <DiscreteSlider
                  stops={hydroclimateLabels}
                  value={selectedHydroclimate}
                  onChange={() => {}} // Disabled - no changes allowed
                  onStopHover={handleHydroclimateHover}
                  onSliderLeave={handleHydroclimateLeave}
                  disabled={true}
                  labelPosition="top"
                  colors={{
                    track: theme.palette.grey[300],
                    activeStop: theme.palette.blue.bright,
                    inactiveStop: theme.palette.grey[400],
                    activeLabel: theme.palette.blue.bright,
                    inactiveLabel: theme.palette.grey[400], // Make inactive labels grey
                    pointer: theme.palette.blue.bright,
                  }}
                  spacing={{
                    container: 8,
                    track: 24,
                    labels: 20,
                  }}
                  sx={{
                    "& .slider-pointer": {
                      filter: "none !important", // Remove drop shadow
                    },
                  }}
                />
              </Box>
            </Card>
          </Stack>
        </DashboardCardContainer>

        {/* Right section: Scorecard */}
        <DashboardCardContainer
          width={{
            xs: "100%",
            sm: "100%",
            md: "100%",
            lg: "58%",
            xl: "58%",
          }}
        >
          <Stack spacing={theme.spacing(2)}>
            {/* Strategy Definition Panel - Shows when no visible strategies, OR when hovering over non-visible strategies */}
            {(visibleStrategies.size === 0 ||
              (visibleStrategies.size > 0 &&
                displayedStrategy &&
                (!displayedStrategy.value ||
                  !visibleStrategies.has(displayedStrategy.value)))) && (
              <Card>
                {displayedStrategy ? (
                  // Check if it's a strategy (has matching definition) or hydroclimate
                  strategyDefinitions.find(
                    (def) => def.id === displayedStrategy.value,
                  ) ? (
                    <StrategyDefinitionPanel
                      strategies={strategyDefinitions.filter(
                        (def) => def.id === displayedStrategy.value,
                      )}
                      title="Strategy"
                    />
                  ) : (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{ color: theme.palette.primary.main }}
                      >
                        {displayedStrategy.label}
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                        {displayedStrategy.description}
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Box sx={styles.strategyDetails}>
                    <Stack spacing={theme.spacing(2)} alignItems="center">
                      <Typography variant="subtitle1">
                        Strategy Details
                      </Typography>
                      <Typography variant="body2" textAlign="center">
                        Choose water management strategies and adjust the
                        hydroclimate to see detailed information here.
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Card>
            )}

            {/* Strategy scorecard details */}
            {Array.from(visibleStrategies).map((strategyValue) => {
              const strategy = strategies.find((s) => s.value === strategyValue)
              const hydroclimate = hydroclimateOptions[selectedHydroclimate]

              if (!strategy || !hydroclimate) return null

              return (
                <Card key={strategyValue}>
                  {/* Card header */}
                  <Box sx={styles.scorecardHeader}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                      }}
                    >
                      {strategy.label}
                    </Typography>

                    <Box sx={styles.hydroclimateTag}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 500,
                          letterSpacing: "0.5px",
                        }}
                      >
                        Historical hydroclimate
                      </Typography>
                    </Box>
                  </Box>

                  {/* Strategy icons and chart orientation selector */}
                  <Box sx={styles.iconRow}>
                    {/* Left side: Strategy icons */}
                    <Box sx={styles.iconContainer}>
                      {strategy.value === "current-ops" && (
                        <Tooltip
                          title="Current operations"
                          placement="top"
                          slotProps={{
                            popper: {
                              modifiers: [
                                {
                                  name: "offset",
                                  options: {
                                    offset: [20, -15],
                                  },
                                },
                              ],
                            },
                          }}
                        >
                          <Box sx={styles.strategyIcon}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/images/icons/current_ops.svg"
                              alt="Current operations"
                              style={{ width: "100%", height: "100%" }}
                            />
                          </Box>
                        </Tooltip>
                      )}

                      {strategy.value === "current-ops-wo-tucp" && (
                        <>
                          <Tooltip
                            title="Current operations"
                            placement="top"
                            slotProps={{
                              popper: {
                                modifiers: [
                                  {
                                    name: "offset",
                                    options: {
                                      offset: [20, -15],
                                    },
                                  },
                                ],
                              },
                            }}
                          >
                            <Box sx={styles.strategyIcon}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/images/icons/current_ops.svg"
                                alt="Current operations"
                                style={{ width: "100%", height: "100%" }}
                              />
                            </Box>
                          </Tooltip>
                          <Tooltip
                            title="Without TUCPs"
                            placement="top"
                            slotProps={{
                              popper: {
                                modifiers: [
                                  {
                                    name: "offset",
                                    options: {
                                      offset: [20, -15],
                                    },
                                  },
                                ],
                              },
                            }}
                          >
                            <Box sx={styles.strategyIcon}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/images/icons/no_tucp.svg"
                                alt="Without TUCPs"
                                style={{ width: "100%", height: "100%" }}
                              />
                            </Box>
                          </Tooltip>
                        </>
                      )}
                    </Box>

                    {/* TEMPORARY: Chart orientation dropdown - remove once decision is made */}
                    <Select
                      size="small"
                      value={chartOrientation}
                      onChange={handleChartOrientationChange}
                      sx={{
                        fontSize: theme.typography.compact.caption.fontSize,
                        minWidth: "140px",
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
                              fontSize:
                                theme.typography.compact.caption.fontSize,
                              padding: "8px 16px",
                              minHeight: "auto",
                              backgroundColor: theme.palette.common.white,
                              "&:hover": {
                                backgroundColor:
                                  theme.palette.blue.bright + "10",
                                color: theme.palette.blue.darkest,
                              },
                              "&.Mui-selected": {
                                backgroundColor:
                                  theme.palette.blue.bright + "20",
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
                      <MenuItem value="bars">Horizontal bars</MenuItem>
                      <MenuItem value="verticalBars">Vertical bars</MenuItem>
                    </Select>
                  </Box>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{ mb: theme.spacing(4), lineHeight: 1.5 }}
                  >
                    {strategy.description}
                  </Typography>

                  {/* Outcome charts grid */}
                  <Box sx={styles.outcomeGrid}>
                    {OUTCOMES.slice(0, 8).map((outcome) => (
                      <Box key={outcome} sx={styles.outcomeItem}>
                        <ScenarioGlyph
                          variant={chartOrientation} // TEMPORARY: Remove orientation logic once decision is made
                          values={[
                            Math.random() * 0.4 - 0.2, // min
                            Math.random() * 0.3 - 0.1, // q1
                            Math.random() * 0.2, // median
                            Math.random() * 0.3 + 0.1, // q3
                          ]}
                          size={70}
                          tierColors={[
                            theme.palette.tiers.tier1,
                            theme.palette.tiers.tier2,
                            theme.palette.tiers.tier3,
                            theme.palette.tiers.tier4,
                          ]}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.blue.darkest,
                            fontWeight: 500,
                            textAlign: "center",
                            mt: 0.5,
                          }}
                        >
                          {outcome}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Action buttons footer */}
                  <Box sx={styles.actionFooter}>
                    <Button
                      variant="text"
                      startIcon={
                        <Box sx={styles.actionIcon}>
                          <EditNoteIcon
                            sx={{
                              fontSize: "18px",
                              color: theme.palette.text.primary,
                            }}
                          />
                        </Box>
                      }
                      sx={{
                        color: theme.palette.text.primary,
                        textTransform: "none",
                        fontSize: theme.typography.body2.fontSize,
                        fontWeight: 400,
                        "&:hover": {
                          backgroundColor: "transparent",
                          "& .MuiBox-root": {
                            backgroundColor: theme.palette.blue.bright,
                          },
                          "& .MuiSvgIcon-root": {
                            color: "white",
                          },
                        },
                      }}
                    >
                      Save strategy snapshot
                    </Button>

                    <Button
                      variant="text"
                      startIcon={
                        <Box sx={styles.actionIcon}>
                          <AddIcon
                            sx={{
                              fontSize: "18px",
                              color: theme.palette.text.primary,
                            }}
                          />
                        </Box>
                      }
                      sx={{
                        color: theme.palette.text.primary,
                        textTransform: "none",
                        fontSize: theme.typography.body2.fontSize,
                        fontWeight: 400,
                        "&:hover": {
                          backgroundColor: "transparent",
                          "& .MuiBox-root": {
                            backgroundColor: theme.palette.blue.bright,
                          },
                          "& .MuiSvgIcon-root": {
                            color: "white",
                          },
                        },
                      }}
                    >
                      Add data
                    </Button>

                    <Button
                      variant="text"
                      startIcon={
                        <Box sx={styles.actionIcon}>
                          <LocationOnIcon
                            sx={{
                              fontSize: "18px",
                              color: theme.palette.text.primary,
                            }}
                          />
                        </Box>
                      }
                      sx={{
                        color: theme.palette.text.primary,
                        textTransform: "none",
                        fontSize: theme.typography.body2.fontSize,
                        fontWeight: 400,
                        "&:hover": {
                          backgroundColor: "transparent",
                          "& .MuiBox-root": {
                            backgroundColor: theme.palette.blue.bright,
                          },
                          "& .MuiSvgIcon-root": {
                            color: "white",
                          },
                        },
                      }}
                    >
                      View on map
                    </Button>
                  </Box>
                </Card>
              )
            })}
          </Stack>
        </DashboardCardContainer>
      </DashboardGrid>
    </DashboardPanel>
  )
}
