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

// Custom triangle component that matches checkbox styling
interface TriangleCheckboxProps {
  expanded: boolean
}

const TriangleCheckbox: React.FC<TriangleCheckboxProps> = ({ expanded }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        ...theme.mixins.triangleCheckbox,
        border: `1px solid ${theme.palette.text.primary}`,
        margin: theme.spacing(0.5),
        transform: "translateY(-3px)", // Fine-tune vertical position
        color: theme.palette.text.primary,
        "&:hover": {
          backgroundColor: `${theme.palette.action.hover}30`,
        },
      }}
    >
      <Box
        component="span"
        sx={{
          display: "inline-block",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }}
      >
        ▼
      </Box>
    </Box>
  )
}

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
  subOptions?: PresetOption[]
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
      "California law requiring priority groundwater basins to be managed sustainably by 2040–2042 to avoid long-term depletion.",
    glossaryEntry: "Sustainable Groundwater Management Act (SGMA)",
    subOptions: [
      {
        id: "sgma-sjv-only",
        label: "San Joaquin Valley only",
        description:
          "SGMA implementation focused exclusively on the San Joaquin Valley groundwater basins, maintaining current land use patterns while establishing groundwater sustainability by 2040.",
        glossaryEntry: "SGMA - San Joaquin Valley Only",
        mapCoordinates: {
          longitude: -120.5,
          latitude: 36.0,
          zoom: 8.0,
        },
      },
      {
        id: "sgma-sjv-ag-reductions",
        label: "San Joaquin Valley with agricultural reductions",
        description:
          "SGMA implementation in the San Joaquin Valley that includes projected agricultural land use reductions to achieve groundwater sustainability.",
        glossaryEntry: "SGMA - San Joaquin Valley with Agricultural Reductions",
        mapCoordinates: {
          longitude: -120.5,
          latitude: 36.0,
          zoom: 8.0,
        },
      },
      {
        id: "sgma-sac-sjv",
        label: "Sacramento and San Joaquin Valleys",
        description:
          "SGMA implementation across both the Sacramento Valley and San Joaquin Valley groundwater basins, establishing coordinated groundwater sustainability across both regions.",
        glossaryEntry: "SGMA - Sacramento and San Joaquin Valleys",
        mapCoordinates: {
          longitude: -121.0,
          latitude: 37.5,
          zoom: 7.0,
        },
      },
      {
        id: "sgma-sac-sjv-ag-reductions",
        label:
          "Sacramento and San Joaquin Valleys with agricultural reductions",
        description:
          "SGMA implementation scenario covering both Sacramento and San Joaquin Valleys with projected agricultural land use reductions.",
        glossaryEntry:
          "SGMA - Sacramento and San Joaquin Valleys with Agricultural Reductions",
        mapCoordinates: {
          longitude: -121.0,
          latitude: 37.5,
          zoom: 7.0,
        },
      },
    ],
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
  const [expandedOptions, setExpandedOptions] = React.useState<Set<string>>(
    new Set(),
  )

  const toggleExpanded = (optionId: string) => {
    setExpandedOptions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(optionId)) {
        newSet.delete(optionId)
      } else {
        newSet.add(optionId)
      }
      return newSet
    })
  }

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

  const renderOption = (option: PresetOption, isSubOption = false) => (
    <Box
      key={option.id}
      sx={{
        display: "flex",
        alignItems: "center",
        pl: isSubOption ? 3 : 0, // Indent sub-options
        width: "100%", // Ensure full width
        minWidth: 0, // Allow flex items to shrink below their minimum content size
      }}
    >
      {/* For parent options with sub-options, show triangle checkbox */}
      {!isSubOption && option.subOptions ? (
        <FormControlLabel
          control={
            <TriangleCheckbox expanded={expandedOptions.has(option.id)} />
          }
          label={option.label}
          onClick={() => toggleExpanded(option.id)}
          sx={{ width: "100%", cursor: "pointer" }}
        />
      ) : (
        /* For sub-options, show regular checkbox */
        <FormControlLabel
          control={<Checkbox size="small" />}
          label={option.label}
          sx={{ width: "100%" }}
        />
      )}

      {/* Info tooltip */}
      <Tooltip
        title={
          <Box>
            <Box sx={{ mb: 1 }}>{option.description}</Box>
            {renderTooltipActions(option)}
          </Box>
        }
        arrow
        placement="top-end"
        // Interaction timing for button clicks
        enterDelay={200}
        leaveDelay={500} // Longer delay allows button interactions
        enterNextDelay={100}
        // Keep all interaction methods enabled
        disableFocusListener={false}
        disableHoverListener={false}
        disableTouchListener={false}
        // Fine-tune positioning
        slotProps={{
          popper: {
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [5, -10], // [horizontal, vertical]
                },
              },
            ],
          },
        }}
      >
        <IconButton
          size="small"
          sx={{
            ml: 1,
            padding: "4px", // Larger click target
            color: (theme) => theme.palette.action.hover,
            "&:hover": {
              color: (theme) => theme.palette.blue.bright,
              backgroundColor: "transparent",
            },
          }}
        >
          <InfoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  )

  return (
    <Box>
      <Stack spacing={0.5}>
        {presetOptions.map((option) => (
          <Box key={option.id}>
            {/* Render the main option */}
            {renderOption(option)}

            {/* Render sub-options if expanded */}
            {option.subOptions && expandedOptions.has(option.id) && (
              <Box sx={{ mt: 0.5 }}>
                <Stack spacing={0.5}>
                  {option.subOptions.map((subOption) =>
                    renderOption(subOption, true),
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
