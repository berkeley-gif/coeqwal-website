"use client"

import React from "react"
import {
  Box,
  Stack,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
  useTheme,
} from "@repo/ui/mui"
import { useMap } from "@repo/map"
import InfoIcon from "@mui/icons-material/Info"
import { useDrawerStore } from "@repo/state"

interface PresetOption {
  id: string
  label: string
  description: string
  glossaryEntry?: string
  mapCoordinates?: {
    longitude: number
    latitude: number
    zoom: number
  }
}

interface PresetsPanelProps {
  onViewOnMap?: (coordinates: {
    longitude: number
    latitude: number
    zoom: number
  }) => void
}

const presetOptions: PresetOption[] = [
  {
    id: "sgma",
    label: "Sustainable Groundwater Management Act (SGMA)",
    description:
      "California law that requires local agencies to manage groundwater sustainably, balancing water use and recharge to avoid long-term depletion.",
    glossaryEntry: "Sustainable Groundwater Management Act (SGMA)",
    mapCoordinates: {
      longitude: -119.5,
      latitude: 36.5,
      zoom: 7.5,
    },
  },
  {
    id: "usbr-alt3",
    label: "USBR Alternative 3",
    description:
      "U.S. Bureau of Reclamation's Alternative 3 scenario exploring operational changes and infrastructure modifications to improve water delivery reliability while addressing environmental concerns.",
    glossaryEntry: "USBR Alternative 3",
    mapCoordinates: {
      longitude: -121.5,
      latitude: 38.0,
      zoom: 8.0,
    },
  },
  {
    id: "delta-conveyance",
    label: "Delta Conveyance Tunnel, Bethany Alternative",
    description:
      "Delta Conveyance Project tunnel route ending at Bethany Reservoir instead of Clifton Court Forebay, designed to improve water conveyance and reduce fish impacts in the Delta.",
    glossaryEntry: "Delta Conveyance Project",
    mapCoordinates: {
      longitude: -121.6,
      latitude: 37.8,
      zoom: 9.0,
    },
  },
]

export default function PresetsPanel({ onViewOnMap }: PresetsPanelProps) {
  const { setDrawerContent, openDrawer } = useDrawerStore()
  const { withMap } = useMap()
  const theme = useTheme()
  const [recentMapCalls, setRecentMapCalls] = React.useState<Set<string>>(
    new Set(),
  )

  const handleReadMore = (glossaryEntry: string, event?: React.MouseEvent) => {
    // Prevent event bubbling that might close tooltip
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Open glossary to specific entry
    setDrawerContent({
      selectedTerm: glossaryEntry,
    })
    openDrawer("glossary")
  }

  const handleViewOnMap = (
    coordinates: { longitude: number; latitude: number; zoom: number },
    event?: React.MouseEvent,
  ) => {
    // Prevent event bubbling that might close tooltip
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (onViewOnMap) {
      // Create a unique key for these coordinates
      const coordKey = `${coordinates.longitude.toFixed(3)}-${coordinates.latitude.toFixed(3)}-${coordinates.zoom.toFixed(1)}`

      // Check if we're already at these coordinates
      let shouldSkip = false
      withMap((mapRef) => {
        const map = mapRef.getMap()
        const center = map.getCenter()
        const zoom = map.getZoom()

        // Check if we're already at the target coordinates (with tolerance for floating point precision)
        const isSameLocation =
          Math.abs(center.lng - coordinates.longitude) < 0.001 &&
          Math.abs(center.lat - coordinates.latitude) < 0.001 &&
          Math.abs(zoom - coordinates.zoom) < 0.1

        if (isSameLocation) {
          console.log("Already at target coordinates, skipping animation")
          shouldSkip = true
        }
      })

      if (shouldSkip) {
        return
      }

      // Track this call for visual feedback
      setRecentMapCalls((prev) => new Set(prev).add(coordKey))

      // Clear the tracking after animation completes (default flyTo duration is 2000ms)
      setTimeout(() => {
        setRecentMapCalls((prev) => {
          const newSet = new Set(prev)
          newSet.delete(coordKey)
          return newSet
        })
      }, 3000) // Slightly longer than animation duration

      onViewOnMap(coordinates)
    }
  }

  const renderTooltipActions = (option: PresetOption) => (
    <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
      {option.glossaryEntry && (
        <Box
          component="button"
          onClick={(event) => handleReadMore(option.glossaryEntry!, event)}
          onMouseDown={(event) => event.preventDefault()} // Prevent focus loss
          onMouseLeave={(event) => {
            // Prevent tooltip from closing when moving cursor off button
            event.stopPropagation()
          }}
          sx={{
            ...theme.mixins.tooltipActionButton,
            color: theme.palette.common.white,
            backgroundColor: theme.palette.blue.darkest,
            "&:hover": {
              backgroundColor: theme.palette.blue.dark,
              transform: "translateY(-1px)",
              boxShadow: "0 2px 8px rgba(52, 69, 116, 0.3)",
            },
          }}
        >
          Read more
        </Box>
      )}
      {option.mapCoordinates && (
        <Box
          component="button"
          onClick={(event) => handleViewOnMap(option.mapCoordinates!, event)}
          onMouseDown={(event) => event.preventDefault()} // Prevent focus loss
          onMouseLeave={(event) => {
            // Prevent tooltip from closing when moving cursor off button
            event.stopPropagation()
          }}
          sx={{
            ...theme.mixins.tooltipActionButton,
            color: theme.palette.common.white,
            backgroundColor: (() => {
              const coordKey = `${option.mapCoordinates!.longitude.toFixed(3)}-${option.mapCoordinates!.latitude.toFixed(3)}-${option.mapCoordinates!.zoom.toFixed(1)}`
              return recentMapCalls.has(coordKey)
                ? theme.palette.grey[400]
                : theme.palette.blue.darkest
            })(),
            "&:hover": {
              backgroundColor: (() => {
                const coordKey = `${option.mapCoordinates!.longitude.toFixed(3)}-${option.mapCoordinates!.latitude.toFixed(3)}-${option.mapCoordinates!.zoom.toFixed(1)}`
                return recentMapCalls.has(coordKey)
                  ? theme.palette.grey[500]
                  : theme.palette.blue.dark
              })(),
              transform: "translateY(-1px)",
              boxShadow: "0 2px 8px rgba(52, 69, 116, 0.3)",
            },
          }}
        >
          View on map
        </Box>
      )}
    </Box>
  )

  return (
    <Box>
      <Stack spacing={0.5}>
        {presetOptions.map((option) => (
          <Box key={option.id} sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Checkbox size="small" />}
              label={option.label}
              sx={{ flex: 1 }}
            />
            <Tooltip
              title={
                <Box>
                  <Box sx={{ mb: 1 }}>{option.description}</Box>
                  {renderTooltipActions(option)}
                </Box>
              }
              arrow
              placement="top-end"
              // Enhanced interaction timing for button clicks
              enterDelay={200}
              leaveDelay={500} // Longer delay allows button interactions
              enterNextDelay={100}
              // Keep all interaction methods enabled
              disableFocusListener={false}
              disableHoverListener={false}
              disableTouchListener={false}
              // Fine-tune positioning
              PopperProps={{
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -4], // [horizontal, vertical]
                    },
                  },
                ],
              }}
            >
              <Box
                sx={{
                  // Create a larger hover target area
                  padding: "4px",
                  margin: "-4px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    ml: 1,
                    color: (theme) => theme.palette.action.hover,
                    "&:hover": {
                      color: (theme) => theme.palette.blue.bright,
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Box>
            </Tooltip>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
