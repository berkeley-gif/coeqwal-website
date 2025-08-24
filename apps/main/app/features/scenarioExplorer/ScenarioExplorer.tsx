"use client"
import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Box,
  IconButton,
  Checkbox,
  FormControlLabel,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  useTheme,
} from "@repo/ui/mui"
import {
  Card,
  ScenarioCard,
  MapMarkerTooltip,
  ActionCardButton,
  DiscreteSlider,
  InfoIconButton,
  CardAccordion,
} from "@repo/ui"
import type { CardAccordionSection } from "@repo/ui"
import { useChartData } from "../../hooks/useChartData"
import { OUTCOMES } from "../../lib/outcomes"
import { useDrawerStore } from "@repo/state"
import {
  Map,
  useMap,
  NavigationControl,
  GeolocateControl,
  Marker,
  Source,
  Layer,
  Popup,
} from "@repo/map"
import MyLocationIcon from "@mui/icons-material/MyLocation"
import { MapPromptDialog } from "@repo/ui"

import { useGlyphSettingsStore } from "@repo/state"
import { ScenarioGlyph, VerticalParallelLinePlot } from "@repo/viz"
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"

// Sortable scenario exploration card component
const SortableScenarioExplorationCard = ({
  id,
  title,
  description,
  outcomes,
  isBaseline = false,
  selectedClimate = 1,
  visualizationType = "bars",
}: {
  id: string
  title: string
  description: string
  outcomes: string[]
  isBaseline?: boolean
  selectedClimate?: number
  visualizationType?: "bars" | "rose" | "quartile" | "map"
}) => {
  const theme = useTheme()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        height: "400px", // Larger height for 2x2 bar charts
        minHeight: "400px",
      }}
    >
      <Card
        sx={{
          p: 3,
          height: "100%",
          display: "flex",

          flexDirection: "column",
          cursor: isDragging ? "grabbing" : "grab",
          "&:hover": {
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          },
          transition: "box-shadow 0.2s ease",
          transform: isDragging ? "rotate(5deg)" : "none",
          // Special styling for baseline/current operations
          backgroundColor: isBaseline
            ? theme.palette.blue.bright + "10"
            : theme.palette.common.white,
          border: isBaseline
            ? `2px solid ${theme.palette.blue.bright}`
            : "1px solid rgba(0, 0, 0, 0.12)",
        }}
        {...attributes}
        {...listeners}
      >
        {/* Drag handle indicator */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 0.5, // Reduced margin
            opacity: 0.5,
          }}
        >
          <Typography
            sx={{
              fontSize: (theme) => theme.typography.button.fontSize,
              lineHeight: 1,
            }}
          >
            ⋮⋮
          </Typography>
        </Box>

        {/* Card header */}
        <Box sx={{ mb: 1.5 }}>
          {" "}
          {/* Reduced margin */}
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.blue.darkest,
              fontWeight: 500,
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.4,
            }}
          >
            {description}
          </Typography>
        </Box>

        {/* Outcomes grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3, // Larger gap for better spacing in bigger cards
            flexGrow: 1,
            alignItems: "center", // Center the glyphs vertically
            padding: 1,
          }}
        >
          {outcomes.map((outcome, index) => (
            <Box
              key={outcome}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                p: 1,
                borderRadius: theme.borderRadius.rounded,
                backgroundColor: theme.palette.grey[50],
              }}
            >
              <ScenarioGlyph
                tierColors={[
                  theme.palette.tiers.tier1,
                  theme.palette.tiers.tier2,
                  theme.palette.tiers.tier3,
                  theme.palette.tiers.tier4,
                ]}
                values={(() => {
                  // Generate hydroclimate values
                  const outcomeIndex = outcomes.indexOf(outcome)
                  const baseMedian = outcomeIndex * 0.1 - 0.2

                  let medianShift = 0
                  let variabilityMultiplier = 1

                  if (selectedClimate === 0) {
                    medianShift = 0.3
                    variabilityMultiplier = 0.7
                  } else if (selectedClimate === 1) {
                    medianShift = 0
                    variabilityMultiplier = 1
                  } else {
                    const drierLevel = selectedClimate - 2
                    medianShift = -0.2 - drierLevel * 0.2
                    variabilityMultiplier = 1.2 + drierLevel * 0.4
                  }

                  // For non-baseline scenarios, add some dummy data improvement
                  if (!isBaseline) {
                    medianShift += 0.1 + index * 0.05 // Each alternative performs slightly better
                    variabilityMultiplier *= 0.9 // Less variability
                  }

                  const median = baseMedian + medianShift
                  const baseSpread = 0.4 * variabilityMultiplier
                  const q1 = median - baseSpread * 0.5
                  const q3 = median + baseSpread * 0.3
                  const min = median - baseSpread * 0.8

                  return [q3, median, q1, min] as [
                    number,
                    number,
                    number,
                    number,
                  ]
                })()}
                size={56} // Fill the 2x2 space
                variant={
                  visualizationType === "map" ? "bars" : visualizationType
                } // Default to bars for map mode
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: (theme) =>
                    theme.typography.compact.caption.fontSize,
                  textAlign: "center",
                  lineHeight: 1.3,
                  maxWidth: "90px", // Wider text area
                  fontWeight: 400,
                }}
              >
                {outcome}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  )
}

// Chart container component that calculates available height for D3
const ChartContainer = ({
  expanded,
  chartData,
}: {
  expanded: boolean
  chartData: { key: string; props: Record<string, unknown> }
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [calculatedHeight, setCalculatedHeight] = useState(300)

  // Calculate available height when expanded state changes
  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const availableHeight = expanded
          ? Math.max(rect.height, window.innerHeight * 0.6) // At least 60vh when expanded
          : 300 // Default height when collapsed

        setCalculatedHeight(availableHeight)
        console.log("Chart container height calculated:", availableHeight)
      }
    }

    // Calculate immediately
    calculateHeight()

    // Recalculate after a brief delay to ensure container has resized
    const timeoutId = setTimeout(calculateHeight, 100)

    return () => clearTimeout(timeoutId)
  }, [expanded])

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (expanded && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const availableHeight = Math.max(rect.height, window.innerHeight * 0.6)
        setCalculatedHeight(availableHeight)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [expanded])

  return (
    <Box
      ref={containerRef}
      sx={{
        flexGrow: 1,
        width: "100%",
        minHeight: expanded ? "60vh" : "300px",
        height: expanded ? "100%" : "auto",
        maxHeight: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease-out",
      }}
    >
      <VerticalParallelLinePlot
        key={chartData.key}
        {...(chartData.props as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        height={calculatedHeight} // Pass calculated height to chart
        responsive={false} // Disable responsive mode, use explicit height
      />
    </Box>
  )
}

interface ScenarioExplorerProps {
  onOpenThemesDrawer?: (operationId?: string) => void
}

interface MapControlsProps {
  // Region selection props
  isDrawingCustomRegion: boolean
  polygonPoints: Array<{ lng: number; lat: number }>
  draggedPointIndex: number | null
  onSelectRegionOnMap: () => void
  onClearCustomRegion: () => void
  onPointDrag: (index: number, newLng: number, newLat: number) => void
  onDragStart: (index: number) => void
  onDragEnd: () => void
  // Delivery area props
  showDeliveryAreaDropdown: boolean
  onToggleDeliveryAreaDropdown: () => void
  // Third column panel props
  hoveredScenario: string | null
  selectedScenarios: string[]
  selectedRegion: string
  onScenarioHover: (scenario: string | null) => void
  onScenarioSelect: (scenario: string) => void
  onRegionSelect: (region: string) => void
  // Climate props
  selectedClimate: number
  onClimateChange: (value: number) => void
  // Outcome visualization props
  selectedOutcome: string | null
  onOutcomeSelect: (outcome: string) => void
  // Clear selections
  onClearSelectedScenarios: () => void
  // Comparison mode state
  isInComparisonMode: boolean
  // Exploration panel
  onExploreScenarios: () => void
}

const MapControls = ({
  // Region selection props
  isDrawingCustomRegion,
  polygonPoints,
  draggedPointIndex: _draggedPointIndex, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSelectRegionOnMap,
  onClearCustomRegion,
  onPointDrag: _onPointDrag, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDragStart: _onDragStart, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDragEnd: _onDragEnd, // eslint-disable-line @typescript-eslint/no-unused-vars
  // Delivery area props
  showDeliveryAreaDropdown: _showDeliveryAreaDropdown, // eslint-disable-line @typescript-eslint/no-unused-vars
  onToggleDeliveryAreaDropdown,
  // Third column panel props
  hoveredScenario: _hoveredScenario, // eslint-disable-line @typescript-eslint/no-unused-vars
  selectedScenarios,
  selectedRegion,
  onScenarioHover: _onScenarioHover, // eslint-disable-line @typescript-eslint/no-unused-vars
  onScenarioSelect: _onScenarioSelect, // eslint-disable-line @typescript-eslint/no-unused-vars
  onRegionSelect: _onRegionSelect, // eslint-disable-line @typescript-eslint/no-unused-vars
  // Climate props
  selectedClimate,
  onClimateChange,
  // Outcome visualization props
  selectedOutcome: _selectedOutcome, // eslint-disable-line @typescript-eslint/no-unused-vars
  onOutcomeSelect,
  onClearSelectedScenarios,
  // Comparison mode state
  isInComparisonMode,
  // Exploration panel
  onExploreScenarios,
}: MapControlsProps) => {
  const { flyTo } = useMap()
  const { setDrawerContent, openDrawer } = useDrawerStore()
  const theme = useTheme()

  // Card minimize/maximize states
  const [isFirstCardMinimized, setIsFirstCardMinimized] = useState(false)
  const [isClimateCardMinimized, setIsClimateCardMinimized] = useState(false)
  const [isThirdCardMinimized, setIsThirdCardMinimized] = useState(true) // Initialize minimized

  // Scenario presets state

  const [sgmaSanJoaquinOnly, setSgmaSanJoaquinOnly] = useState(false)
  const [sgmaSanJoaquinReductions, setSgmaSanJoaquinReductions] =
    useState(false)
  const [sgmaBothValleys, setSgmaBothValleys] = useState(false)
  const [sgmaBothValleysReductions, setSgmaBothValleysReductions] =
    useState(false)
  const [usbrAlternative3, setUsbrAlternative3] = useState(false)
  const [deltaConveyanceTunnel, setDeltaConveyanceTunnel] = useState(false)

  // Track scenarios clicked in chart (dots and lines)
  const [clickedScenarios, setClickedScenarios] = useState<string[]>([])

  // Outcomes panel state
  const [isRelativeView, setIsRelativeView] = useState(true)
  const [highlightBaseline, setHighlightBaseline] = useState(false)
  const [expandChart, setExpandChart] = useState(false)
  const [defineOutcome, setDefineOutcome] = useState(false)
  const [overlayTiers, setOverlayTiers] = useState(false)

  const handleCenterOnCalifornia = () => {
    flyTo({
      longitude: -120.759,
      latitude: 38.032,
      zoom: 6.3,
      transitionOptions: {
        duration: 2000, // Smooth 2-second transition
      },
    })
  }

  const handleSelectRegionOnMapClick = useCallback(() => {
    onSelectRegionOnMap()
    // setShowRegionDropdown(false) // Close dropdown when starting to draw
  }, [onSelectRegionOnMap])

  // Outcomes panel handlers
  const handleViewModeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsRelativeView(event.target.checked)
    },
    [],
  )

  const handleHighlightBaselineChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setHighlightBaseline(event.target.checked)
    },
    [],
  )

  const handleDefineOutcomeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDefineOutcome(event.target.checked)
    },
    [],
  )

  const handleOverlayTiersChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOverlayTiers(event.target.checked)
    },
    [],
  )

  const handleLearnMoreClick = useCallback(() => {
    console.log("Learn more about this chart clicked")
  }, [])

  // Handle scenario clicks from the chart (dots and lines)
  const handleChartScenarioClick = (data: { name: string }) => {
    const scenarioName = data.name
    setClickedScenarios(
      (prev) =>
        prev.includes(scenarioName)
          ? prev.filter((s) => s !== scenarioName) // Remove if already clicked
          : [...prev, scenarioName], // Add if not clicked yet
    )
    console.log("Chart scenario clicked:", scenarioName)
  }

  const toggleExpandChart = useCallback(() => {
    const newExpandedState = !expandChart
    setExpandChart(newExpandedState)
    // onExpandChange?.(newExpandedState) // We can add this prop later if needed
  }, [expandChart])

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

  // ✨ Clean chart data hook encapsulates ALL optimization logic
  const chartData = useChartData({
    highlightBaseline,
    expandChart,
    defineOutcome,
    overlayTiers,
    onLineClick: handleChartScenarioClick,
  })

  // Accordion sections for the third column
  const accordionSections: CardAccordionSection[] = [
    {
      id: "scenario-presets",
      title: "Scenario presets",
      content: (
        <Box>
          {/* All Options - Single column, full width */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {/* SGMA Section Header */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 400,
                mb: 0.5,
                color: (theme) => theme.palette.text.primary,
              }}
            >
              Sustainable Groundwater Management Act (SGMA)
            </Typography>

            {/* SGMA Options - Indented to show hierarchy */}
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={sgmaSanJoaquinOnly}
                  onChange={(e) => setSgmaSanJoaquinOnly(e.target.checked)}
                />
              }
              label="San Joaquin Valley only"
              sx={{ ml: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={sgmaSanJoaquinReductions}
                  onChange={(e) =>
                    setSgmaSanJoaquinReductions(e.target.checked)
                  }
                />
              }
              label="San Joaquin Valley with agricultural reductions"
              sx={{ ml: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={sgmaBothValleys}
                  onChange={(e) => setSgmaBothValleys(e.target.checked)}
                />
              }
              label="Sacramento and San Joaquin Valleys"
              sx={{ ml: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={sgmaBothValleysReductions}
                  onChange={(e) =>
                    setSgmaBothValleysReductions(e.target.checked)
                  }
                />
              }
              label="Sacramento and San Joaquin Valleys with agricultural reductions"
              sx={{ ml: 2 }}
            />

            {/* Other Options */}
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={usbrAlternative3}
                  onChange={(e) => setUsbrAlternative3(e.target.checked)}
                />
              }
              label="USBR Alternative 3"
              sx={{ mt: 1 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={deltaConveyanceTunnel}
                  onChange={(e) => setDeltaConveyanceTunnel(e.target.checked)}
                />
              }
              label="Delta Conveyance Tunnel, Bethany Alternative"
            />
          </Box>
        </Box>
      ),
    },
    {
      id: "select-scenarios",
      title: "Select scenarios",
      content: (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 0,
          }}
        >
          {/* Outcomes paragraph, visible when chart not expanded */}
          {!expandChart && (
            <Box sx={{ flexShrink: 0 }}>
              <Box
                sx={{
                  fontSize: "1rem",
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: (theme) => theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Compare scenarios across multiple outcomes to understand
                trade-offs and co-benefits.{" "}
                <Box
                  component="span"
                  onClick={handleLearnMoreClick}
                  sx={{
                    color: (theme) => theme.palette.blue.bright,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    fontWeight: 500,
                    textDecoration: "underline",
                    whiteSpace: "nowrap",
                    "&:hover": {
                      color: (theme) => theme.palette.blue.darkest,
                    },
                  }}
                >
                  Learn more about this chart
                </Box>
              </Box>
            </Box>
          )}

          {/* Control Section, always visible */}
          <Box sx={{ flexShrink: 0, mb: 1 }}>
            {/* Expand chart button, always visible */}
            <Box sx={{ mb: 1 }}>
              <Button
                variant="text"
                onClick={toggleExpandChart}
                sx={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: (theme) => theme.palette.blue.bright,
                  padding: 0,
                  minWidth: "auto",
                  textTransform: "none",
                  justifyContent: "flex-start",
                  "&:hover": {
                    color: (theme) => theme.palette.blue.darkest,
                    backgroundColor: "transparent",
                  },
                }}
              >
                <span
                  style={{
                    fontSize: "0.875em",
                    marginRight: "8px",
                    display: "inline-block",
                    transform: expandChart ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ▼
                </span>
                {expandChart ? "Reduce" : "Expand"} chart
              </Button>
            </Box>

            {/* Chart controls */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mt: 1,
                mb: 1,
                width: "100%",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRelativeView}
                    onChange={handleViewModeChange}
                    size="small"
                  />
                }
                label="relative to current operations"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={highlightBaseline}
                    onChange={handleHighlightBaselineChange}
                    size="small"
                  />
                }
                label="highlight current operations"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={defineOutcome}
                    onChange={handleDefineOutcomeChange}
                    size="small"
                  />
                }
                label="define an outcome"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={overlayTiers}
                    onChange={handleOverlayTiersChange}
                    size="small"
                  />
                }
                label="overlay tiers"
              />
            </Box>
          </Box>

          {/* Responsive Chart Visualization */}
          <Box
            sx={{
              flexGrow: 1,
              width: "100%",
              height: "100%",
              minHeight: 0,
              maxHeight: "none",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <VerticalParallelLinePlot
              key={chartData.key}
              {...chartData.props}
            />
          </Box>
        </Box>
      ),
    },
    {
      id: "select-regions",
      title: "Select regions",
      content: (
        <Box>
          {/* Region Selection Header */}
          {/* <Box
            sx={{
              mb: 2,
              textAlign: "left",
            }}
          >
            <Box
              sx={{
                color: (theme) => theme.palette.blue.medium,
                ...(theme.mixins.cardTypography.eyebrow as any),
              }}
            >
              CHOOSE A REGION
            </Box>
            <Box
              sx={{
                ...(theme.mixins.cardTypography.cardTitle as any),
              }}
            >
              Central Valley
            </Box>
          </Box> */}

          {/* Region Selection Options - Always Visible */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              p: 2,
              // backgroundColor: (theme) => theme.palette.grey[50],
              // borderRadius: (theme) => theme.borderRadius.rounded,
              // border: "1px solid",
              // borderColor: (theme) => theme.palette.divider,
            }}
          >
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Sacramento Valley"
            />
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="San Joaquin Valley"
            />
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Delta"
            />
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Tulare Basin"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  onChange={(e) => {
                    if (e.target.checked) {
                      onToggleDeliveryAreaDropdown()
                    }
                  }}
                />
              }
              label="Select delivery area"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={isDrawingCustomRegion || polygonPoints.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleSelectRegionOnMapClick()
                    } else {
                      onClearCustomRegion()
                    }
                  }}
                />
              }
              label="Select region on map"
            />
          </Box>
        </Box>
      ),
    },
  ]

  const glyphVariant = useGlyphSettingsStore((s) => s.variant)

  // Check if any scenarios are selected (presets, chart selections, or chart clicks)
  const hasSelectedScenarios =
    selectedScenarios.length > 0 ||
    clickedScenarios.length > 0 ||
    sgmaSanJoaquinOnly ||
    sgmaSanJoaquinReductions ||
    sgmaBothValleys ||
    sgmaBothValleysReductions ||
    usbrAlternative3 ||
    deltaConveyanceTunnel

  // Simple way to communicate comparison mode to parent - we'll use a ref
  useEffect(() => {
    // This is a simple way to communicate state up without complex prop drilling
    if (typeof window !== "undefined") {
      ;(window as any).mapComparisonMode = hasSelectedScenarios // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }, [hasSelectedScenarios])

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.mapControls,
        pointerEvents: "none", // For map interactions between map and overlay
        p: 2, // 16px padding
      }}
    >
      {/* Seven column layout with 2/7 width panels */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 3,
          height: "100%",
        }}
      >
        {/* Left column/scenario card */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            height: "100%",
            gridColumn: "1 / 3", // Spans columns 1-2 (2/7 width)
          }}
        >
          {/* Unified scenario card for all tabs */}
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
                borderRadius: (theme) => theme.borderRadius.card,
                border: "1px solid",
                borderColor: (theme) => theme.palette.divider,
                padding: 3,
                display: "flex",
                flexDirection: "column",
                height: "auto",
                opacity: isFirstCardMinimized ? 0.8 : 1,
              }}
            >
              {/* Minimized state - show title only */}
              {isFirstCardMinimized && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    sx={{
                      color: (theme) => theme.palette.blue.darkest,
                      fontFamily: (theme) => theme.typography.fontFamily,
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
              {!isFirstCardMinimized && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    sx={{
                      color: (theme) => theme.palette.blue.medium,
                      textTransform: "uppercase",
                      letterSpacing: "0.75px",
                      fontSize: (theme) =>
                        theme.typography.compact.caption.fontSize,
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
                      mb: 1, // Move margin to container for proper spacing
                    }}
                  >
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        fontFamily:
                          '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        fontWeight: 500,
                        fontSize: "1.5rem",
                        lineHeight: 1.3,
                        mb: 0, // Remove margin to fix alignment
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
                      color: (theme) => theme.palette.blue.darkest,
                      fontFamily: (theme) => theme.typography.fontFamily,
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
                      borderColor: (theme) => theme.palette.grey[300],
                      my: 2.5,
                      mb: 0,
                    }}
                  />
                </Box>
              )}

              {/* Scenario snapshot section */}
              {!isFirstCardMinimized && (
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
                            color: (theme) => theme.palette.blue.darkest,
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
                          fontSize: (theme) =>
                            theme.typography.compact.caption.fontSize,
                          minWidth: "100px",
                          height: "32px",
                          backgroundColor: (theme) =>
                            theme.palette.common.white,
                          borderRadius: (theme) => theme.borderRadius.rounded,
                          "& .MuiSelect-select": {
                            padding: "6px 12px",
                            display: "flex",
                            alignItems: "center",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderWidth: "1px",
                            borderColor: (theme) => theme.palette.grey[300],
                            borderRadius: (theme) => theme.borderRadius.rounded,
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: (theme) => theme.palette.blue.medium,
                            borderWidth: "1px",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: (theme) => theme.palette.blue.bright,
                            borderWidth: "2px",
                            boxShadow: (theme) =>
                              `0 0 0 1px ${theme.palette.blue.bright}20`,
                          },
                          "& .MuiSelect-icon": {
                            color: (theme) => theme.palette.grey[500],
                            fontSize: "1.2rem",
                            right: "8px",
                          },
                          "&:hover .MuiSelect-icon": {
                            color: (theme) => theme.palette.blue.medium,
                          },
                          "&.Mui-focused .MuiSelect-icon": {
                            color: (theme) => theme.palette.blue.bright,
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: (theme) =>
                                theme.borderRadius.rounded,
                              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                              border: (theme) =>
                                `1px solid ${theme.palette.grey[200]}`,
                              backgroundColor: (theme) =>
                                theme.palette.common.white,
                              mt: 0.5,
                              "& .MuiMenuItem-root": {
                                fontSize: (theme) =>
                                  theme.typography.compact.caption.fontSize,
                                padding: "8px 16px",
                                minHeight: "auto",
                                backgroundColor: (theme) =>
                                  theme.palette.common.white,
                                "&:hover": {
                                  backgroundColor: (theme) =>
                                    theme.palette.blue.bright + "10",
                                  color: (theme) => theme.palette.blue.darkest,
                                },
                                "&.Mui-selected": {
                                  backgroundColor: (theme) =>
                                    theme.palette.blue.bright + "20",
                                  color: (theme) => theme.palette.blue.darkest,
                                  fontWeight: 500,
                                  "&:hover": {
                                    backgroundColor: (theme) =>
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
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <Box
                          component="span"
                          sx={{
                            color: (theme) => theme.palette.text.secondary,
                          }}
                        >
                          Click
                        </Box>{" "}
                        on each outcome to see how it is defined and how the
                        results are distributed across the state on the map.
                      </Typography>
                    </Box>
                  </Box>

                  {/* Grid layout: outcomes charts */}
                  <Box
                    sx={{
                      display: hasSelectedScenarios ? "grid" : "flex",
                      gridTemplateColumns: hasSelectedScenarios
                        ? "1fr 1fr"
                        : undefined, // 2 columns when scenarios selected
                      flexWrap: hasSelectedScenarios ? undefined : "wrap",
                      justifyContent: hasSelectedScenarios
                        ? "center"
                        : "center",
                      gap: hasSelectedScenarios ? 3 : 2, // More gap in comparison mode
                      alignItems: "start",
                    }}
                  >
                    {hasSelectedScenarios ? (
                      // Comparison mode: 4 rows with 2 comparative pairs each
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr 1fr", // 4 columns: Current, Alt, Current, Alt
                          gap: 2,
                          width: "100%",
                          padding: 2,
                          position: "relative", // For column background positioning
                        }}
                      >
                        {/* Blue column backgrounds for Current Operations */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: "calc(25% - 4px)", // First column width minus half gap
                            backgroundColor: (theme) =>
                              theme.palette.blue.bright + "15", // Slightly lighter blue column
                            borderRadius: (theme) => theme.borderRadius.rounded,
                            zIndex: 0, // Behind content
                          }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: "25%", // Third column position
                            bottom: 0,
                            width: "calc(25% - 4px)", // Third column width minus half gap
                            backgroundColor: (theme) =>
                              theme.palette.blue.bright + "15", // Slightly lighter blue column
                            borderRadius: (theme) => theme.borderRadius.rounded,
                            zIndex: 0, // Behind content
                          }}
                        />
                        {/* Column headers - positioned in grid */}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: (theme) =>
                              theme.typography.compact.subtitle.fontSize,
                            color: (theme) => theme.palette.text.secondary,
                            textAlign: "center",
                            zIndex: 1, // Above column backgrounds
                            position: "relative",
                            mb: 1,
                          }}
                        >
                          Current
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: (theme) =>
                              theme.typography.compact.subtitle.fontSize,
                            color: (theme) => theme.palette.text.secondary,
                            textAlign: "center",
                            zIndex: 1,
                            position: "relative",
                            mb: 1,
                          }}
                        >
                          Alternative
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: (theme) =>
                              theme.typography.compact.subtitle.fontSize,
                            color: (theme) => theme.palette.text.secondary,
                            textAlign: "center",
                            zIndex: 1,
                            position: "relative",
                            mb: 1,
                          }}
                        >
                          Current
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: (theme) =>
                              theme.typography.compact.subtitle.fontSize,
                            color: (theme) => theme.palette.text.secondary,
                            textAlign: "center",
                            zIndex: 1,
                            position: "relative",
                            mb: 1,
                          }}
                        >
                          Alternative
                        </Typography>

                        {/* Generate glyphs in pairs by outcome */}
                        {OUTCOMES.map((outcome, outcomeIndex) => {
                          // Each outcome generates 2 glyphs: current and alternative
                          return [
                            // Current operations glyph
                            <Box
                              key={`current-${outcome}`}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 1,
                                padding: 0.5,
                                borderRadius: (theme) =>
                                  theme.borderRadius.rounded,
                                cursor: "pointer",
                                transition: "background-color 0.2s ease",
                                zIndex: 1, // Above column backgrounds
                                position: "relative",
                                "&:hover": {
                                  backgroundColor: (theme) =>
                                    theme.palette.grey[100],
                                },
                                "&:active": {
                                  backgroundColor: (theme) =>
                                    theme.palette.grey[200],
                                },
                              }}
                              onClick={() => {
                                onOutcomeSelect(outcome)
                                openDrawer("glossary")
                                setDrawerContent({ selectedTerm: outcome })
                              }}
                            >
                              <ScenarioGlyph
                                tierColors={[
                                  theme.palette.tiers.tier1,
                                  theme.palette.tiers.tier2,
                                  theme.palette.tiers.tier3,
                                  theme.palette.tiers.tier4,
                                ]}
                                values={(() => {
                                  // Current operations data
                                  const baseMedian = outcomeIndex * 0.1 - 0.2

                                  let medianShift = 0
                                  let variabilityMultiplier = 1

                                  if (selectedClimate === 0) {
                                    medianShift = 0.3
                                    variabilityMultiplier = 0.7
                                  } else if (selectedClimate === 1) {
                                    medianShift = 0
                                    variabilityMultiplier = 1
                                  } else {
                                    const drierLevel = selectedClimate - 2
                                    medianShift = -0.2 - drierLevel * 0.2
                                    variabilityMultiplier =
                                      1.2 + drierLevel * 0.4
                                  }

                                  const median = baseMedian + medianShift
                                  const baseSpread = 0.4 * variabilityMultiplier
                                  const q1 = median - baseSpread * 0.5
                                  const q3 = median + baseSpread * 0.3
                                  const min = median - baseSpread * 0.8

                                  return [q3, median, q1, min] as [
                                    number,
                                    number,
                                    number,
                                    number,
                                  ]
                                })()}
                                size={56}
                                variant={glyphVariant}
                              />
                              <Box
                                sx={{
                                  fontSize: (theme) =>
                                    theme.typography.compact.caption.fontSize,
                                  fontWeight: 400,
                                  lineHeight: 1.3,
                                  color: (theme) => theme.palette.text.primary,
                                  textAlign: "center",
                                  maxWidth: "80px",
                                }}
                              >
                                {outcome}
                              </Box>
                            </Box>,

                            // Alternative scenario glyph
                            <Box
                              key={`alternative-${outcome}`}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 1,
                                padding: 0.5,
                                borderRadius: (theme) =>
                                  theme.borderRadius.rounded,
                                cursor: "pointer",
                                transition: "background-color 0.2s ease",
                                zIndex: 1, // Above column backgrounds
                                position: "relative",
                                "&:hover": {
                                  backgroundColor: (theme) =>
                                    theme.palette.grey[100],
                                },
                                "&:active": {
                                  backgroundColor: (theme) =>
                                    theme.palette.grey[200],
                                },
                              }}
                              onClick={() => {
                                onOutcomeSelect(outcome)
                                openDrawer("glossary")
                                setDrawerContent({ selectedTerm: outcome })
                              }}
                            >
                              <ScenarioGlyph
                                tierColors={[
                                  theme.palette.tiers.tier1,
                                  theme.palette.tiers.tier2,
                                  theme.palette.tiers.tier3,
                                  theme.palette.tiers.tier4,
                                ]}
                                values={(() => {
                                  // Alternative scenario data (different from current operations)
                                  const baseMedian = outcomeIndex * 0.15 - 0.1 // Slightly different base

                                  // Alternative scenarios show different performance
                                  let medianShift = 0.2 // Generally better performance
                                  let variabilityMultiplier = 0.8 // Less variability

                                  if (selectedClimate === 0) {
                                    medianShift = 0.4
                                    variabilityMultiplier = 0.6
                                  } else if (selectedClimate === 1) {
                                    medianShift = 0.2
                                    variabilityMultiplier = 0.8
                                  } else {
                                    const drierLevel = selectedClimate - 2
                                    medianShift = 0.1 - drierLevel * 0.1 // Still better but degrades
                                    variabilityMultiplier =
                                      0.9 + drierLevel * 0.2
                                  }

                                  const median = baseMedian + medianShift
                                  const baseSpread =
                                    0.35 * variabilityMultiplier
                                  const q1 = median - baseSpread * 0.4
                                  const q3 = median + baseSpread * 0.4
                                  const min = median - baseSpread * 0.7

                                  return [q3, median, q1, min] as [
                                    number,
                                    number,
                                    number,
                                    number,
                                  ]
                                })()}
                                size={56}
                                variant={glyphVariant}
                              />
                              <Box
                                sx={{
                                  fontSize: (theme) =>
                                    theme.typography.compact.caption.fontSize,
                                  fontWeight: 400,
                                  lineHeight: 1.3,
                                  color: (theme) => theme.palette.text.primary,
                                  textAlign: "center",
                                  maxWidth: "80px",
                                }}
                              >
                                {outcome}
                              </Box>
                            </Box>,
                          ]
                        }).flat()}
                      </Box>
                    ) : (
                      // Normal mode: original flex layout
                      OUTCOMES.map((outcome) => (
                        <Box
                          key={outcome}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                            padding: 0.5,
                            maxWidth: "80px",
                            borderRadius: (theme) => theme.borderRadius.rounded,
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                            "&:hover": {
                              backgroundColor: (theme) =>
                                theme.palette.grey[100],
                            },
                            "&:active": {
                              backgroundColor: (theme) =>
                                theme.palette.grey[200],
                            },
                          }}
                          onClick={() => {
                            // Handle outcome selection for map visualization
                            onOutcomeSelect(outcome)
                            // Also open glossary drawer with the specific outcome term
                            openDrawer("glossary")
                            setDrawerContent({ selectedTerm: outcome })
                          }}
                        >
                          {/* Glyph for outcome */}
                          <ScenarioGlyph
                            tierColors={[
                              theme.palette.tiers.tier1,
                              theme.palette.tiers.tier2,
                              theme.palette.tiers.tier3,
                              theme.palette.tiers.tier4,
                            ]}
                            values={(() => {
                              // Generate climate-influenced dummy data based on selectedClimate
                              // 0: Warmer Wetter, 1: Historical, 2-5: Warmer Drier I-IV

                              // Base median value varies by outcome type
                              const outcomeIndex = OUTCOMES.indexOf(outcome)
                              const baseMedian = outcomeIndex * 0.1 - 0.2 // -0.2 to 0.1 range

                              // Climate affects both central tendency and variability
                              let medianShift = 0
                              let variabilityMultiplier = 1

                              if (selectedClimate === 0) {
                                // Warmer Wetter - better outcomes, less variability
                                medianShift = 0.3 // More positive = more green/blue (better)
                                variabilityMultiplier = 0.7
                              } else if (selectedClimate === 1) {
                                // Historical - baseline
                                medianShift = 0
                                variabilityMultiplier = 1
                              } else {
                                // Warmer Drier I-IV - worse outcomes, more variability
                                const drierLevel = selectedClimate - 2 // 0-3
                                medianShift = -0.2 - drierLevel * 0.2 // Gets progressively worse: -0.2, -0.4, -0.6, -0.8 (more red/orange)
                                variabilityMultiplier = 1.2 + drierLevel * 0.4 // More variable: 1.2, 1.6, 2.0, 2.4
                              }

                              const median = baseMedian + medianShift
                              const baseSpread = 0.4 * variabilityMultiplier

                              // Create distribution with climate-appropriate spread
                              const q1 = median - baseSpread * 0.5
                              const q3 = median + baseSpread * 0.3 // Asymmetric - more downside risk
                              const min = median - baseSpread * 0.8

                              return [q3, median, q1, min] as [
                                number,
                                number,
                                number,
                                number,
                              ]
                            })()}
                            size={56}
                            variant={glyphVariant}
                          />

                          {/* Outcome label */}
                          <Box
                            sx={{
                              fontSize: (theme) =>
                                theme.typography.compact.caption.fontSize,
                              fontWeight: 400,
                              lineHeight: 1.3,
                              color: (theme) => theme.palette.text.primary,
                              textAlign: "center",
                              maxWidth: "80px",
                            }}
                          >
                            {outcome}
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              )}

              {/* COMMENTED OUT, may use later */}
              {/* Minimized state */}
              {/* {isFirstCardMinimized && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    sx={{
                      color: (theme) => theme.palette.blue.darkest,
                      fontFamily: (theme) => theme.typography.fontFamily,
                      fontWeight: 500,
                      fontSize: "1.5rem",
                      lineHeight: 1.3,
                    }}
                  >
                    Scenarios
                  </Box>
                </Box>
              )} */}

              {/* Choose alternative scenarios line, hidden when chart expanded or minimized */}
              {/* {!isOutcomesExpanded && !isFirstCardMinimized && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    onClick={toggleDropdown}
                    sx={{
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "color 0.2s ease",
                      color: (theme) => theme.palette.blue.medium,
                      fontFamily: (theme) => theme.typography.fontFamily,
                      fontWeight: 500,
                      fontSize: "1rem",
                      "&:hover": {
                        color: (theme) => theme.palette.action.hover,
                      },
                    }}
                  >
                    Choose alternative scenarios to compare{" "}
                    <span
                      style={{
                        fontSize: "0.875em",
                        lineHeight: 1,
                        verticalAlign: "baseline",
                        display: "inline-block",
                        transform: showDropdown
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </Box>
                </Box>
              )} */}

              {/* Tab navigation, hidden when chart expanded or minimized */}
              {/* {!isOutcomesExpanded && !isFirstCardMinimized && showDropdown && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        mr: 2,
                        fontSize: "1rem",
                        fontWeight: 400,
                        color: (theme) => theme.palette.text.primary,
                        flexShrink: 0,
                      }}
                    >
                      Choose by:
                    </Box>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      sx={{ flex: 1 }}
                    >
                      <Tab label="Presets" />
                      <Tab label="Outcomes" />
                      <Tab label="Climate resilience" />
                    </Tabs>
                  </Box>
                </Box>
              )} */}

              {/* Tab Content - Dynamic based on active tab and dropdown state */}
              {/* {!isFirstCardMinimized &&
                (showDropdown || (activeTab === 1 && isOutcomesExpanded)) && (
                  <Box
                    sx={{
                      // Dynamic height based on active tab
                      ...(activeTab === 1
                        ? {
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            minHeight: 0,
                          }
                        : {
                            flexShrink: 0,
                          }),
                    }}
                  >
                    {activeTab === 0 && (
                      <PresetsPanel
                        onViewOnMap={handleViewOnMap}
                        onScenarioHover={onScenarioHover}
                        onScenarioSelect={onScenarioSelect}
                      />
                    )}
                    {activeTab === 1 && (
                      <OutcomesPanel
                        onExpandChange={handleOutcomesExpandChange}
                      />
                    )}
                    {activeTab === 2 && <OperationsPanel />}
                  </Box>
                )} */}
            </Box>

            {/* Minimize/maximize button */}
            <Box
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsFirstCardMinimized(!isFirstCardMinimized)
              }}
              sx={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "24px",
                height: "24px",
                backgroundColor: (theme) => theme.palette.common.white,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                zIndex: 9999,
                pointerEvents: "auto",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.grey[50],
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
                  transform: isFirstCardMinimized
                    ? "rotate(0deg)"
                    : "rotate(180deg)",
                  pointerEvents: "none",
                }}
              >
                <path d="M6 0 L11 8 Q6 6 1 8 Z" />
              </svg>
            </Box>
          </Box>

          {/* Climate card - in left column when not in comparison mode */}
          {!isInComparisonMode && (
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
                  borderRadius: (theme) => theme.borderRadius.card,
                  border: "1px solid",
                  borderColor: (theme) => theme.palette.divider,
                  padding: 3,
                  display: "flex",
                  flexDirection: "column",
                  height: "auto",
                  opacity: isClimateCardMinimized ? 0.8 : 1,
                }}
              >
                {/* Minimized state - show title only */}
                {isClimateCardMinimized && (
                  <Box sx={{ mb: 2, flexShrink: 0 }}>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        fontFamily:
                          '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        fontWeight: 500,
                        fontSize: "1.5rem",
                        lineHeight: 1.3,
                      }}
                    >
                      Climate
                    </Box>
                  </Box>
                )}

                {/* Expanded state - full content */}
                {!isClimateCardMinimized && (
                  <Box sx={{ flexShrink: 0 }}>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.medium,
                        textTransform: "uppercase",
                        letterSpacing: "0.75px",
                        fontSize: (theme) =>
                          theme.typography.compact.caption.fontSize,
                        fontWeight: 500,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      CLIMATE
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
                          color: (theme) => theme.palette.blue.darkest,
                          fontFamily:
                            '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                          fontWeight: 500,
                          fontSize: "1.5rem",
                          lineHeight: 1.3,
                          mb: 0,
                        }}
                      >
                        Climate
                      </Box>
                      <InfoIconButton
                        mode="glossary"
                        glossaryEntry="Changing climate"
                        onGlossaryOpen={handleGlossaryOpen}
                      />
                    </Box>

                    {/* Climate instruction text */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <Box
                          component="span"
                          sx={{
                            color: (theme) => theme.palette.text.secondary,
                          }}
                        >
                          Slide
                        </Box>{" "}
                        to explore how climate affects outcomes.
                      </Typography>
                    </Box>

                    {/* Climate slider */}
                    <DiscreteSlider
                      stops={[
                        "Warmer Wetter",
                        "Historical",
                        "Warmer Drier I",
                        "Warmer Drier II",
                        "Warmer Drier III",
                        "Warmer Drier IV",
                      ]}
                      value={selectedClimate}
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
              <Box
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsClimateCardMinimized(!isClimateCardMinimized)
                }}
                sx={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "24px",
                  height: "24px",
                  backgroundColor: (theme) => theme.palette.common.white,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  zIndex: 9999,
                  pointerEvents: "auto",
                  "&:hover": {
                    backgroundColor: (theme) => theme.palette.grey[50],
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
                    transform: isClimateCardMinimized
                      ? "rotate(0deg)"
                      : "rotate(180deg)",
                    pointerEvents: "none",
                  }}
                >
                  <path d="M6 0 L11 8 Q6 6 1 8 Z" />
                </svg>
              </Box>
            </Box>
          )}
        </Box>

        {/* Right column, Alternative scenarios */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: expandChart ? 0 : 2, // Remove gap when expanded to maximize height
            width: "100%",
            minWidth: 0,
            gridColumn: "6 / 8", // Spans columns 6-7 (2/7 width, same as left column)
            marginLeft: "-60px", // Move the card 60px to the left to clear glossary tabs
            height: expandChart ? "calc(100vh - 32px)" : "auto", // Full viewport height minus margin when expanded
            transition: "height 0.3s ease-out, gap 0.3s ease-out", // Smooth transitions for height and gap
          }}
        >
          {/* Alternative scenarios panel */}
          <Box
            sx={{
              position: "relative",
              height: expandChart ? "100%" : "auto", // Take full height when expanded
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ScenarioCard
              topLine="CHOOSE AND COMPARE"
              headline={"Alternative scenarios"}
              body={null}
              sx={{
                opacity: isThirdCardMinimized ? 0.8 : 1,
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
                height: expandChart ? "100%" : "auto", // Full height when chart is expanded
                display: "flex",
                flexDirection: "column",
                transition: "height 0.3s ease-out", // Smooth height transition for card
              }}
              dropdownContent={
                isThirdCardMinimized ? undefined : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      px: 3, // Card padding
                    }}
                  >
                    {/* Filter status header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mb: 0 }}
                      >
                        30 scenarios available • {selectedScenarios.length}{" "}
                        selected
                      </Typography>
                      {selectedScenarios.length > 0 && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => onClearSelectedScenarios()}
                          sx={{
                            textTransform: "none",
                            fontSize: (theme) => theme.typography.nav.fontSize,
                            color: (theme) => theme.palette.blue.bright,
                            minWidth: "auto",
                            padding: 0,
                            "&:hover": {
                              backgroundColor: "transparent",
                              color: (theme) => theme.palette.blue.darkest,
                            },
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </Box>
                    {/* Expanded Chart Mode - Full Height */}
                    {expandChart ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          flexGrow: 1,
                          minHeight: 0,
                          height: "100%",
                          mt: 2, // Add top margin above checkboxes when expanded
                          transition: "all 0.3s ease-out", // Smooth transition for the entire expanded container
                        }}
                      >
                        {/* Chart controls */}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 2,
                            mb: 2,
                            flexShrink: 0,
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isRelativeView}
                                onChange={handleViewModeChange}
                                size="small"
                              />
                            }
                            label="relative to current operations"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={highlightBaseline}
                                onChange={handleHighlightBaselineChange}
                                size="small"
                              />
                            }
                            label="highlight current operations"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={defineOutcome}
                                onChange={handleDefineOutcomeChange}
                                size="small"
                              />
                            }
                            label="define an outcome"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={overlayTiers}
                                onChange={handleOverlayTiersChange}
                                size="small"
                              />
                            }
                            label="overlay tiers"
                          />
                        </Box>

                        {/* Expand/Reduce button */}
                        <Box sx={{ mb: 2, flexShrink: 0 }}>
                          <Button
                            variant="text"
                            onClick={toggleExpandChart}
                            sx={{
                              fontSize: "1rem",
                              fontWeight: 500,
                              color: (theme) => theme.palette.blue.bright,
                              padding: 0,
                              minWidth: "auto",
                              textTransform: "none",
                              justifyContent: "flex-start",
                              "&:hover": {
                                color: (theme) => theme.palette.blue.darkest,
                                backgroundColor: "transparent",
                              },
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.875em",
                                marginRight: "8px",
                                display: "inline-block",
                                transform: expandChart
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            >
                              ▼
                            </span>
                            {expandChart ? "Reduce" : "Expand"} chart
                          </Button>
                        </Box>

                        {/* Full Height Chart */}
                        <ChartContainer
                          expanded={expandChart}
                          chartData={chartData}
                        />
                      </Box>
                    ) : (
                      <>
                        {/* Normal Mode - Card Accordion */}
                        <CardAccordion
                          sections={accordionSections}
                          allowMultiple={false} // Only one section expanded at a time
                          sx={{ flexGrow: 1 }}
                        />

                        {/* Compare Button at bottom */}
                        <Box sx={{ p: 2, pt: 0, flexShrink: 0 }}>
                          <ActionCardButton
                            title="Explore scenarios in depth"
                            subtitle={
                              selectedScenarios.length > 0
                                ? `${selectedScenarios.length} scenario${selectedScenarios.length > 1 ? "s" : ""} for ${selectedRegion}`
                                : "Select scenarios to explore"
                            }
                            disabled={false} // Temporarily always enabled for testing
                            hoverBackgroundColor={theme.palette.blue.bright}
                            hoverTextColor={theme.palette.common.white}
                            onClick={() => {
                              console.log(
                                "Explore button clicked, selectedScenarios:",
                                selectedScenarios.length,
                              )
                              console.log(
                                "Calling onExploreScenarios regardless for testing",
                              )
                              onExploreScenarios()
                            }}
                          />
                        </Box>
                      </>
                    )}
                  </Box>
                )
              }
            />
            <Box
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsThirdCardMinimized(!isThirdCardMinimized)
              }}
              sx={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "24px",
                height: "24px",
                backgroundColor: (theme) => theme.palette.common.white,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                zIndex: 9999,
                pointerEvents: "auto",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.grey[50],
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
                  transform: isThirdCardMinimized
                    ? "rotate(0deg)"
                    : "rotate(180deg)",
                  pointerEvents: "none",
                }}
              >
                <path d="M6 0 L11 8 Q6 6 1 8 Z" />
              </svg>
            </Box>
          </Box>

          {/* Quick actions atm, may use later */}
          <Box
            sx={{
              marginTop: "auto",
              display: "flex",
              width: "100%",
            }}
          >
            <Card
              sx={{
                p: 1,
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
                minWidth: 0,
              }}
            >
              <IconButton
                onClick={handleCenterOnCalifornia}
                size="small"
                title="Center on California"
              >
                <MyLocationIcon />
              </IconButton>
              <TextField
                placeholder="Enter location to zoom"
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 0,
                  minWidth: 0,
                  maxWidth: "none",
                  "& .MuiOutlinedInput-root": {
                    height: 32,
                    fontSize: (theme) => theme.typography.nav.fontSize,
                    minWidth: 0,
                    "& fieldset": {
                      borderColor: (theme) => theme.palette.divider,
                      borderWidth: "1px",
                    },
                    "&:hover fieldset": {
                      borderColor: (theme) => theme.palette.text.secondary,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: (theme) => theme.palette.blue.medium,
                      borderWidth: "1px",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    fontSize: (theme) => theme.typography.nav.fontSize,
                    padding: "6px 8px",
                    minWidth: 0,
                  },
                  "& .MuiInputBase-input::placeholder": {
                    fontSize: (theme) => theme.typography.nav.fontSize,
                    opacity: 0.6,
                  },
                }}
              />
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default function ScenarioExplorer({
  onOpenThemesDrawer: _onOpenThemesDrawer, // eslint-disable-line @typescript-eslint/no-unused-vars
}: ScenarioExplorerProps) {
  const theme = useTheme()
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const {
    addSource,
    addLayer,
    removeLayer,
    hasSource,
    hasLayer,
    fitBounds,
    flyTo,
  } = useMap()

  // Calculated extents for different outcome datasets (from geojson analysis)
  const OUTCOME_EXTENTS = {
    "Community deliveries": {
      // Urban areas - calculated bounds from actual data
      bounds: [
        [-122.5253313401591, 35.9947689586334],
        [-119.73675744266775, 40.745557975898166],
      ] as [[number, number], [number, number]],
      center: {
        longitude: -121.13104439141343,
        latitude: 38.37016346726578,
        zoom: 6.2,
      },
    },
    "Agricultural deliveries": {
      // Agriculture areas - calculated bounds from actual data
      bounds: [
        [-122.73923233712331, 35.964081298197414],
        [-119.71028032650193, 40.751670748519366],
      ] as [[number, number], [number, number]],
      center: {
        longitude: -121.22475633181261,
        latitude: 38.357876023358386,
        zoom: 6.0,
      },
    },
  }

  // Polygon drawing state, lifted to main component
  const [isDrawingCustomRegion, setIsDrawingCustomRegion] = useState(false)
  const [polygonPoints, setPolygonPoints] = useState<
    Array<{ lng: number; lat: number }>
  >([])
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(
    null,
  )
  const [isSelfIntersecting, setIsSelfIntersecting] = useState(false)

  // Third column panel state
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState("Central Valley")

  // Climate state
  const [selectedClimate, setSelectedClimate] = useState(1) // Default to "Historical"

  // Outcome visualization state
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null)
  const [hoveredFeatureData, setHoveredFeatureData] = useState<{
    modName: string | null
    subName: string | null
    type: string | null
    coordinates: [number, number]
  } | null>(null)

  // Delivery area state
  const [showDeliveryAreaDropdown, setShowDeliveryAreaDropdown] =
    useState(false)
  const [isSelectingDeliveryArea, setIsSelectingDeliveryArea] = useState(false)

  // Track comparison mode state
  const [isInComparisonMode, setIsInComparisonMode] = useState(false)

  // Scenario exploration panel state
  const [showExplorationPanel, setShowExplorationPanel] = useState(false)
  const [scenarioOrder, setScenarioOrder] = useState<string[]>([])
  const [explorationVisualizationType, setExplorationVisualizationType] =
    useState<"bars" | "rose" | "quartile" | "map">("bars")

  // Mock scenario data for the exploration panel - always include current operations first
  const mockScenarioData = [
    {
      id: "current-operations",
      title: "Current Operations",
      description: "Baseline water management operations across California",
      outcomes: [...OUTCOMES], // All outcomes for current operations (spread to make mutable)
      isBaseline: true,
    },
    {
      id: "scenario-1",
      title: "SGMA San Joaquin Valley",
      description:
        "Sustainable groundwater management in the San Joaquin Valley",
      outcomes: OUTCOMES.slice(0, 4), // First 4 outcomes
      isBaseline: false,
    },
    {
      id: "scenario-2",
      title: "Delta Conveyance Tunnel",
      description: "Bethany Alternative tunnel configuration",
      outcomes: OUTCOMES.slice(2, 6), // Middle 4 outcomes
      isBaseline: false,
    },
    {
      id: "scenario-3",
      title: "USBR Alternative 3",
      description: "Bureau of Reclamation alternative water management",
      outcomes: OUTCOMES.slice(4, 8), // Last 4 outcomes
      isBaseline: false,
    },
  ]

  // Watch for comparison mode changes from MapControls
  useEffect(() => {
    const checkComparisonMode = () => {
      if (typeof window !== "undefined") {
        const comparisonMode = (window as any).mapComparisonMode || false // eslint-disable-line @typescript-eslint/no-explicit-any

        setIsInComparisonMode(comparisonMode)
      }
    }

    // Check immediately and set up interval to check periodically
    checkComparisonMode()
    const interval = setInterval(checkComparisonMode, 100)

    return () => clearInterval(interval)
  }, [])

  const handleSelectRegionOnMap = () => {
    setIsDrawingCustomRegion(true)
    setPolygonPoints([])
  }

  const handlePolygonComplete = () => {
    if (polygonPoints.length >= 3) {
      setIsDrawingCustomRegion(false)
      console.log("Custom region polygon completed:", polygonPoints)
    }
  }

  const handleClearCustomRegion = () => {
    setIsDrawingCustomRegion(false)
    setPolygonPoints([])
    setDraggedPointIndex(null)
    setIsSelfIntersecting(false)
  }

  const handleToggleDeliveryAreaDropdown = () => {
    const isChecking = !showDeliveryAreaDropdown
    setShowDeliveryAreaDropdown(isChecking)

    if (isChecking) {
      // Start delivery area selection mode
      setIsSelectingDeliveryArea(true)
    } else {
      // Cancel delivery area selection
      setIsSelectingDeliveryArea(false)
    }
  }

  // Handle delivery area polygon selection
  const handleDeliveryAreaPolygonClick = (evt: { features: unknown[] }) => {
    if (!isSelectingDeliveryArea) return

    // Get the clicked feature
    const features = evt.features
    if (features && features.length > 0) {
      const selectedPolygon = features[0] as any // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log("Selected delivery area polygon:", selectedPolygon.properties)

      // Close the delivery area selection dialog
      setIsSelectingDeliveryArea(false)
      setShowDeliveryAreaDropdown(false)

      // You could store the selected polygon data here if needed
      // setSelectedDeliveryArea(selectedPolygon)
    }
  }

  // Check if two line segments intersect
  const doSegmentsIntersect = useCallback(
    (
      seg1: [{ lng: number; lat: number }, { lng: number; lat: number }],
      seg2: [{ lng: number; lat: number }, { lng: number; lat: number }],
    ) => {
      const [p1, p2] = seg1
      const [p3, p4] = seg2

      const ccw = (
        A: { lng: number; lat: number },
        B: { lng: number; lat: number },
        C: { lng: number; lat: number },
      ) => {
        return (
          (C.lat - A.lat) * (B.lng - A.lng) > (B.lat - A.lat) * (C.lng - A.lng)
        )
      }

      return (
        ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
        ccw(p1, p2, p3) !== ccw(p1, p2, p4)
      )
    },
    [],
  )

  // Check if polygon self-intersects using line segment intersection
  const checkSelfIntersection = useCallback(
    (points: Array<{ lng: number; lat: number }>) => {
      if (points.length < 4) return false // Need at least 4 points to self-intersect

      const segments: Array<
        [{ lng: number; lat: number }, { lng: number; lat: number }]
      > = []
      for (let i = 0; i < points.length; i++) {
        const next = (i + 1) % points.length
        const currentPoint = points[i]
        const nextPoint = points[next]
        if (!currentPoint || !nextPoint) continue
        segments.push([currentPoint, nextPoint])
      }

      // Check each segment against all non-adjacent segments
      for (let i = 0; i < segments.length; i++) {
        for (let j = i + 2; j < segments.length; j++) {
          // Skip adjacent segments and last-first comparison
          if (j === segments.length - 1 && i === 0) continue

          const seg1 = segments[i]
          const seg2 = segments[j]
          if (seg1 && seg2 && doSegmentsIntersect(seg1, seg2)) {
            return true
          }
        }
      }
      return false
    },
    [doSegmentsIntersect],
  )

  // Check for self-intersection whenever polygon points change
  useEffect(() => {
    if (polygonPoints.length >= 4) {
      setIsSelfIntersecting(checkSelfIntersection(polygonPoints))
    } else {
      setIsSelfIntersecting(false)
    }
  }, [polygonPoints, checkSelfIntersection])

  const handlePointDrag = (index: number, newLng: number, newLat: number) => {
    setPolygonPoints((prev) =>
      prev.map((point, i) =>
        i === index ? { lng: newLng, lat: newLat } : point,
      ),
    )
  }

  const handleDragStart = (index: number) => {
    setDraggedPointIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedPointIndex(null)
  }

  // Third column panel handlers
  const handleScenarioHover = (scenario: string | null) => {
    setHoveredScenario(scenario)
  }

  const handleScenarioSelect = (scenario: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenario)
        ? prev.filter((s) => s !== scenario)
        : [...prev, scenario],
    )
  }

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region)
  }

  const handleClearSelectedScenarios = () => {
    setSelectedScenarios([])
  }

  // Handle exploration panel
  const handleExploreScenarios = () => {
    console.log("handleExploreScenarios called!")
    console.log("Current selectedScenarios:", selectedScenarios)
    console.log("Mock scenario data:", mockScenarioData)

    // Initialize with selected scenarios
    const scenariosToExplore = mockScenarioData.map((scenario) => scenario.id)
    setScenarioOrder(scenariosToExplore)
    setShowExplorationPanel(true)

    console.log("Set showExplorationPanel to true")

    // Scroll to exploration panel
    setTimeout(() => {
      const element = document.getElementById("scenario-exploration-panel")
      console.log("Looking for exploration panel element:", element)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  // Handle drag end event for reordering scenario cards in exploration panel
  const handleScenarioDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setScenarioOrder((items) => {
        const oldIndex = items.indexOf(active.id.toString())
        const newIndex = items.indexOf(over.id.toString())
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Clear all scenario selections (return to original layout) - REMOVED since comparison dialog removed

  const handleClimateChange = (value: number) => {
    setSelectedClimate(value)
  }

  const handleOutcomeSelect = (outcome: string) => {
    if (selectedOutcome === outcome) {
      // If clicking the same outcome, deselect it
      setSelectedOutcome(null)
    } else {
      setSelectedOutcome(outcome)

      // Zoom to extent for the selected outcome
      const extent = OUTCOME_EXTENTS[outcome as keyof typeof OUTCOME_EXTENTS]
      if (extent) {
        fitBounds(
          extent.bounds,
          0, // pitch
          0, // bearing
          { top: 50, bottom: 50, left: 50, right: 50 }, // padding
          { duration: 2000 }, // transition options
        )
      }
    }
  }

  // Effect to manage delivery area selection polygons
  useEffect(() => {
    // Add the geospatial data source if it doesn't exist
    if (!hasSource("delivery-units")) {
      addSource("delivery-units", {
        type: "geojson",
        data: "/geospatial_data/du.geojson",
      })
    }

    if (isSelectingDeliveryArea) {
      // Add delivery area selection layer if not exists
      if (!hasLayer("delivery-area-selection-layer")) {
        addLayer(
          "delivery-area-selection-layer",
          "delivery-units",
          "fill",
          {
            "fill-color": "rgba(100, 164, 214, 0.4)", // Semi-transparent blue
            "fill-outline-color": theme.palette.brand.water, // Blue outline
          },
          {
            visibility: "visible",
          },
        )
      }

      // Add hover layer for delivery area selection
      if (!hasLayer("delivery-area-selection-hover")) {
        addLayer(
          "delivery-area-selection-hover",
          "delivery-units",
          "fill",
          {
            "fill-color": "rgba(100, 164, 214, 0.7)", // More opaque on hover
            "fill-outline-color": theme.palette.blue.darkest, // Darker blue outline
          },
          {
            visibility: "visible",
          },
          {
            filter: ["==", ["get", "DU_ID"], ""], // Initially show no features
          },
        )
      }
    } else {
      // Remove delivery area selection layers when not selecting
      if (hasLayer("delivery-area-selection-layer")) {
        removeLayer("delivery-area-selection-layer")
      }
      if (hasLayer("delivery-area-selection-hover")) {
        removeLayer("delivery-area-selection-hover")
      }
    }
  }, [
    isSelectingDeliveryArea,
    addSource,
    addLayer,
    removeLayer,
    hasSource,
    hasLayer,
    theme.palette.blue.darkest,
    theme.palette.brand.water,
  ])

  // Effect to manage map layers based on selected outcome
  useEffect(() => {
    // Add the geospatial data source if it doesn't exist
    if (!hasSource("delivery-units")) {
      addSource("delivery-units", {
        type: "geojson",
        data: "/geospatial_data/du.geojson",
      })
    }

    // Remove existing outcome layers
    if (hasLayer("community-deliveries-layer")) {
      removeLayer("community-deliveries-layer")
    }
    if (hasLayer("community-deliveries-hover")) {
      removeLayer("community-deliveries-hover")
    }
    if (hasLayer("agricultural-deliveries-layer")) {
      removeLayer("agricultural-deliveries-layer")
    }
    if (hasLayer("agricultural-deliveries-hover")) {
      removeLayer("agricultural-deliveries-hover")
    }

    // Add layer based on selected outcome
    if (selectedOutcome === "Community deliveries") {
      console.log("Adding community deliveries layer...")
      addLayer(
        "community-deliveries-layer",
        "delivery-units",
        "fill",
        {
          // Simplified tier color assignment - use string length for more reliable randomization
          "fill-color": [
            "case",
            ["==", ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4], 0],
            "#7b9d3f", // Tier 1 - Green
            ["==", ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4], 1],
            "#60aacb", // Tier 2 - Blue
            ["==", ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4], 2],
            "#FFB347", // Tier 3 - Orange
            ["==", ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4], 3],
            "#CD5C5C", // Tier 4 - Red
            "#60aacb", // Fallback blue for any edge cases
          ],
          "fill-opacity": 0.7,
          "fill-outline-color": theme.palette.blue.darkest, // Darker blue for outline
        },
        {
          visibility: "visible",
        },
        {
          filter: ["==", ["get", "Class"], "Urban"], // Filter to show only Urban areas
        },
      )

      // Add hover layer for community deliveries
      addLayer(
        "community-deliveries-hover",
        "delivery-units",
        "line",
        {
          "line-color": theme.palette.utility.white, // White stroke on hover
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            1, // At zoom 5: 1px width
            8,
            2, // At zoom 8: 2px width
            12,
            4, // At zoom 12: 4px width
          ],
          "line-opacity": [
            "case",
            ["==", ["get", "DU_ID"], hoveredFeatureId ?? ""],
            1,
            0,
          ],
        },
        {
          visibility: "visible",
        },
        {
          filter: ["==", ["get", "Class"], "Urban"],
        },
      )

      console.log("Community deliveries layer added")
    } else if (selectedOutcome === "Agricultural deliveries") {
      console.log("Adding agricultural deliveries layer...")
      addLayer(
        "agricultural-deliveries-layer",
        "delivery-units",
        "fill",
        {
          // Use the same working approach as Community deliveries
          "fill-color": [
            "case",
            [
              "in",
              ["slice", ["to-string", ["get", "DU_ID"]], 0, 1],
              ["literal", ["1", "5", "9"]],
            ],
            "#7b9d3f", // Green for IDs starting with 1,5,9
            [
              "in",
              ["slice", ["to-string", ["get", "DU_ID"]], 0, 1],
              ["literal", ["2", "6"]],
            ],
            "#60aacb", // Blue for IDs starting with 2,6
            [
              "in",
              ["slice", ["to-string", ["get", "DU_ID"]], 0, 1],
              ["literal", ["3", "7"]],
            ],
            "#FFB347", // Orange for IDs starting with 3,7
            [
              "in",
              ["slice", ["to-string", ["get", "DU_ID"]], 0, 1],
              ["literal", ["4", "8", "0"]],
            ],
            "#CD5C5C", // Red for IDs starting with 4,8,0
            "#FF00FF", // Magenta fallback to identify failures
          ],
          "fill-opacity": 0.7,
          "fill-outline-color": theme.palette.blue.darkest, // Darker blue for outline
        },
        {
          visibility: "visible",
        },
        {
          filter: ["==", ["get", "Class"], "Agriculture"], // Filter to show only Agriculture areas
        },
      )

      // Add hover layer for agricultural deliveries
      addLayer(
        "agricultural-deliveries-hover",
        "delivery-units",
        "line",
        {
          "line-color": theme.palette.utility.white, // White stroke on hover
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            1, // At zoom 5: 1px width
            8,
            2, // At zoom 8: 2px width
            12,
            4, // At zoom 12: 4px width
          ],
          "line-opacity": [
            "case",
            ["==", ["get", "DU_ID"], hoveredFeatureId ?? ""],
            1,
            0,
          ],
        },
        {
          visibility: "visible",
        },
        {
          filter: ["==", ["get", "Class"], "Agriculture"],
        },
      )

      console.log("Agricultural deliveries layer added")
    }
  }, [
    selectedOutcome,
    hoveredFeatureId,
    addSource,
    addLayer,
    removeLayer,
    hasSource,
    hasLayer,
    theme.palette.blue.darkest,
    theme.palette.utility.white,
  ])

  return (
    <Box
      id="map-panel"
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Full Screen Map */}
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        initialViewState={{
          longitude: -120.759,
          latitude: 38.032,
          zoom: 6.3,
        }}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        touchZoom={true}
        touchRotate={false}
        dragPan={draggedPointIndex === null} // Disable map dragging when dragging a vertex
        cursor={
          isDrawingCustomRegion
            ? "crosshair"
            : isSelectingDeliveryArea
              ? "crosshair"
              : draggedPointIndex !== null
                ? "grabbing"
                : "default"
        }
        onClick={
          isDrawingCustomRegion
            ? (evt: { lngLat: { lng: number; lat: number } }) => {
                const { lng, lat } = evt.lngLat

                // Check if clicking near the first point to close the polygon
                if (polygonPoints.length >= 3) {
                  const firstPoint = polygonPoints[0]
                  if (firstPoint) {
                    const distance = Math.sqrt(
                      Math.pow(lng - firstPoint.lng, 2) +
                        Math.pow(lat - firstPoint.lat, 2),
                    )
                    // If within ~0.01 degrees (roughly 1km), close the polygon
                    if (distance < 0.01) {
                      handlePolygonComplete()
                      return
                    }
                  }
                }

                // Otherwise, add a new point
                const newPoint = { lng, lat }
                setPolygonPoints(
                  (prev: Array<{ lng: number; lat: number }>) => [
                    ...prev,
                    newPoint,
                  ],
                )
              }
            : isSelectingDeliveryArea
              ? (evt: { target: unknown; point: unknown }) => {
                  try {
                    // Safety check: ensure layer exists before querying
                    if (!hasLayer("delivery-area-selection-layer")) return

                    // Handle delivery area polygon selection
                    const features = (evt.target as { queryRenderedFeatures: (point: unknown, options: { layers: string[] }) => unknown[] }).queryRenderedFeatures(
                      evt.point,
                      {
                        layers: ["delivery-area-selection-layer"],
                      },
                    )

                    if (features && features.length > 0) {
                      handleDeliveryAreaPolygonClick({ features })
                    }
                  } catch (error) {
                    console.warn(
                      "Delivery area click error (non-critical):",
                      error,
                    )
                  }
                }
              : selectedOutcome
                ? (evt: {
                    target: any // eslint-disable-line @typescript-eslint/no-explicit-any
                    point: any // eslint-disable-line @typescript-eslint/no-explicit-any
                    lngLat: { lng: number; lat: number }
                  }) => {
                    try {
                      // Safety check: ensure layer exists before querying
                      const layerName =
                        selectedOutcome === "Community deliveries"
                          ? "community-deliveries-layer"
                          : "agricultural-deliveries-layer"

                      if (!hasLayer(layerName)) return

                      // Handle polygon click for zoom functionality
                      const features = evt.target.queryRenderedFeatures(
                        evt.point,
                        {
                          layers: [layerName],
                        },
                      )

                      if (features && features.length > 0) {
                        // Use click coordinates as zoom target (simpler than centroid calculation)
                        flyTo({
                          longitude: evt.lngLat.lng,
                          latitude: evt.lngLat.lat,
                          zoom: 8, // Moderate zoom to show polygon with surrounding context
                          transitionOptions: {
                            duration: 1500,
                          },
                        })
                      }
                    } catch (error) {
                      console.warn(
                        "Outcome polygon click error (non-critical):",
                        error,
                      )
                    }
                  }
                : undefined
        }
        onMouseMove={(evt: {
          target: any // eslint-disable-line @typescript-eslint/no-explicit-any
          point: any // eslint-disable-line @typescript-eslint/no-explicit-any
          lngLat: { lng: number; lat: number }
        }) => {
          try {
            // Check if hovering over delivery area selection polygons
            if (isSelectingDeliveryArea) {
              // Safety check: ensure layer exists before querying
              if (!hasLayer("delivery-area-selection-layer")) return

              const features = evt.target.queryRenderedFeatures(evt.point, {
                layers: ["delivery-area-selection-layer"],
              })

              if (features && features.length > 0) {
                const feature = features[0]
                const featureId = feature.properties?.DU_ID || null

                // Update hover layer filter to highlight the hovered polygon
                if (hasLayer("delivery-area-selection-hover")) {
                  evt.target.setFilter("delivery-area-selection-hover", [
                    "==",
                    ["get", "DU_ID"],
                    featureId,
                  ])
                }

                // Change cursor to pointer
                evt.target.getCanvas().style.cursor = "pointer"
              } else {
                // Clear hover when not over any polygon
                if (hasLayer("delivery-area-selection-hover")) {
                  evt.target.setFilter("delivery-area-selection-hover", [
                    "==",
                    ["get", "DU_ID"],
                    "",
                  ])
                }
                evt.target.getCanvas().style.cursor = "crosshair"
              }
            }
            // Check if hovering over outcome polygons
            else if (selectedOutcome) {
              // Safety check: ensure layer exists before querying
              const layerName =
                selectedOutcome === "Community deliveries"
                  ? "community-deliveries-layer"
                  : "agricultural-deliveries-layer"

              if (!hasLayer(layerName)) return

              const features = evt.target.queryRenderedFeatures(evt.point, {
                layers: [layerName],
              })

              if (features && features.length > 0) {
                const feature = features[0]
                const newFeatureId = feature.properties?.DU_ID || null

                // Only update state if the feature has actually changed
                if (newFeatureId !== hoveredFeatureId) {
                  setHoveredFeatureId(newFeatureId)
                  setHoveredFeatureData({
                    modName: feature.properties?.Mod_Name?.trim() || null,
                    subName: feature.properties?.Sub_Name?.trim() || null,
                    type: feature.properties?.Type?.trim() || null,
                    coordinates: [evt.lngLat.lng, evt.lngLat.lat],
                  })
                }
                evt.target.getCanvas().style.cursor = "pointer"
              } else {
                if (hoveredFeatureId !== null) {
                  setHoveredFeatureId(null)
                  setHoveredFeatureData(null)
                }
                evt.target.getCanvas().style.cursor = ""
              }
            }
          } catch (error) {
            // Silently handle map interaction errors to prevent crashes
            console.warn("Map mouse move error (non-critical):", error)
          }
        }}
        onMouseLeave={() => {
          setHoveredFeatureId(null)
          setHoveredFeatureData(null)
        }}
        onError={(evt: unknown) => {
          // Surface mapbox or ReactMapGL errors in the console
          console.error("🗺️ Map error:", evt)
        }}
      >
        {/* Built-in Mapbox Controls */}
        <NavigationControl
          position="bottom-right"
          showCompass={true}
          showZoom={true}
          style={{ marginBottom: "60px" }}
        />
        <GeolocateControl
          position="bottom-right"
          trackUserLocation={true}
          showUserHeading={true}
          style={{ marginBottom: "120px" }} // Stack above NavigationControl
        />

        {/* Polygon Drawing Visualization */}
        {polygonPoints.length > 0 && (
          <>
            {/* Draw draggable markers for each point */}
            {polygonPoints.map((point, index) => (
              <Marker
                key={index}
                longitude={point.lng}
                latitude={point.lat}
                draggable={!isDrawingCustomRegion}
                onDragStart={() => handleDragStart(index)}
                onDrag={(evt: { lngLat: { lng: number; lat: number } }) => {
                  const { lng, lat } = evt.lngLat
                  handlePointDrag(index, lng, lat)
                }}
                onDragEnd={handleDragEnd}
                onClick={
                  isDrawingCustomRegion &&
                  index === 0 &&
                  polygonPoints.length >= 3
                    ? (evt) => {
                        evt.originalEvent.stopPropagation()
                        handlePolygonComplete()
                      }
                    : undefined
                }
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor:
                      draggedPointIndex === index
                        ? "#e17055" // Darker orange for dragged state
                        : isSelfIntersecting
                          ? "#ff6b6b" // Red for error/self-intersection
                          : "#ff9f43", // Orange for normal drawing
                    border:
                      isDrawingCustomRegion &&
                      index === 0 &&
                      polygonPoints.length >= 3
                        ? "3px solid #fff" // Thicker white border for first point when ready to close
                        : "2px solid white",
                    boxShadow:
                      draggedPointIndex === index
                        ? "0 4px 8px rgba(0,0,0,0.4)"
                        : isDrawingCustomRegion &&
                            index === 0 &&
                            polygonPoints.length >= 3
                          ? "0 3px 6px rgba(0,0,0,0.4)" // Enhanced shadow for first point
                          : "0 2px 4px rgba(0,0,0,0.3)",
                    cursor: isDrawingCustomRegion
                      ? "pointer"
                      : draggedPointIndex === index
                        ? "grabbing"
                        : "grab",
                    transform:
                      draggedPointIndex === index
                        ? "scale(1.2)"
                        : isDrawingCustomRegion &&
                            index === 0 &&
                            polygonPoints.length >= 3
                          ? "scale(1.15)" // Slightly larger first point when ready to close
                          : "scale(1)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform:
                        isDrawingCustomRegion &&
                        index === 0 &&
                        polygonPoints.length >= 3
                          ? "scale(1.25)" // Extra hover effect for first point
                          : "scale(1.1)",
                    },
                  }}
                />
              </Marker>
            ))}

            {/* Draw lines connecting the points */}
            {polygonPoints.length > 1 && (
              <Source
                id="polygon-lines"
                type="geojson"
                data={{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: polygonPoints.map((p) => [p.lng, p.lat]),
                  },
                }}
              >
                <Layer
                  id="polygon-line"
                  type="line"
                  paint={{
                    "line-color": isSelfIntersecting ? "#ff6b6b" : "#ff9f43",
                    "line-width": 2,
                    "line-dasharray": [2, 2],
                  }}
                />
              </Source>
            )}

            {/* Draw filled polygon when we have 3+ points and not actively drawing */}
            {polygonPoints.length >= 3 &&
              !isDrawingCustomRegion &&
              polygonPoints[0] && (
                <Source
                  id="polygon-fill"
                  type="geojson"
                  data={{
                    type: "Feature",
                    properties: {},
                    geometry: {
                      type: "Polygon",
                      coordinates: [
                        [
                          ...polygonPoints.map((p) => [p.lng, p.lat]),
                          [polygonPoints[0].lng, polygonPoints[0].lat],
                        ],
                      ],
                    },
                  }}
                >
                  <Layer
                    id="polygon-fill-layer"
                    type="fill"
                    paint={{
                      "fill-color": isSelfIntersecting ? "#ff6b6b" : "#ff9f43",
                      "fill-opacity": isSelfIntersecting ? 0.15 : 0.2,
                    }}
                  />
                  <Layer
                    id="polygon-stroke-layer"
                    type="line"
                    paint={{
                      "line-color": isSelfIntersecting ? "#ff6b6b" : "#ff9f43",
                      "line-width": 2,
                    }}
                  />
                </Source>
              )}
          </>
        )}

        {/* Hover popup for polygon information */}
        {hoveredFeatureData && (
          <Popup
            longitude={hoveredFeatureData.coordinates[0]}
            latitude={hoveredFeatureData.coordinates[1]}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -10]}
          >
            <div>
              {hoveredFeatureData.modName && (
                <div>{hoveredFeatureData.modName}</div>
              )}
              {hoveredFeatureData.subName && (
                <div style={{ marginTop: "2px" }}>
                  {hoveredFeatureData.subName}
                </div>
              )}
              {hoveredFeatureData.type && (
                <div style={{ marginTop: "2px" }}>
                  {hoveredFeatureData.type}
                </div>
              )}
            </div>
          </Popup>
        )}

        {/* Custom map markers */}
        {/* Marker 1: Los Angeles area */}
        <Marker
          longitude={-118.2437}
          latitude={34.0522}
          anchor="bottom" // Bottom middle tip attaches to coordinates
        >
          <MapMarkerTooltip
            text="Los Angeles - Urban water demand performing well"
            statusColor="#4CAF50"
          >
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.3)",
                },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map_markers/los_angeles.png"
                alt="Los Angeles marker"
                style={{
                  width: "60px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              />
              {/* Status indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50", // Green for good status
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>

        {/* Marker 2: Sacramento area - positioned over a red delivery unit */}
        <Marker
          longitude={-121.3}
          latitude={38.6}
          anchor="bottom" // Bottom middle tip attaches to coordinates
        >
          <MapMarkerTooltip
            text="Sacramento - Municipal water supply under stress"
            statusColor="#ff4444"
          >
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.3)",
                },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map_markers/drinking_water.png"
                alt="Sacramento drinking water marker"
                style={{
                  width: "60px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              />
              {/* Status indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#ff4444", // Red for bad status
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>

        {/* Marker 3: Westlands W.D. - positioned over Westlands Water District polygon */}
        <Marker
          longitude={-120.58}
          latitude={36.58}
          anchor="bottom" // Bottom middle tip attaches to coordinates
        >
          <MapMarkerTooltip
            text="Central Valley - Agricultural irrigation stable"
            statusColor="#4CAF50"
          >
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.3)",
                },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map_markers/farmers.png"
                alt="Central Valley marker"
                style={{
                  width: "60px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              />
              {/* Status indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50", // Green
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>

        {/* Marker 4: Chico area - positioned over agricultural polygon to the west */}
        <Marker
          longitude={-121.95}
          latitude={39.7285}
          anchor="bottom" // Bottom middle tip attaches to coordinates
        >
          <MapMarkerTooltip
            text="Chico - Crop irrigation facing drought challenges"
            statusColor="#ff4444"
          >
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.3)",
                },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map_markers/grapes.png"
                alt="Chico grapes marker"
                style={{
                  width: "60px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              />
              {/* Status indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#ff4444", // Red for bad status
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>
      </Map>

      {/* Custom region drawing dialog */}
      <MapPromptDialog
        isVisible={isDrawingCustomRegion}
        title="Draw Custom Region"
        subtitle={`Click to add points • Click first point to finish${
          polygonPoints.length > 0 ? ` • ${polygonPoints.length} points` : ""
        }`}
        actions={
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            {polygonPoints.length > 0 && (
              <Box
                onClick={(e) => {
                  e.stopPropagation()
                  setPolygonPoints([])
                  setIsSelfIntersecting(false)
                  setDraggedPointIndex(null)
                }}
                sx={(theme) => ({
                  fontSize: theme.mapPromptDialog.typography.action.fontSize,
                  color: theme.palette.blue.bright,
                  cursor: theme.mapPromptDialog.typography.action.cursor,
                  fontWeight:
                    theme.mapPromptDialog.typography.action.fontWeight,
                  textDecoration:
                    theme.mapPromptDialog.typography.action.textDecoration,
                  "&:hover": {
                    color: theme.palette.blue.light,
                  },
                })}
              >
                Redraw
              </Box>
            )}
            <Box
              onClick={(e) => {
                e.stopPropagation()
                handleClearCustomRegion()
              }}
              sx={(theme) => ({
                fontSize: theme.mapPromptDialog.typography.action.fontSize,
                color: theme.palette.blue.bright,
                cursor: theme.mapPromptDialog.typography.action.cursor,
                fontWeight: theme.mapPromptDialog.typography.action.fontWeight,
                textDecoration:
                  theme.mapPromptDialog.typography.action.textDecoration,
                "&:hover": {
                  color: theme.palette.blue.light,
                },
              })}
            >
              Cancel
            </Box>
          </Box>
        }
      />

      {/* Comparison mode dialog - REMOVED per user request */}

      {/* Delivery area selection dialog */}
      <MapPromptDialog
        isVisible={isSelectingDeliveryArea}
        title="Select Delivery Area"
        subtitle="Click on a polygon on the map to select a delivery area"
        actions={
          <Box
            onClick={(e) => {
              e.stopPropagation()
              setIsSelectingDeliveryArea(false)
              setShowDeliveryAreaDropdown(false)
            }}
            sx={(theme) => ({
              fontSize: theme.mapPromptDialog.typography.action.fontSize,
              color: theme.palette.blue.bright,
              cursor: theme.mapPromptDialog.typography.action.cursor,
              fontWeight: theme.mapPromptDialog.typography.action.fontWeight,
              textDecoration:
                theme.mapPromptDialog.typography.action.textDecoration,
              "&:hover": {
                color: theme.palette.blue.light,
              },
            })}
          >
            Cancel
          </Box>
        }
      />

      {/* Self-Intersection Warning */}
      {isSelfIntersecting && !isDrawingCustomRegion && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 107, 107, 0.95)",
            color: "white",
            padding: 2,
            borderRadius: (theme) => theme.borderRadius.card,
            zIndex: (theme) => theme.zIndex.tooltip,
            textAlign: "center",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Box
            sx={{
              fontSize: (theme) => theme.typography.compact.title.fontSize,
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            ⚠️ Self-Intersecting Polygon
          </Box>
          <Box
            sx={{
              fontSize: (theme) => theme.typography.compact.subtitle.fontSize,
              opacity: 0.9,
            }}
          >
            Drag vertices to fix overlapping edges
          </Box>
        </Box>
      )}

      {/* Dummy data alert - lower left corner */}
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          left: 16,
          backgroundColor: "rgba(255, 165, 0, 0.95)", // Orange background for info alert
          color: "white",
          padding: 2,
          borderRadius: (theme) => theme.borderRadius.card,
          zIndex: (theme) => theme.zIndex.tooltip,
          textAlign: "center",
          pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <Box
          sx={{
            fontSize: (theme) => theme.typography.compact.title.fontSize,
            fontWeight: 500,
          }}
        >
          📊 Dummy data
        </Box>
      </Box>

      {/* Climate card - positioned as direct child of MapPanel for proper positioning */}
      {isInComparisonMode && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: (theme) => theme.zIndex.floatingElements,
            pointerEvents: "auto",
          }}
        >
          <Box
            sx={{
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: (theme) => theme.borderRadius.card,
              border: "1px solid",
              borderColor: (theme) => theme.palette.divider,
              padding: 3,
              display: "flex",
              flexDirection: "column",
              height: "auto",
            }}
          >
            <Box sx={{ flexShrink: 0 }}>
              <Box
                sx={{
                  color: (theme) => theme.palette.blue.medium,
                  textTransform: "uppercase",
                  letterSpacing: "0.75px",
                  fontSize: (theme) =>
                    theme.typography.compact.caption.fontSize,
                  fontWeight: 500,
                  display: "block",
                  mb: 0.5,
                }}
              >
                CLIMATE
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
                    color: (theme) => theme.palette.blue.darkest,
                    fontFamily:
                      '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontWeight: 500,
                    fontSize: "1.5rem",
                    lineHeight: 1.3,
                    mb: 0,
                  }}
                >
                  Climate
                </Box>
              </Box>

              {/* Climate instruction text */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <Box
                    component="span"
                    sx={{
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  >
                    Slide
                  </Box>{" "}
                  to explore how climate affects outcomes.
                </Typography>
              </Box>

              {/* Climate slider */}
              <DiscreteSlider
                stops={[
                  "Warmer Wetter",
                  "Historical",
                  "Warmer Drier I",
                  "Warmer Drier II",
                  "Warmer Drier III",
                  "Warmer Drier IV",
                ]}
                value={selectedClimate}
                onChange={(value) => {
                  handleClimateChange(value)
                  console.log("Climate changed to:", value)
                }}
                labelPosition="top"
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Scenario Exploration Panel */}
      {showExplorationPanel &&
        (() => {
          console.log("Rendering exploration panel")
          return (
            <Box
              id="scenario-exploration-panel"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: theme.palette.background.default,
                zIndex: (theme) => theme.zIndex.modal,
                overflow: "auto",
                p: 3,
              }}
            >
              {/* Header with inline dropdowns */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                  flexWrap: "wrap",
                  gap: 3,
                }}
              >
                {/* Left side: Title */}
                <Typography
                  variant="h4"
                  sx={{
                    color: theme.palette.blue.darkest,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  Scenario Exploration
                </Typography>

                {/* Center: Control dropdowns */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    alignItems: "flex-end", // Align with baseline of title
                  }}
                >
                  {/* Outcome dropdown */}
                  <Box sx={{ minWidth: "200px" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                        mb: 1,
                      }}
                    >
                      Outcome
                    </Typography>
                    <Select
                      size="small"
                      value={selectedOutcome || ""}
                      onChange={(e) => handleOutcomeSelect(e.target.value)}
                      displayEmpty
                      sx={{
                        width: "100%",
                        backgroundColor: theme.palette.common.white,
                        borderRadius: theme.borderRadius.rounded,
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: theme.palette.common.white,
                            borderRadius: theme.borderRadius.rounded,
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                            border: `1px solid ${theme.palette.grey[200]}`,
                          },
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Select outcome</em>
                      </MenuItem>
                      {OUTCOMES.map((outcome) => (
                        <MenuItem key={outcome} value={outcome}>
                          {outcome}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  {/* Visualization type dropdown */}
                  <Box sx={{ minWidth: "180px" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                        mb: 1,
                      }}
                    >
                      Chart type
                    </Typography>
                    <Select
                      size="small"
                      value={explorationVisualizationType}
                      onChange={(e) => {
                        setExplorationVisualizationType(
                          e.target.value as
                            | "bars"
                            | "rose"
                            | "quartile"
                            | "map",
                        )
                        console.log(
                          "Visualization type changed:",
                          e.target.value,
                        )
                      }}
                      sx={{
                        width: "100%",
                        backgroundColor: theme.palette.common.white,
                        borderRadius: theme.borderRadius.rounded,
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: theme.palette.common.white,
                            borderRadius: theme.borderRadius.rounded,
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                            border: `1px solid ${theme.palette.grey[200]}`,
                          },
                        },
                      }}
                    >
                      <MenuItem value="bars">Bars</MenuItem>
                      <MenuItem value="rose">Rose</MenuItem>
                      <MenuItem value="quartile">Quartile</MenuItem>
                      <MenuItem value="map">Map</MenuItem>
                    </Select>
                  </Box>

                  {/* Refine region dropdown */}
                  <Box sx={{ minWidth: "180px" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                        mb: 1,
                      }}
                    >
                      Refine region
                    </Typography>
                    <Select
                      size="small"
                      value={selectedRegion}
                      onChange={(e) => handleRegionSelect(e.target.value)}
                      sx={{
                        width: "100%",
                        backgroundColor: theme.palette.common.white,
                        borderRadius: theme.borderRadius.rounded,
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: theme.palette.common.white,
                            borderRadius: theme.borderRadius.rounded,
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                            border: `1px solid ${theme.palette.grey[200]}`,
                          },
                        },
                      }}
                    >
                      <MenuItem value="Central Valley">Central Valley</MenuItem>
                      <MenuItem value="Sacramento Valley">
                        Sacramento Valley
                      </MenuItem>
                      <MenuItem value="San Joaquin Valley">
                        San Joaquin Valley
                      </MenuItem>
                      <MenuItem value="Delta">Delta</MenuItem>
                      <MenuItem value="Tulare Basin">Tulare Basin</MenuItem>
                    </Select>
                  </Box>
                </Box>

                {/* Right side: Back button */}
                <Button
                  variant="text"
                  onClick={() => setShowExplorationPanel(false)}
                  sx={{
                    color: theme.palette.blue.bright,
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: theme.palette.blue.darkest,
                    },
                  }}
                >
                  ← Back to Map
                </Button>
              </Box>

              {/* Instructions */}
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  color: theme.palette.text.secondary,
                }}
              >
                Compare scenarios in detail. Drag and drop cards to reorder
                them. Build your story.
              </Typography>

              {/* Drag and Drop Grid */}
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleScenarioDragEnd}
              >
                <SortableContext
                  items={scenarioOrder}
                  strategy={rectSortingStrategy}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      },
                      gridTemplateRows: "repeat(2, 400px)", // Two rows of 400px height for proper 2x2 chart sizing
                      gap: 3,
                      minHeight: "820px", // 2 rows * 400px + gap
                      paddingBottom: "120px", // Extra space to clear climate card
                      // Reserve bottom-left space for climate card
                      "& > div:nth-of-type(4)": {
                        gridColumn: { xs: "1", md: "2", lg: "3" }, // Position 4th card in different column
                      },
                    }}
                  >
                    {scenarioOrder.map((scenarioId) => {
                      const scenario = mockScenarioData.find(
                        (s) => s.id === scenarioId,
                      )
                      if (!scenario) return null

                      return (
                        <SortableScenarioExplorationCard
                          key={scenario.id}
                          id={scenario.id}
                          title={scenario.title}
                          description={scenario.description}
                          outcomes={scenario.outcomes}
                          isBaseline={scenario.isBaseline}
                          selectedClimate={selectedClimate}
                          visualizationType={explorationVisualizationType}
                        />
                      )
                    })}
                  </Box>
                </SortableContext>
              </DndContext>

              {/* Climate slider - positioned in bottom-left grid space */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 144, // Position above the padding area
                  left: 24, // Align with grid start
                  zIndex: 10,
                  width: "calc(33.333% - 16px)", // Match grid column width minus gap
                }}
              >
                <Box
                  sx={{
                    backdropFilter: "blur(10px)",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: theme.borderRadius.card,
                    border: "1px solid",
                    borderColor: theme.palette.divider,
                    padding: 3,
                    height: "auto", // Auto height - only as tall as needed
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      color: theme.palette.blue.medium,
                      textTransform: "uppercase",
                      letterSpacing: "0.75px",
                      fontSize: (theme) =>
                        theme.typography.compact.caption.fontSize,
                      fontWeight: 500,
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    CLIMATE
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.blue.darkest,
                      fontWeight: 500,
                      mb: 1,
                      fontSize: "1.2rem",
                    }}
                  >
                    Climate
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      mb: 2,
                      fontSize: (theme) =>
                        theme.typography.compact.title.fontSize,
                      lineHeight: 1.4,
                    }}
                  >
                    Adjust climate to see how it affects all scenarios
                  </Typography>
                  <DiscreteSlider
                    stops={[
                      "Warmer Wetter",
                      "Historical",
                      "Warmer Drier I",
                      "Warmer Drier II",
                      "Warmer Drier III",
                      "Warmer Drier IV",
                    ]}
                    value={selectedClimate}
                    onChange={(value) => {
                      handleClimateChange(value)
                      console.log(
                        "Climate changed in exploration panel:",
                        value,
                      )
                    }}
                    labelPosition="top"
                  />
                </Box>
              </Box>
            </Box>
          )
        })()}

      {/* Overlay Controls */}
      <MapControls
        isDrawingCustomRegion={isDrawingCustomRegion}
        polygonPoints={polygonPoints}
        draggedPointIndex={draggedPointIndex}
        onSelectRegionOnMap={handleSelectRegionOnMap}
        onClearCustomRegion={handleClearCustomRegion}
        onPointDrag={handlePointDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        showDeliveryAreaDropdown={showDeliveryAreaDropdown}
        onToggleDeliveryAreaDropdown={handleToggleDeliveryAreaDropdown}
        hoveredScenario={hoveredScenario}
        selectedScenarios={selectedScenarios}
        selectedRegion={selectedRegion}
        onScenarioHover={handleScenarioHover}
        onScenarioSelect={handleScenarioSelect}
        onRegionSelect={handleRegionSelect}
        selectedClimate={selectedClimate}
        onClimateChange={handleClimateChange}
        selectedOutcome={selectedOutcome}
        onOutcomeSelect={handleOutcomeSelect}
        onClearSelectedScenarios={handleClearSelectedScenarios}
        isInComparisonMode={isInComparisonMode}
        onExploreScenarios={handleExploreScenarios}
      />
    </Box>
  )
}
