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
2. **Entry.** `entry/TakeTheTourButton` checks `hasTourFor(exploreMode)`
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

### Bookend steps

Steps without an `anchorId` render as a centered card. Use these for
the hero ("Welcome to the radar chart") and the journey closer ("What
to do after this chart").

## Adding a tour to a new tool

The recipe assumes the new tool is called `equity`. Replace `equity`
with your tool id.

1. **`panels/equity/tour/steps.ts`** - export
   `EQUITY_TOUR: TourStep[]` with the ordered steps. Use stable ids.
2. **Register anchors.** In components inside `panels/equity/` (plus
   any shared chrome you want to point at), call
   `useTourAnchor("equity.foo.bar")` and attach the returned ref to
   the target. HTML and SVG both work. Use `InlineTourAnchor` from
   `tour/anchors/` when wrapping a child is the simplest path.
3. **(Optional) `panels/equity/tour/EquityTourEffects.tsx`** - one
   component that owns store-side demo behavior for steps that need a
   programmatic preview. Snapshot any store value you change in a
   `useRef`, restore it in the effect cleanup, and key each effect by
   the step id you respond to. The runner mounts this component only
   while the equity tour is active.
4. **(Optional) `panels/equity/tour/illustrations/`** - one file per
   visual block plus an `index.tsx` exporting
   `Record<string, () => ReactNode>`. Reference the keys from
   `steps.ts` via `illustration: "key"`. Illustrations are visual-only,
   so do not wire click handlers; the tour runner already drives the
   live control.
5. **`panels/equity/tour/index.ts`** - assemble the module:

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

6. **`tour/registry.ts`** - append `"equity"` to `TOUR_TOOLS`.
   **`tour/toolToTourMap.ts`** - import the new module and add an
   `equity:` entry to `TOUR_MODULES`. The `Record<TourTool, TourModule>`
   typing on `TOUR_MODULES` will fail the build if the two lists go out
   of sync.

That is enough. The "Take the tour" button, the runner, the
tab-switch reset, the sessionStorage persistence, and the
`workspaceStoreSlice.tour.tool: TourTool` type all extend without
further edits.

### Side effects that need component-local state

If a tour step needs to drive React state that lives inside a panel
component (a `useState` for a popover, for example), do not lift the
state to a slice for the tour's sake. Instead, write a small sync hook
next to the rest of the tour code and call it from the panel:

- `panels/list/tour/useListInfoTooltipSync.ts` drives
  `StrategyGrid`'s outcome tooltip during the list info step.
- `panels/radar/tour/useRadarInfoIconSync.ts` drives `RadarPanel`'s
  `openInfoAxis` during the radar info step.

These hooks read the tour state from `useWorkspaceSlice` and the
target id from the colocated `steps.ts`, so the panel only has to know
to call them.

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
  define `infoIcon` without colliding.
