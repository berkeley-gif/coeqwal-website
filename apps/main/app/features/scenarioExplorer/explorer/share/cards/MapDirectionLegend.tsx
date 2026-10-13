"use client"

/**
 * MapDirectionLegend - key for Distribution's comparison markers: triangle
 * up (improved from current operations), square (no change), triangle down
 * (worsened). Shapes come from the shared marker-shape rule so the key and
 * the markers cannot drift apart.
 */

import { Box, useTheme } from "@repo/ui/mui"
import {
  getPointMarkerShape,
  SQUARE_MARKER_RADIUS_PX,
  type ComparisonDirection,
} from "../../../../map/config/markerShape"

const ROWS: { direction: ComparisonDirection; label: string }[] = [
  { direction: "improved", label: "Improved from baseline" },
  { direction: "unchanged", label: "No change" },
  { direction: "worsened", label: "Worsened from baseline" },
]

export default function MapDirectionLegend() {
  const theme = useTheme()
  return (
    <Box
      role="group"
      aria-label="Comparison marker legend"
      sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
    >
      {ROWS.map(({ direction, label }) => {
        const shape = getPointMarkerShape(direction)
        return (
          <Box
            key={direction}
            sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
          >
            {shape === "square" ? (
              <Box
                data-legend-shape="square"
                sx={{
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                  borderRadius: `${SQUARE_MARKER_RADIUS_PX}px`,
                  backgroundColor: "#999",
                  border: "1px solid #fff",
                }}
              />
            ) : (
              <svg
                data-legend-shape={shape}
                width="14"
                height="14"
                viewBox="0 0 14 14"
                style={{ flexShrink: 0 }}
              >
                <polygon
                  points={
                    shape === "triangleUp" ? "7,2 2,12 12,12" : "7,12 2,2 12,2"
                  }
                  fill="#999"
                  stroke="#fff"
                  strokeWidth="1"
                />
              </svg>
            )}
            <Box
              component="span"
              sx={{ fontSize: "0.75rem", color: theme.palette.text.primary }}
            >
              {label}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
