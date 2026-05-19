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

Full tree: [feature README](../../README.md#runtime-component-tree).
