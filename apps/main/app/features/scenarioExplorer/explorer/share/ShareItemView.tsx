"use client"

/**
 * ShareItemView
 *
 * Single dispatcher that hands a ShareItem to its variant handler in
 * {@link VARIANT_REGISTRY}. Every per-variant rendering decision (card
 * choice, live-fallback wiring, scenario-name resolution) lives in
 * the handler, so this file stays exhaustive by construction: a new
 * `ShareItem["type"]` arm without a registry entry is a compile error
 * in `share/variants.ts`, not a silent `return null` here.
 */

import React from "react"
import { useTheme } from "@repo/ui/mui"
import type { ShareItem } from "../store"
import type {
  ShareRadarHydroKey,
  ShareRadarLiveDataFields,
} from "./utils/shareRadarLiveData"
import {
  handlerForItem,
  type RenderContext,
  type ShareItemScenarioInfo,
} from "./variants"

export type { ShareItemScenarioInfo } from "./variants"

export interface ShareItemViewProps {
  item: ShareItem
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<string, ShareItemScenarioInfo>
  allChartData: Record<string, Record<string, unknown> | undefined>
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>
  onNoteChange?: (id: string, note: string) => void
  onRemove?: (id: string) => void
}

export default function ShareItemView({
  item,
  outcomeNames,
  scenarioLookup,
  allChartData,
  radarLiveByHydro,
  onNoteChange,
  onRemove,
}: ShareItemViewProps): React.ReactNode {
  const theme = useTheme()
  const noteHandler = onNoteChange
    ? (note: string) => onNoteChange(item.id, note)
    : undefined

  const ctx: RenderContext = {
    outcomeNames,
    scenarioLookup,
    allChartData,
    radarLiveByHydro,
    theme,
    onNoteChange: noteHandler,
    onRemove,
  }

  const handler = handlerForItem(item)
  return handler.renderCard(item, ctx)
}
