"use client"

/**
 * Off-screen capture for the Distribution (equity) panel. Mounts
 * `TierGridSnapshot` inside `OffscreenCaptureHost` with the requested
 * scenario's data resolved by `useEquityObjectives` (no dependency on
 * the live panel's focus state, so the share row can capture any
 * scenario without mutating the user's selection).
 *
 * Capture size is 900x600 (the live distribution panel's typical
 * aspect). Adjust `EQUITY_CAPTURE_*` if a different output is needed;
 * downstream raster size in Share.tsx is keyed off the same constants.
 *
 * Returns the resolved tier objectives alongside the SVG and PNG so
 * the share item can persist `cachedChartData` for the data-download
 * button without having to re-resolve the same SWR queries when the
 * card is rendered.
 */

import React, { useEffect } from "react"
import { TierGridSnapshot } from "@repo/viz"
import type { TierGridProps } from "@repo/viz"
import { type Theme } from "@repo/ui/mui"
import { offscreenCapture } from "../../../share/capture/OffscreenCaptureHost"
import { CAPTURE_DIMENSIONS } from "../../../share/capture/dimensions"
import { useEquityObjectives } from "./useEquityObjectives"

export const EQUITY_CAPTURE_WIDTH = CAPTURE_DIMENSIONS.equity.width
export const EQUITY_CAPTURE_HEIGHT = CAPTURE_DIMENSIONS.equity.height

const TIERS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"]

export interface CaptureEquityOffscreenInput {
  scenarioId: string
  compareToBaseline: boolean
  theme: Theme
  width?: number
  height?: number
}

/**
 * Distribution chart-data shape persisted on the equity ShareItem.
 * `kind: "equity"` is the discriminator the CSV exporter uses to pick
 * the equity branch.
 */
export interface EquityChartData {
  kind: "equity"
  scenarioId: string
  compareToBaseline: boolean
  categories: string[]
  objectives: TierGridProps["objectives"]
}

export interface CaptureEquityOffscreenResult {
  svg: string
  dataUrl: string
  chartData?: EquityChartData
}

interface EquityCaptureMountProps {
  scenarioId: string
  compareToBaseline: boolean
  width: number
  height: number
  onReady: () => void
  onChartData: (data: EquityChartData) => void
}

/**
 * Hook-using component the capture host renders. Resolves the
 * scenario's tier-location data via SWR (warm cache hits when the
 * live panel has already loaded the same scenario) and mounts
 * TierGridSnapshot once data is ready. `onReady` is forwarded only
 * after TierGrid's first paint commits so the host serializes a
 * fully drawn SVG. `onChartData` reports the resolved objectives so
 * the caller can persist them on the share item.
 */
function EquityCaptureMount({
  scenarioId,
  compareToBaseline,
  width,
  height,
  onReady,
  onChartData,
}: EquityCaptureMountProps) {
  const { objectives, categories, ready } = useEquityObjectives({
    scenarioId,
    compareToBaseline,
  })

  useEffect(() => {
    if (!ready || objectives.length === 0) return
    onChartData({
      kind: "equity",
      scenarioId,
      compareToBaseline,
      categories,
      objectives,
    })
  }, [
    ready,
    objectives,
    categories,
    scenarioId,
    compareToBaseline,
    onChartData,
  ])

  if (!ready || objectives.length === 0) return null

  return (
    <TierGridSnapshot
      objectives={objectives}
      categories={categories}
      tiers={TIERS}
      colorMode="tier"
      showComparison={compareToBaseline}
      showMapView={false}
      responsive={false}
      width={width}
      height={height}
      onReady={onReady}
    />
  )
}

export async function captureEquityOffscreen(
  input: CaptureEquityOffscreenInput,
): Promise<CaptureEquityOffscreenResult> {
  const width = input.width ?? EQUITY_CAPTURE_WIDTH
  const height = input.height ?? EQUITY_CAPTURE_HEIGHT

  let chartData: EquityChartData | undefined

  const { svg, dataUrl } = await offscreenCapture({
    theme: input.theme,
    width,
    height,
    captureKind: "equity:offscreen",
    render: (onReady) => (
      <EquityCaptureMount
        scenarioId={input.scenarioId}
        compareToBaseline={input.compareToBaseline}
        width={width}
        height={height}
        onReady={onReady}
        onChartData={(data) => {
          chartData = data
        }}
      />
    ),
  })

  return { svg, dataUrl, chartData }
}
