# Tool chrome

Shared layout and controls wrapping every explore tool.

```
UnifiedToolView
├── sidebar/     ScenarioSelectionSidebar, SearchAndChips (non-list modes)
├── toolbar/     ToolToolbar (hydroclimate, map toggle)
├── layout/      UnifiedToolView, ChartControlsBar, ToolJourneyStrip
├── overlays/    KeyboardShortcuts
├── nav/         ExploreSubNav (get-started vs tools)
├── actions/     SaveSnapshotButton, SimpleButton
├── chips/       ToggleChip, InlineToggleChip
└── utils/       hydroclimateBadgeDisplay
```

Tour subsystem (runner, anchors, per-tool modules): see
[`../tour/README.md`](../tour/README.md). `ToolJourneyStrip` mounts the
"Take the tour" button (`../tour/runner/TakeTheTourButton.tsx`,
re-exported from `../tour/index.ts`).

**Registering a new tool tab:** `nav/ExploreSubNav.tsx` (`FLOW`) and `layout/journey.ts` (`JOURNEY`, `EXPLORE_MODE_VIEW_NAME`). See [Developer guide](../../README.md#developer-guide-adding-a-new-visualization-tool).

Full tree: [feature README](../../README.md#runtime-component-tree).
