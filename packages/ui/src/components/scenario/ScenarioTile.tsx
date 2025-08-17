"use client"

import React from "react"
import { Box, Typography } from "@repo/ui/mui"
import { ScenarioGlyph } from "@repo/viz"
import { useGlyphSettingsStore } from "@repo/ui"
import type { VerticalParallelLineData } from "@repo/viz"

export interface ScenarioTileProps {
  scenario: VerticalParallelLineData
  size?: number // glyph size
  onHover?: (id: string | null) => void
  onSelect?: (id: string) => void
}

const OUTCOME_ORDER = [
  "Community deliveries",
  "Agricultural deliveries",
  "Environmental deliveries",
  "Reservoir storage",
  "Groundwater storage",
  "Delta salinity",
  "Salmon abundance",
  "Distributional equity",
] as const

const ScenarioTile: React.FC<ScenarioTileProps> = ({
  scenario,
  size = 50,
  onHover,
  onSelect,
}) => {
  const variant = useGlyphSettingsStore((s: any)=>s.variant)

  return (
    <Box
      onMouseEnter={() => onHover?.(scenario.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onSelect?.(scenario.id)}
      sx={{
        cursor: "pointer",
        p: 1.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: (theme) => theme.palette.grey[200],
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          borderColor: (theme) => theme.palette.blue.medium,
        },
        width: 180,
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      {/* Glyph grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0.5,
        }}
      >
        {OUTCOME_ORDER.map((outcome) => (
          <ScenarioGlyph
            key={outcome}
            size={size}
            variant={variant}
            values={[0.2,0.4,0.6,0.8]}
          />
        ))}
      </Box>

      {/* Scenario name */}
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          textAlign: "center",
          fontWeight: 500,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={scenario.name}
      >
        {scenario.name}
      </Typography>
    </Box>
  )
}

export default React.memo(ScenarioTile)
