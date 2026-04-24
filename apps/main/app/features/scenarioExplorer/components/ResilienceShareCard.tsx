"use client"

import React, { useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { ShareItem } from "../store"
import ShareSnapshotCard from "./ShareSnapshotCard"
import ShareResilienceLiveChart from "./ShareResilienceLiveChart"
import {
  getResilienceShareCardContent,
  type ResilienceShareCardLookups,
} from "../utils/getResilienceShareCardContent"
import {
  OUTCOME_NAMES,
  type OutcomeCode,
} from "../../../content/outcomes"
import { HYDROCLIMATE_SHORT_LABELS } from "../../../content/scenarios"

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
      scenarioLookup.get(id)?.shortLabel ??
      scenarioLookup.get(id)?.name ??
      id,
    outcomeLabel: (code) =>
      OUTCOME_NAMES[code as OutcomeCode] ?? code,
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
  const lookups = useMemo(
    () => buildLookups(scenarioLookup),
    [scenarioLookup],
  )

  const model = useMemo(
    () => getResilienceShareCardContent(item, lookups),
    [item, lookups],
  )

  const liveChart =
    model.showLiveAggregateFallback ? (
      <Box>
        <ShareResilienceLiveChart
          scenarioIds={item.scenarioIds}
          outcomeCodes={item.outcomeCodes}
          hydroclimates={item.hydroclimates}
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

  return (
    <ShareSnapshotCard
      id={item.id}
      toolLabel="Resilience"
      title={model.headline}
      subtitle={model.subtitle}
      chips={model.chips}
      cachedImageDataUrl={item.cachedImageDataUrl}
      liveChart={liveChart}
      note={item.note}
      onNoteChange={onNoteChange}
      onRemove={onRemove}
    />
  )
}
