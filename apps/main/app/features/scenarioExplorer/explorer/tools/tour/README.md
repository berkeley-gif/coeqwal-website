# Tour subsystem

Per-tool anchored Popper tours that walk a first-time user through the
controls of an Explore tool. The subsystem is composed of:

- A shared **runner** that knows nothing about any specific tool.
- A shared **anchor registry** that lets any component expose a DOM
  element by string id.
- A per-tool **`TourModule`** that bundles that tool's ordered steps,
  optional demo effects, and optional inline illustrations.
- A two-file **registry** (`registry.ts` + `toolToTourMap.ts`) that
  names the tour-enabled tools and assembles their modules.

Adding a tour for a new tool is one new folder under
`panels/<tool>/tour/` plus one line each in `registry.ts` and
`toolToTourMap.ts`. The "Take the tour" button, the workspace store's
`TourTool` type, the tab-switch reset, and the sessionStorage round-trip
all extend automatically.

## Directory layout

```
explorer/
├── store/
│   ├── workspaceStoreSlice.ts          tour state lives in this slice
│   └── exploreSessionPersist.ts        validateTour() uses hasTourFor()
└── tools/
    ├── tour/                           shared subsystem
    │   ├── README.md                   this file
    │   ├── index.ts                    public barrel
    │   ├── types.ts                    TourStep, TourPlacement, TourModule,
    │   │                               TourEffectsProps, AnchorResolver
    │   ├── registry.ts                 TOUR_TOOLS, TourTool, hasTourFor
    │   │                               (no React; safe for the store)
    │   ├── toolToTourMap.ts            TOUR_MODULES: Record<TourTool, TourModule>
    │   │                                (React-bearing; runtime UI only)
    │   ├── anchors/
    │   │   ├── TourAnchorContext.tsx   provider, useTourAnchor,
    │   │   │                           useTourAnchorResolver
    │   │   └── InlineTourAnchor.tsx    inline-flex wrapper
    │   ├── runner/
    │   │   ├── ToolTour.tsx            runner: resolves anchor, mounts
    │   │   │                           card + scrim + HighlightRing
    │   │   ├── TourCard.tsx            render-only popper card
    │   │   ├── TourBodyContent.tsx     {{infoIcon}} placeholder support
    │   │   ├── HighlightRing.tsx       portal ring tracking anchor rect
    │   │   └── TakeTheTourButton.tsx   starts the tour for the active tool
    │   └── reusableContent/
    │       └── TourTierLegend.tsx      tier swatch legend reused across
    │                                   tour illustrations
    └── panels/
        ├── list/
        │   └── tour/                   list's TourModule
        │       ├── index.ts            default ListTourModule
        │       ├── steps.ts            LIST_TOUR
        │       ├── ListTourEffects.tsx demo effects (operations, map)
        │       ├── useListInfoTooltipSync.ts
        │       │                       drives StrategyGrid's local
        │       │                       tooltip from the info step
        │       └── illustrations/
        │           ├── index.tsx       Record<string, () => ReactNode>
        │           ├── BarIllustration.tsx
        │           ├── MapLegend.tsx
        │           └── ControlIllustration.tsx
        └── radar/
            └── tour/                   radar's TourModule
                ├── index.ts            default RadarTourModule
                ├── steps.ts            RADAR_TOUR
                ├── RadarTourEffects.tsx demo effects (axis chooser,
                │                       highlight baseline, range)
                ├── useRadarInfoIconSync.ts
                │                       drives RadarPanel's local
                │                       openInfoAxis from the info step
                └── RadarTourAnchor.tsx inline-flex wrapper used by
                                        the radar chart controls
```

## Runtime flow

1. **State.** `workspaceStoreSlice` owns
   `tour: { tool: TourTool | null; step: number }`. Setters:
   `startToolTour(tool)`, `endTour()`, `setTourStep(n)`. The slice
   imports `TourTool` from `tour/registry`, which has no React, so the
   store load tree stays hook-free.
