# Resilience tool

Heatmap panel + sentence controls.

| Piece | Role |
| ----- | ---- |
| `ResiliencePanel.tsx` | Heatmap rendering and interactions |
| `ResilienceChartControls.tsx` | Toolbar control row |
| `ResilienceControls.tsx` | Sentence control UI |
| `controls/` | read → plan → write (`readSnapshot`, `planPivotChange`, `writeChange`) |
| `useResilienceControlsWriter.ts` | Controls facade for `ResilienceControls` |
| `hooks/useResilienceShareCapture.ts` | Share capture wiring |

**Store:** flat `resilience*` fields via `useResilienceSlice()`. Imperative batch writes use `applyResilienceControlsPatch` through `writeChange.ts`.

**Target split:** panel orchestration vs `heatmap/` render modules (see feature backlog).

Full resilience write model: [feature README](../../../README.md#resilience-controls-write-model).
