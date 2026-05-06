"use client"

import React, { useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { ShareItem } from "../../store"
import ShareSnapshotCard from "./ShareSnapshotCard"
import ShareResilienceLiveChart from "../live/ShareResilienceLiveChart"
import {
  getResilienceShareCardContent,
  type ResilienceShareCardLookups,
} from "../utils/getResilienceShareCardContent"
import { OUTCOME_NAMES, type OutcomeCode } from "../../../../content/outcomes"
import { HYDROCLIMATE_SHORT_LABELS } from "../../../../content/scenarios"

type ResilienceItem = Extract<ShareItem, { type: "resilience" }>

export interface ResilienceShareCardProps {
  item: ResilienceItem
  scenarioLookup: Map<
    string,
    {
      name: string
      description: string
      definition: string
      shortLabel: string
    }
  >
  onNoteChange?: (note: string) => void
  onRemove?: (id: string) => void
}

function buildLookups(
  scenarioLookup: ResilienceShareCardProps["scenarioLookup"],
): ResilienceShareCardLookups {
  return {
    scenarioLabel: (id) =>
      scenarioLookup.get(id)?.shortLabel ?? scenarioLookup.get(id)?.name ?? id,
    scenarioDefinition: (id) => scenarioLookup.get(id)?.definition,
    outcomeLabel: (code) => OUTCOME_NAMES[code as OutcomeCode] ?? code,
    hydroShortLabel: (hc) => HYDROCLIMATE_SHORT_LABELS[hc] ?? hc,
  }
}

export default function ResilienceShareCard({
  item,
  scenarioLookup,
  onNoteChange,
  onRemove,
}: ResilienceShareCardProps) {
  const theme = useTheme()
  const lookups = useMemo(() => buildLookups(scenarioLookup), [scenarioLookup])

  const model = useMemo(
    () => getResilienceShareCardContent(item, lookups),
    [item, lookups],
  )

  const liveChart = model.showLiveAggregateFallback ? (
    <Box>
      <ShareResilienceLiveChart
        scenarioIds={item.scenarioIds}
        outcomeCodes={item.outcomeCodes}
        hydroclimates={item.hydroclimates}
        showCellNumbers={item.showCellNumbers === true}
      />
      {model.showThumbnailDisclaimer && model.thumbnailDisclaimer ? (
        <Typography
          variant="caption"
          component="p"
          sx={{
            mt: 0.75,
            color: theme.palette.text.secondary,
            lineHeight: 1.35,
          }}
        >
          {model.thumbnailDisclaimer}
        </Typography>
      ) : null}
    </Box>
  ) : undefined

  // The panel-scope capture embeds a tier legend into its SVG: the
  // small-multiples wrapper paints a shared bottom-of-grid legend, and
  // the aggregate heatmap renders its own internal legend (the panel
  // path does not pass `hideLegend`). Every other capture path
  // explicitly hides the chart-internal legend (single-tile and
  // scenario-solo set `hideLegend: true`) or has none at all (the
  // quadrant scatter), so those cards must mount the shared card
  // legend to stay decodable on their own.
  const showTierLegend = item.tileScope !== "panel"

  return (
    <ShareSnapshotCard
      id={item.id}
      toolLabel="Resilience"
      title={model.headline}
      scenarioDefinition={model.scenarioDefinition}
      subtitle={model.subtitle}
      chips={model.chips}
      cachedSvg={item.cachedSvg}
      cachedImageDataUrl={item.cachedImageDataUrl}
      liveChart={liveChart}
      showTierLegend={showTierLegend}
      note={item.note}
      onNoteChange={onNoteChange}
      onRemove={onRemove}
    />
  )
}
