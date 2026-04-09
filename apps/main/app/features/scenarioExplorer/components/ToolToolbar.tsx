"use client"

/**
 * ToolToolbar. Shared toolbar rendered above the active tool content.
 *
 * Layout (left to right):
 * 1. "Show map" toggle (label + MUI Switch)
 * 2. "Show distribution" toggle (label + MUI Switch)
 * 3. "Choose locations to track" button
 * 4. "View by climate" hydroclimate chooser icons
 */

import React from "react"
import {
  Box,
  Typography,
  useTheme,
  LocationOnIcon,
  Switch,
} from "@repo/ui/mui"
import { HydroclimateChooser } from "../../scenarios/components"
import { useScenarioExplorerStore } from "../store"

export default function ToolToolbar() {
  const theme = useTheme()
  const {
    hydroclimate,
    setHydroclimate,
    showMap,
    setShowMap,
    outcomeDisplayMode,
    setOutcomeDisplayMode,
    showLocationPicker,
    setShowLocationPicker,
  } = useScenarioExplorerStore()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 1.5,
        py: 0.5,
        minHeight: 44,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          Show map
        </Typography>
        <Switch
          size="small"
          checked={showMap}
          onChange={(_, checked) => setShowMap(checked)}
          sx={{ ml: -0.5 }}
        />
      </Box>

      <Box
        sx={{
          width: "1px",
          height: 24,
          backgroundColor: theme.palette.divider,
          flexShrink: 0,
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          Show distribution
        </Typography>
        <Switch
          size="small"
          checked={outcomeDisplayMode === "distribution"}
          onChange={(_, checked) =>
            setOutcomeDisplayMode(checked ? "distribution" : "summary")
          }
          sx={{ ml: -0.5 }}
        />
      </Box>

      <Box
        sx={{
          width: "1px",
          height: 24,
          backgroundColor: theme.palette.divider,
          flexShrink: 0,
        }}
      />

      <Box
        component="button"
        type="button"
        onClick={() => setShowLocationPicker(!showLocationPicker)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: theme.palette.text.primary,
        }}
      >
        <LocationOnIcon sx={{ fontSize: "1.25rem" }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          Choose locations to track
        </Typography>
      </Box>

      <Box
        sx={{
          width: "1px",
          height: 24,
          backgroundColor: theme.palette.divider,
          flexShrink: 0,
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          View by climate
        </Typography>
        <HydroclimateChooser
          layout="horizontal"
          showTitle={false}
          showLabels={false}
          hideDisabled
          iconSize="28px"
          iconFontSize="1rem"
          value={hydroclimate}
          onChange={setHydroclimate}
        />
      </Box>
    </Box>
  )
}
