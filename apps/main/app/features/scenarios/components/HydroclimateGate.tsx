"use client"

/**
 * Conditional renderer for a single sibling-group panel or row
 *
 * Renders `children` when the active hydroclimate has a variant for
 * `scenarioId`. When the variant is missing, renders a
 * `HydroclimateUnavailablePlaceholder` instead.
 *
 * Use this anywhere a single sibling-group id drives a panel or row
 * (key outcomes panel, equity panel, list rows, sidebar rows). The gate
 * owns the missing-variant check so tier tools never repeat the
 * `useResolvedIdMapping` -> `missingScenarioIds.includes(...)` pattern.
 *
 * For multi-scenario plots (radar, comparison, resilience matrix) use
 * `useHydroclimateAvailability` instead, which splits ids into
 * available and missing so each tool can fan out as it sees fit.
 *
 * @example
 * ```tsx
 * <HydroclimateGate scenarioId={scenarioId} variant="block">
 *   <KeyOutcomesGrid />
 * </HydroclimateGate>
 * ```
 */

import React from "react"
import { useResolvedIdMapping } from "../hooks/useResolvedIdMapping"
import {
  HydroclimateUnavailablePlaceholder,
  type HydroclimateUnavailableVariant,
} from "./HydroclimateUnavailablePlaceholder"

export interface HydroclimateGateProps {
  /** Sibling-group id (e.g. `"s0020"`) to check against the active hydroclimate */
  scenarioId: string
  /** Placeholder shape when the variant is missing, defaults to `inline` */
  variant?: HydroclimateUnavailableVariant
  /** Rendered when a variant exists for `scenarioId` */
  children: React.ReactNode
}

export function HydroclimateGate({
  scenarioId,
  variant = "inline",
  children,
}: HydroclimateGateProps) {
  const { missingScenarioIds, hydroclimate } = useResolvedIdMapping()
  if (missingScenarioIds.includes(scenarioId)) {
    return (
      <HydroclimateUnavailablePlaceholder
        hydroclimate={hydroclimate}
        groupId={scenarioId}
        variant={variant}
      />
    )
  }
  return <>{children}</>
}

export default HydroclimateGate