2. **Entry.** `runner/TakeTheTourButton` checks `hasTourFor(exploreMode)`
   from `tour/registry`. It renders nothing for tools without a tour, so
   the same button can sit unconditionally in the journey strip.
3. **Module lookup.** When `tour.tool` is set, `runner/ToolTour` picks
   `TOUR_MODULES[tour.tool]` from `tour/toolToTourMap.ts` and resolves
   the current step from `module.steps[tour.step]`.
4. **Anchor resolve.** If the step has `anchorId`, the runner asks the
   `TourAnchorProvider` registry for the matching DOM element via
   `useTourAnchorResolver`. The registry watches the DOM through a
   subscribe callback so a target that mounts after the runner is still
   found on the next paint. After a short grace period without a match,
   the runner falls back to a centered card.
5. **Card + ring + scrim.** The runner renders a `TourCard` either
   inside a `Popper` (anchored) or fixed near the bottom center
   (bookend / fallback), a `HighlightRing` portal that tracks the
   anchor rect each frame, and a translucent scrim with
   `pointer-events: none` so the user can still click anchored
   controls.
6. **Demo effects.** If the active module has an `EffectsComponent`,
   the runner mounts it as a sibling and keys it by `tourTool`. The
   `key` guarantees a fresh mount per tool, so each module's hooks
   order is isolated. The component receives the active `step`, the
   anchor `resolve` callback, and a `version` counter that bumps when
   the anchor registry changes.
7. **Illustrations.** If the active step has an `illustration` string,
   the runner calls `module.illustrations?.[step.illustration]?.()` and
   inlines the result above the body copy. The runner does not import
   anything from `panels/`.

## Conventions

### Step ids

`<tool>.<group>.<name>`, e.g. `list.step1.search`, `radar.step2.polygon`.
Ids are used as React keys and as session storage payload bits, so they
must be stable across renders and unique within their tool. Groups are
informal; pick by region or rhythm of the tour (`hero`, `step0.*`,
`step1.*`, etc.).

### Eyebrow + title + body

- `eyebrow` is the small uppercase line above the title. Keep it short
  (`"start here"`, `"arrange the list"`, `"read the outcomes"`).
- `title` is the one-sentence message of the step. Title-only steps
  with no body are fine (`body: ""`) when the illustration carries the
  weight.
- `body` may include `{{infoIcon}}` to inline the outlined info glyph
  (see `runner/TourBodyContent`). The runner picks the right color for
  you.

### Placement

- `placement` accepts any Popper placement (`"bottom"`, `"left-start"`,
  …). Default is `"bottom"`. Popper flips automatically if there is no
  room on the preferred side.
- `disableFlip: true` disables that flip. Use sparingly, only when a
  demo effect reveals chart content the popper must not cover.
- `anchorSkidMultiplier` shifts the popper along the cross axis by that
  multiple of the anchor's size (anchor width for top/bottom, anchor
  height for left/right). Use to slide a card past its anchor so it
  does not occlude live chart content.

### Title icon

`titleIcon` accepts `"pin"` or `"share"` today and renders the
matching glyph immediately before the title text in the popper
(`runner/TourCard`). Use it when the step describes a control whose
own glyph is the easiest way to identify it (the list tour's pin and
share row controls do this). New icons require a new branch in
`TourCard`; do not extend the union just to color text.

### Bookend steps

