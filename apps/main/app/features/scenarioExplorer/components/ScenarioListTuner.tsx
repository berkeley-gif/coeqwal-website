"use client"

/**
 * ScenarioListTuner - the "TUNE SCENARIO LIST" entry point for the
 * scenario-selection sidebar. First pass: exposes the existing visibility
 * chips (definitions, baselines, key operations, selected only, group by
 * theme) in the generic `ChartTuner` shell's controls slot, with empty
 * walkthrough/presets.
 *
 * Presets and walkthrough copy will be added in a follow-up - the key
 * architectural goal of this first pass is to get the entry point in
 * place next to the sidebar search bar so the rest can be iterated on.
 */

import { Box } from "@repo/ui/mui"
import { ChartTuner } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"
import ToggleChip from "./ToggleChip"

export default function ScenarioListTuner() {
  const {
    showDefinitions,
    setShowDefinitions,
    showAlternativeBaselines,
    setShowAlternativeBaselines,
    showKeyOperations,
    setShowKeyOperations,
    showOnlyChosen,
    setShowOnlyChosen,
    groupByTheme,
    setGroupByTheme,
  } = useScenarioExplorerStore()

  const controls = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        flexWrap: "wrap",
      }}
    >
      <ToggleChip
        label="definitions"
        active={showDefinitions}
        onClick={() => setShowDefinitions(!showDefinitions)}
      />
      <ToggleChip
        label="baselines"
        active={showAlternativeBaselines}
        onClick={() => setShowAlternativeBaselines(!showAlternativeBaselines)}
      />
      <ToggleChip
        label="key operations"
        active={showKeyOperations}
        onClick={() => setShowKeyOperations(!showKeyOperations)}
      />
      <ToggleChip
        label="selected only"
        active={showOnlyChosen}
        onClick={() => setShowOnlyChosen(!showOnlyChosen)}
      />
      <ToggleChip
        label="group by theme"
        active={groupByTheme}
        onClick={() => setGroupByTheme(!groupByTheme)}
      />
    </Box>
  )

  return (
    <ChartTuner
      triggerLabel="TUNE SCENARIO LIST"
      description="Guided tour and preset views for the scenario library coming soon. For now, tweak what the list surfaces below."
      controls={controls}
    />
  )
}
