# Tool chrome

Shared layout and controls wrapping every explore tool.

```
UnifiedToolView
├── sidebar/     ScenarioSelectionSidebar, SearchAndChips (non-list modes)
├── toolbar/     ToolToolbar (hydroclimate, map toggle)
├── layout/      UnifiedToolView, ChartControlsBar, ToolJourneyStrip
├── overlays/    ToolTour, KeyboardShortcuts
├── nav/         ExploreSubNav (get-started vs tools)
├── actions/     SaveSnapshotButton, SimpleButton
├── tour/        RadarTourAnchor
├── chips/       ToggleChip, InlineToggleChip
└── utils/       hydroclimateBadgeDisplay
```

Tour anchor registry: `../tour/TourAnchorContext.tsx`. Tour runner: `overlays/ToolTour.tsx`.

**Registering a new tool tab:** `nav/ExploreSubNav.tsx` (`FLOW`) and `layout/journey.ts` (`JOURNEY`, `EXPLORE_MODE_VIEW_NAME`). See [Developer guide](../../README.md#developer-guide-adding-a-new-visualization-tool).

Full tree: [feature README](../../README.md#runtime-component-tree).