Steps without an `anchorId` render as a centered card. Use these for
the hero ("Welcome to the radar chart") and the journey closer ("What
to do after this chart").

### Illustration keys

Keys are tool-scoped (each tool's `TourModule.illustrations` is
looked up independently, so two tools may both define an `infoIcon`
without colliding). Even so, prefix keys with the tool id when the
illustration is recognizably about that tool (`listBarTiers`,
`listMapLegend`, `listSearch`); reserve bare names like `infoIcon`
for cross-tool conventions. The list tour follows this in
`panels/list/tour/illustrations/index.tsx`.

## Adding a tour to a new tool

The recipe assumes the new tool is called `equity`. Replace `equity`
with your tool id throughout.

Required steps are 1, 2, 5, and 6. Steps 3, 4, and 7 are conditional
on what the tour needs.

### 1. Write the steps - `panels/equity/tour/steps.ts`

Export `EQUITY_TOUR: TourStep[]` with the ordered steps. Use stable
ids (see [Step ids](#step-ids) above). The runner walks the array in
order; the first and last entries are typically anchorless bookends
(see [Bookend steps](#bookend-steps)).

### 2. Register anchors

Call `useTourAnchor("equity.foo.bar")` on every target the steps will
point at and attach the returned ref to the element. HTML and SVG both
work. Use `InlineTourAnchor` from `tour/anchors/` when wrapping a
child is simpler than threading a ref.

**Anchors live wherever the target lives.** Most are in
`panels/<tool>/` (chart axes, cells, in-panel buttons), but tour steps
that point at shared chrome must register anchors there. Examples:
`SearchAndChips.tsx`, `ToolToolbar.tsx`, and
`ScenarioSelectionSidebar.tsx` all register anchors that the list
tour reuses. A `useTourAnchor` call outside of `TourAnchorProvider`
is a no-op, so chrome can stay tour-agnostic when no tool needs it.

### 3. (Conditional) Store-side demo effects - `panels/equity/tour/EquityTourEffects.tsx`

Add this only if a step needs the store mutated to preview what a
control does (open the map, flip a chip, focus an axis). One component
owns all such behavior for the tool. Snapshot any store value you
change in a `useRef` on enter, restore it in the effect cleanup, and
key each effect by the step id you respond to. The runner mounts this
component only while the equity tour is active and re-keys it by tool
so hook order is stable per file. See [Demo effects](#demo-effects)
below for the rules of thumb.

### 4. (Conditional) Illustrations - `panels/equity/tour/illustrations/`

Add this only if a step's `illustration` key needs a custom visual.
One file per visual block plus an `index.tsx` exporting
`Record<string, () => ReactNode>`. Reference the keys from `steps.ts`
via `illustration: "key"`. Illustrations are visual-only; do not wire
click handlers, because the tour runner already drives the matching
live control. See [Illustrations](#illustrations) for framing and
naming conventions.

### 5. Assemble the module - `panels/equity/tour/index.ts`

The default export is the `TourModule` the runner consumes. Only
include the fields the tool actually needs.

Minimal (steps only):

```ts
import type { TourModule } from "../../../tour/types"
import { EQUITY_TOUR } from "./steps"

const equityTourModule: TourModule = {
  steps: EQUITY_TOUR,
}

export default equityTourModule
```

With demo effects but no illustrations (radar pattern,
`panels/radar/tour/index.ts`):

```ts
import type { TourModule } from "../../../tour/types"
import { EQUITY_TOUR } from "./steps"
import EquityTourEffects from "./EquityTourEffects"

const equityTourModule: TourModule = {
  steps: EQUITY_TOUR,
  EffectsComponent: EquityTourEffects,
}

export default equityTourModule
```

With both effects and illustrations (list pattern,
`panels/list/tour/index.ts`):

```ts
import type { TourModule } from "../../../tour/types"
import { EQUITY_TOUR } from "./steps"
import EquityTourEffects from "./EquityTourEffects"
import { EQUITY_TOUR_ILLUSTRATIONS } from "./illustrations"

const equityTourModule: TourModule = {
  steps: EQUITY_TOUR,
  EffectsComponent: EquityTourEffects,
  illustrations: EQUITY_TOUR_ILLUSTRATIONS,
}

export default equityTourModule
```

If the tool also needs a colocated sync hook (step 7) or a tool-local
anchor wrapper, re-export them from this file so panel code has one
import path:

```ts
export { useEquityInfoSync } from "./useEquityInfoSync"
```

### 6. Register the tour - `tour/registry.ts` and `tour/toolToTourMap.ts`

Append `"equity"` to `TOUR_TOOLS` in `tour/registry.ts`. Then in
`tour/toolToTourMap.ts`, import the module and add an `equity:` entry
to `TOUR_MODULES`. The `Record<TourTool, TourModule>` typing on
`TOUR_MODULES` will fail the build if the two lists go out of sync.

Keep React-bearing imports out of `tour/registry.ts`. The workspace
store imports `TourTool` and `hasTourFor` from that file at module
load, so anything React-shaped in the import tree pulls hooks into
the store and breaks Server Components. `tour/toolToTourMap.ts` is
the React-bearing companion.

### 7. (Conditional) Sync hook for component-local state - `panels/equity/tour/useEquityFooSync.ts`

Add this only if a step needs to drive React state that lives inside
a panel component (a `useState` for a popover, an open/close flag in
a chart control). Do not lift that state to a slice for the tour's
sake. Instead, write a small sync hook next to the rest of the tour
code and call it from the panel.

Two reference implementations:

- `panels/list/tour/useListInfoTooltipSync.ts` opens
  `StrategyGrid`'s outcome tooltip when the list info step is active.
  It uses `useTourAnchorResolver` to wait for the late-mounting
  outcome row.
- `panels/radar/tour/useRadarInfoIconSync.ts` opens `RadarPanel`'s
  `openInfoAxis` popover when the radar info step is active. It does
  not need the resolver because the axis list is already in panel
  state.

Authoring shape:

```ts
"use client"

import { useEffect, useRef } from "react"
import { useWorkspaceSlice } from "../../../../store"
import { EQUITY_TOUR } from "./steps"

const EQUITY_INFO_STEP_ID = "equity.step2.info"

export function useEquityInfoSync(
  openInfo: string | null,
  setOpenInfo: (id: string | null) => void,
) {
  const stepId = useWorkspaceSlice((s) => {
    if (s.tour.tool !== "equity") return null
    return EQUITY_TOUR[s.tour.step]?.id ?? null
  })
  const openedByTourRef = useRef(false)

  useEffect(() => {
    const isInfoStep = stepId === EQUITY_INFO_STEP_ID
    if (isInfoStep) {
      if (openInfo !== "first") {
        setOpenInfo("first")
        openedByTourRef.current = true
      }
      return
    }
    if (openedByTourRef.current) {
      openedByTourRef.current = false
      setOpenInfo(null)
    }
  }, [stepId, openInfo, setOpenInfo])
}
```

Rules of thumb:

- Read `tour.tool` and `tour.step` from `useWorkspaceSlice` and look
  the step up in the colocated `steps.ts` so the hook ignores other
  tools' tours and is silent when no tour is running.
- Open on entry, close on exit. Track whether the tour opened the
  state via a `useRef` so user-opened state is not clobbered when the
  step ends.
- For late-mounting anchors, pull `resolve` and `version` from
  `useTourAnchorResolver()` and add them to the effect deps (list
  pattern).

That is the full recipe. The "Take the tour" button, the runner, the
tab-switch reset, the sessionStorage persistence, and the
`workspaceStoreSlice.tour.tool: TourTool` type all extend
automatically once steps 1, 2, 5, and 6 are in place.

## Anchors

`useTourAnchor("id")` returns a ref callback. Attach it to any
element. The provider keeps an `id -> Element` map in a mutable ref;
writes do not trigger re-renders. Two registrations of the same id
let the most recently mounted one win. Calling `useTourAnchor` outside
of a `TourAnchorProvider` is a no-op, so view code can render with the
tour subsystem disabled.

`useTourAnchorResolver()` is the runner / effects side. It returns
`{ resolve, version }` and re-renders the caller when the registry
changes. The runner debounces resolution with a small grace period so
late-mounting targets are still found.

For elements that already accept a ref (most MUI components, any
styled `Box`), call `useTourAnchor` directly. For elements that do not,
or where wrapping is the path of least resistance, wrap them in
`InlineTourAnchor`:

```tsx
<InlineTourAnchor anchorId="equity.toolbar.compare">
  <ToggleChip label="compare" active={false} onClick={onClick} />
</InlineTourAnchor>
```

SVG elements work too: the `resolve` return type is `Element`, and
the `HighlightRing` only needs `getBoundingClientRect`. This is how
the resilience prototype tour can target heatmap cells.

## Demo effects

Rules of thumb for each `EffectsComponent`:

- Mount per tool: the runner already keys `EffectsComponent` by
  `tourTool`, so your hook order is stable within the file. Add new
  `useEffect`s freely.
- Snapshot prior store state in a `useRef` on enter; restore from the
  ref on cleanup. The cleanup must not read from store selectors,
  because selector subscriptions can close over stale state.
- Read setters from slice hooks at the top of the component
  (`const setShowMap = useWorkspaceSlice((s) => s.setShowMap)`). Read
  current values inside the effect via `useExplorerStore.getState()`
  so the effect does not re-run when the value it set changes.
- For component-local state, prefer a small colocated sync hook called
  from the panel (see above) over plumbing setters out through context.
- If a demo effect needs to programmatically click something that the
  effect itself reveals on entry, defer the action one
  `requestAnimationFrame` so the revealed control is in the registry.
  See `ListTourEffects` for `list.step4.map`.

## Illustrations

- Keep them visual-only. No click handlers; the runner already drives
  the matching live control when the step is active. If the
  illustration must include a control sample, set `pointerEvents:
  "none"`.
- Frame each block to match the rest: warm off-white panel background
  (`#faf8f5`), `1px solid theme.palette.divider`, `borderRadius: 1.5`,
  small uppercase eyebrow at the top.
- Compose `TourTierLegend` from `tour/reusableContent/` for tier swatches
  so list, radar, and resilience all read identically.
- Return illustrations from `illustrations/index.tsx` as
  `() => <Component />`, keyed by the string used in
  `steps.ts:illustration`. Keys are tool-scoped, so two tools can both
  define `infoIcon` without colliding (see
  [Illustration keys](#illustration-keys) for naming guidance).

## Manual test checklist

Before opening a PR that adds or changes a tour:

- [ ] "Take the tour" button appears in the journey strip when the
      tool is active and is hidden when no module is registered for
      the tool. (Driven by `hasTourFor` in `runner/TakeTheTourButton`.)
- [ ] Every step's card resolves to its anchor on first paint, and
      `HighlightRing` traces the anchor rect. Late-mounting anchors
      (those revealed by a demo effect) are found after the grace
      period instead of falling back to a centered card.
- [ ] Stepping forward and back through every step does not throw,
      does not leak the highlight ring, and restores any preview state
      the demo effects mutated.
- [ ] Switching to another Explore tool while the tour is running
      ends the tour (`workspaceStoreSlice.setExploreMode` calls
      `endTour`); switching back does not auto-resume.
- [ ] Same-tab reload mid-tour restores `tour.tool` and `tour.step`
      from sessionStorage (`validateTour` in `exploreSessionPersist`)
      so the same step re-renders.
- [ ] ESC and the close button both call `endTour`; left and right
      arrow keys step within the tour (`ToolTour` keydown handler).
- [ ] For component-local sync hooks: the synced UI opens on entry to
      the step and closes on exit, and user-opened state outside the
      tour is not clobbered. Verify by opening the popover manually
      first and confirming the tour does not steal it away.
- [ ] No `panels/<other-tool>/` imports leak into the tool you are
      adding the tour to; the runner reads everything through
      `TOUR_MODULES` in `tour/toolToTourMap.ts`.
