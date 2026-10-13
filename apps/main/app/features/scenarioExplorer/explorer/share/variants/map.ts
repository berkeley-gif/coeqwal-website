/**
 * Map variant handler. URL prefix `m`. A saved Explore map: the cropped map
 * image plus what it shows (outcomes, strategy, hydroclimate), a tier key,
 * and, for Distribution comparisons, the direction key. The image is never
 * URL-encoded, so a link restores the description with a note instead of
 * the image. No CSV export.
 */

import React from "react"
import ShareFigureCard from "../cards/ShareFigureCard"
import MapDirectionLegend from "../cards/MapDirectionLegend"
import { buildFigureTemplate } from "../figureTemplate"
import { shareFigureFooter } from "../figureFooter"
import { thumbnailAspectRatioFor } from "../thumbnailAspect"
import { mapFigureSpec } from "../../tools/chrome/layout/mapFigureSpec"
import type { ExploreMode } from "../../store/types"
import type { ShareItemOfType } from "../types"
import type { VariantHandler } from "../variants"
import { decodeMapToken, encodeMapToken, mapFilenameLabel } from "./mapToken"
import { getOutcomeName } from "../../../../../content/outcomes"
import {
  getScenarioShortLabel,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../../../content/scenarios"

type MapItem = ShareItemOfType<"map">

const mapHandler: VariantHandler<MapItem> = {
  type: "map",
  urlPrefix: "m", // "m"ap; unique across the registry
  rasterDimensionsKey: "map",

  renderCard(item, ctx) {
    const spec = mapFigureSpec({
      mode: item.tool as ExploreMode,
      outcomeNames: item.outcomeCodes.map(getOutcomeName),
      scenarioLabel: item.scenarioId
        ? (getScenarioShortLabel(item.scenarioId) ?? item.scenarioId)
        : null,
      hydroclimateLabel:
        HYDROCLIMATE_SHORT_LABELS[item.hydroclimate] ?? item.hydroclimate,
      comparedWithBaseline: item.comparedWithBaseline,
    }) ?? {
      toolLabel: "Map",
      chartKindLabel: "Map",
      values: {},
      legendHeading: "Tier",
    }
    return React.createElement(ShareFigureCard, {
      id: item.id,
      template: buildFigureTemplate(spec),
      cachedImageDataUrl: item.cachedImageDataUrl,
      thumbnailAspectRatio: thumbnailAspectRatioFor(item),
      showTierLegend: true,
      extraLegend: item.comparedWithBaseline
        ? React.createElement(MapDirectionLegend)
        : undefined,
      figureFooter: shareFigureFooter(item),
      emptyImageText:
        "The map image is not stored in share links. Show this outcome on the Explore map to redraw it.",
      note: item.note,
      onNoteChange: ctx.onNoteChange,
      onRemove: ctx.onRemove,
    })
  },

  encodeUrlToken: encodeMapToken,

  decodeUrlToken(parts) {
    const fields = decodeMapToken(parts)
    return fields ? { id: crypto.randomUUID(), type: "map", ...fields } : null
  },

  filenameLabel: mapFilenameLabel,
}

export default mapHandler
