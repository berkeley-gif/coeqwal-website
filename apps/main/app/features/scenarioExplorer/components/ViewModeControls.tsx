"use client"

/**
 * ViewModeControls - View mode buttons and hydroclimate chooser for explorer toolbar
 */

import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  ViewListIcon,
  CompareArrowsIcon,
} from "@repo/ui/mui"
import Image from "next/image"
import { HydroclimateChooser } from "../../scenarios/components"
import type { ExploreMode } from "../exploreView"

interface ViewModeControlsProps {
  mode: ExploreMode
  onModeChange: (mode: ExploreMode) => void
}

function Divider() {
  const theme = useTheme()
  return (
    <Box
      sx={{
        width: "1px",
        alignSelf: "stretch",
        backgroundColor: theme.palette.grey[300],
        minHeight: theme.spacing(5),
      }}
    />
  )
}

export function ViewModeControls({ mode, onModeChange }: ViewModeControlsProps) {
  const theme = useTheme()

  const buttonSx = (isActive: boolean, includeColor = true) => ({
    width: { xs: 32, lg: 36 },
    height: { xs: 32, lg: 36 },
    backgroundColor: isActive
      ? theme.palette.interaction.selectedBackground
      : "transparent",
    ...(includeColor && {
      color: isActive ? theme.palette.blue.bright : theme.palette.grey[600],
    }),
    "&:hover": {
      backgroundColor: theme.palette.interaction.selectedBackground,
    },
  })

  return (
    <>
      <Divider />

      {/* View mode buttons */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: theme.space.gap.md }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.grey[900],
          }}
        >
          View
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: theme.space.gap.xs }}>
          <Tooltip title="List view" arrow>
            <IconButton onClick={() => onModeChange("list")} sx={buttonSx(mode === "list")}>
              <ViewListIcon sx={{ fontSize: "1.5rem" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Map view" arrow>
            <IconButton onClick={() => onModeChange("map")} sx={buttonSx(mode === "map", false)}>
              <Image
                src="/images/icons/map.svg"
                alt="Map view"
                width={24}
                height={24}
                style={{ opacity: mode === "map" ? 1 : 0.6 }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Comparison view" arrow>
            <IconButton onClick={() => onModeChange("comparison")} sx={buttonSx(mode === "comparison")}>
              <CompareArrowsIcon sx={{ fontSize: "1.5rem" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      {/* Hydroclimate chooser */}
      <HydroclimateChooser
        layout="horizontal"
        size="small"
        showTitle={true}
        showLabels={false}
      />
    </>
  )
}
