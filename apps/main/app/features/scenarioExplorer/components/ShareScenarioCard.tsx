"use client"

import React from "react"
import { Box, Typography, IconButton, useTheme, icons } from "@repo/ui/mui"
import { OutcomeGlyphItem } from "../../scenarios/components/shared/OutcomeGlyphItem"
import { TierSummaryCell } from "../../scenarios/components/shared/TierSummaryCell"
import { MorphableDistributionGlyph, SQUARE_SIZE, SQUARE_GAP } from "@repo/viz"
import {
  isSingleValueTier,
  type ChartDataPoint,
} from "../../scenarios/components/shared/types"
import { getSingleValueLocationCount } from "../../../content/outcomes"
import type { OutcomeDisplayMode } from "../store"
import {
  hydroclimateOptions,
  type HydroclimateOption,
} from "../../../content/scenarios"
import { HYDROCLIMATE_CONFIG } from "../../scenarios/components/HydroclimateChooser"

interface ShareScenarioCardProps {
  scenarioId: string
  name: string
  scenarioDefinition?: string
  description: string
  hydroclimate?: string
  chartData?: Record<string, ChartDataPoint[]>
  outcomeNames: { shortCode: string; displayName: string }[]
  onRemove?: (id: string) => void
  viewMode?: OutcomeDisplayMode
}

export default function ShareScenarioCard({
  scenarioId,
  name,
  scenarioDefinition,
  description,
  hydroclimate,
  chartData,
  outcomeNames,
  onRemove,
  viewMode,
}: ShareScenarioCardProps) {
  const theme = useTheme()

  const climateOption: HydroclimateOption | undefined = hydroclimate
    ? hydroclimateOptions.find((o) => o.value === hydroclimate)
    : undefined
  const climateConfig = hydroclimate
    ? HYDROCLIMATE_CONFIG[hydroclimate]
    : undefined

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

      {/* Scenario title */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
          pr: onRemove ? 2.5 : 0,
        }}
      >
        {name}
      </Typography>

      {/* Scenario definition */}
      {scenarioDefinition && (
        <Typography
          sx={{
            fontSize: "0.6875rem",
            lineHeight: 1.4,
            color: theme.palette.grey[600],
            mt: 0.25,
            pr: onRemove ? 2.5 : 0,
          }}
        >
          {scenarioDefinition}
        </Typography>
      )}

      {/* Hydroclimate + chart type metadata */}
      <Box sx={{ mt: 0.75 }}>
        {climateOption && climateConfig && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "flex-start",
              gap: 0.5,
              backgroundColor: `${climateConfig.bgColor}0F`,
              border: `1px solid ${climateConfig.bgColor}28`,
              borderRadius: "4px",
              px: 0.75,
              py: 0.375,
              mb: 0.5,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: climateConfig.bgColor,
                flexShrink: 0,
                mt: "3px",
              }}
            />
            <Box>
              <Typography
                sx={{
                  fontSize: "0.625rem",
                  lineHeight: 1.3,
                  fontWeight: 600,
                  color: theme.palette.grey[800],
                }}
              >
                {climateOption.label} hydroclimate
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.5625rem",
                  lineHeight: 1.3,
                  color: theme.palette.grey[600],
                }}
              >
                {climateOption.description}
              </Typography>
            </Box>
          </Box>
        )}
        {description && (
          <Typography
            sx={{
              fontSize: "0.6875rem",
              lineHeight: 1.3,
              color: theme.palette.grey[500],
              display: "block",
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {/* Outcome glyphs */}
      {chartData &&
        outcomeNames.length > 0 &&
        (viewMode === "distribution" ? (
          (() => {
            const ROW1_CODES = new Set([
              "CWS_DEL",
              "AG_REV",
              "ENV_FLOWS",
              "RES_STOR",
              "GW_STOR",
            ])
            const row1: { shortCode: string; displayName: string }[] = []
            const row2: { shortCode: string; displayName: string }[] = []
            for (const o of outcomeNames) {
              const data = chartData[o.shortCode]
              if (!data || data.length === 0) continue
              if (ROW1_CODES.has(o.shortCode)) {
                row1.push(o)
              } else {
                row2.push(o)
              }
            }

            const renderOutcome = (shortCode: string, displayName: string) => {
              const data = chartData[shortCode]!
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
            }

            return (
              <Box sx={{ mt: 1 }}>
                {/* Row 1: Community deliveries, Ag revenue, Env flows, Reservoir storage, GW storage */}
                {row1.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.5,
                      justifyContent: "center",
                      alignItems: "start",
                    }}
                  >
                    {row1.map(({ shortCode, displayName }) =>
                      renderOutcome(shortCode, displayName),
                    )}
                  </Box>
                )}

                {/* Row 2: Delta ecology, FW for exports, FW for in-Delta, Winter-run salmon */}
                {row2.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.5,
                      justifyContent: "center",
                      alignItems: "start",
                      mt: row1.length > 0 ? 1.5 : 0,
                    }}
                  >
                    {row2.map(({ shortCode, displayName }) =>
                      renderOutcome(shortCode, displayName),
                    )}
                  </Box>
                )}
              </Box>
            )
          })()
        ) : viewMode === "average" ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))",
              rowGap: 1,
              columnGap: 0.75,
              mt: 1,
              alignItems: "start",
            }}
          >
            {outcomeNames.map(({ shortCode, displayName }) => {
              const data = chartData[shortCode]
              return (
                <Box
                  key={shortCode}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: 0.375,
                  }}
                >
                  <TierSummaryCell
                    chartData={data}
                    isActive={!!data && data.length > 0}
                    mode="numeric"
                  />
                  <Typography
                    sx={{
                      fontSize: "0.5625rem",
                      lineHeight: 1.2,
                      color: theme.palette.grey[700],
                      textAlign: "center",
                    }}
                  >
                    {displayName}
                  </Typography>
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
