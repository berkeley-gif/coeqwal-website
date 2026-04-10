"use client"

import React from "react"
import { Box, Typography, IconButton, useTheme, icons } from "@repo/ui/mui"
import { OutcomeGlyphItem } from "../../scenarios/components/shared/OutcomeGlyphItem"
import { MorphableDistributionGlyph, SQUARE_SIZE, SQUARE_GAP } from "@repo/viz"
import {
  isSingleValueTier,
  type ChartDataPoint,
} from "../../scenarios/components/shared/types"
import { getSingleValueLocationCount } from "../../../content/outcomes"

interface ShareScenarioCardProps {
  scenarioId: string
  name: string
  description: string
  chartData?: Record<string, ChartDataPoint[]>
  outcomeNames: { shortCode: string; displayName: string }[]
  onRemove?: (id: string) => void
  viewMode?: "summary" | "distribution"
}

export default function ShareScenarioCard({
  scenarioId,
  name,
  description,
  chartData,
  outcomeNames,
  onRemove,
  viewMode,
}: ShareScenarioCardProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.borderRadius.sm ?? "6px",
        backgroundColor: theme.palette.background.paper,
        p: 1.5,
        mb: 1,
      }}
    >
      {/* Remove button */}
      {onRemove && (
        <IconButton
          size="small"
          onClick={() => onRemove(scenarioId)}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            p: 0.25,
            color: theme.palette.grey[400],
            "&:hover": { color: theme.palette.grey[700] },
          }}
        >
          <icons.Close sx={{ fontSize: "0.875rem" }} />
        </IconButton>
      )}

      {/* Scenario full title */}
      <Typography
        sx={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
          pr: onRemove ? 2.5 : 0,
        }}
      >
        {name}
      </Typography>

      {/* Chart type */}
      {description && (
        <Typography
          sx={{
            fontSize: "0.6875rem",
            fontWeight: 400,
            lineHeight: 1.3,
            color: theme.palette.grey[700],
            mt: 0.25,
          }}
        >
          {description}
        </Typography>
      )}

      {/* Outcome glyphs */}
      {chartData &&
        outcomeNames.length > 0 &&
        (viewMode === "distribution" ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              rowGap: 1.5,
              columnGap: 1,
              mt: 1,
              justifyItems: "center",
              alignItems: "start",
            }}
          >
            {outcomeNames.map(({ shortCode, displayName }) => {
              const data = chartData[shortCode]
              if (!data || data.length === 0) return null

              const values = data.map((t) => t.value).slice(0, 4) as [
                number,
                number,
                number,
                number,
              ]
              const tierColors = data.map((t) => t.color).slice(0, 4) as [
                string,
                string,
                string,
                string,
              ]
              const locationCounts = data.every((t) => t.rawCount != null)
                ? (data.map((t) => t.rawCount!).slice(0, 4) as [
                    number,
                    number,
                    number,
                    number,
                  ])
                : undefined
              const singleValue = isSingleValueTier(data)

              return (
                <Box
                  key={shortCode}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {singleValue ? (
                    (() => {
                      const activeTier = data.find((t) => t.value > 0)
                      const color = activeTier?.color ?? theme.palette.grey[400]
                      const count = getSingleValueLocationCount(shortCode)
                      const cell = SQUARE_SIZE + SQUARE_GAP
                      const w = count * cell - SQUARE_GAP
                      return (
                        <svg width={w} height={SQUARE_SIZE}>
                          {Array.from({ length: count }, (_, i) => (
                            <rect
                              key={i}
                              x={i * cell}
                              y={0}
                              width={SQUARE_SIZE}
                              height={SQUARE_SIZE}
                              rx={2}
                              fill={color}
                              stroke={color}
                              strokeWidth={0.5}
                              strokeOpacity={0.4}
                            />
                          ))}
                        </svg>
                      )
                    })()
                  ) : (
                    <MorphableDistributionGlyph
                      values={values}
                      tierColors={tierColors}
                      mode="distribution"
                      locationCounts={locationCounts}
                    />
                  )}
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      sx={{
                        fontSize: "0.5625rem",
                        lineHeight: 1.2,
                        color: theme.palette.grey[700],
                      }}
                    >
                      {displayName}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.5rem",
                        lineHeight: 1.3,
                        color: theme.palette.grey[500],
                      }}
                    >
                      {(() => {
                        const total = singleValue
                          ? getSingleValueLocationCount(shortCode)
                          : locationCounts
                            ? locationCounts.reduce((a, b) => a + b, 0)
                            : 0
                        return total > 0
                          ? `${total} location${total !== 1 ? "s" : ""}`
                          : ""
                      })()}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
              rowGap: 1,
              columnGap: 0.5,
              mt: 1,
              justifyItems: "center",
              alignItems: "start",
            }}
          >
            {outcomeNames.map(({ shortCode, displayName }) => {
              const data = chartData[shortCode]
              return (
                <OutcomeGlyphItem
                  key={shortCode}
                  displayName={displayName}
                  name={shortCode}
                  chartData={data}
                  isActive={!!data && data.length > 0}
                  size={36}
                  showLabel
                  showInfoButton={false}
                  showSortButton={false}
                />
              )
            })}
          </Box>
        ))}
    </Box>
  )
}
