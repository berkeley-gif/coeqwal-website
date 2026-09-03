"use client"

/**
 * useEquityOutcomeColumnSync - Tour-driven column highlight for the
 * equity tier grid.
 *
 * TierGrid draws its category columns imperatively with D3, so there is
 * no React element for a single column to anchor a tour step to.
 * While the tour is on the "outcomes by location" step, this hook tells
 * EquityPanel which category to draw a highlight rect around (see
 * TierGrid's `tourHighlightCategory` prop).
 */

import { useWorkspaceSlice } from "../../../../store"
import { OUTCOME_NAMES } from "../../../../../../../content/outcomes"
import { EQUITY_TOUR } from "./steps"

const OUTCOME_COLUMN_STEP_ID = "equity.step2.outcomeColumn"

export function useEquityOutcomeColumnSync(): string | undefined {
  const isOutcomeColumnStep = useWorkspaceSlice((s) => {
    if (s.tour.tool !== "equity") return false
    return EQUITY_TOUR[s.tour.step]?.id === OUTCOME_COLUMN_STEP_ID
  })
  return isOutcomeColumnStep ? OUTCOME_NAMES.CWS_DEL : undefined
}
