# COEQWAL main app

The mainstem of the COEQWAL website. A statically-exported Next.js 15 (App Router) app that pairs an interactive Mapbox basemap with a scrolling intro and a three-tab explorer (Learn / Explore / Share). It's the application visitors land on at the project's primary domain.

## Feature READMEs

- [Map feature](app/features/map/README.md)
- [Scenario Explorer](app/features/scenarioExplorer/README.md)
- [Animation (Get-started storyboard)](app/features/scenarioExplorer/animation/README.md)
- [Share system](app/features/scenarioExplorer/explorer/share/README.md)
- [Data in Depth](app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/README.md)
- [Tour subsystem](app/features/scenarioExplorer/explorer/tools/tour/README.md)

## How-tos

- [How to add a visualization tool](app/features/scenarioExplorer/README.md#how-to-add-a-visualization-tool)
- [How to add a hydroclimate](app/features/scenarioExplorer/README.md#how-to-add-a-hydroclimate)
- [How to add a variant (share)](app/features/scenarioExplorer/explorer/share/README.md#how-to-add-a-variant)
- [How to add or change a beat (animation)](app/features/scenarioExplorer/animation/README.md#how-to-add-or-change-a-beat)
- [How to add a tour to a new tool](app/features/scenarioExplorer/explorer/tools/tour/README.md#how-to-add-a-tour-to-a-new-tool)
- [How to add a new point outcome to the map](app/features/map/README.md#how-to-add-a-new-point-outcome-to-the-map)
- [How to add a camera zoom for an outcome](app/features/map/README.md#how-to-add-a-camera-zoom-for-an-outcome)
- [How to measure the extent of a Mapbox layer](app/features/map/README.md#how-to-measure-the-extent-of-a-mapbox-layer)

## Routes

| Path     | What it is                                                                             |
| -------- | -------------------------------------------------------------------------------------- |
| `/`      | Home. Persistent map + intro section + Learn / Explore / Share tabs                    |
| `/about` | Project background, methodology, partner logos, contact                                |
| `/data`  | Scenario data downloads (full-run ZIPs and per-scenario CSVs), API documentation links |

## Packages used and where

Workspace packages (consumed via `workspace:*` in `package.json`):

| Package                | Where it's used                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `@repo/ui`             | Everywhere. `BaseHeader`, `SkipLink`, `ErrorFallback`, `MainContent` styling, the entire MUI re-export entry, theme tokens                   |
| `@repo/utils`          | `ErrorBoundary` paired with each Suspense site                                                                                               |
| `@repo/data`           | `DataProvider` in `app/layout.tsx`. Typed scenario / tier / equity hooks consumed throughout `app/features/scenarios` and `scenarioExplorer` |
| `@repo/map`            | `MapProvider` in `app/page.tsx`. Layer / camera primitives in `app/features/map`                                                             |
| `@repo/motion`         | Animated transitions in `app/sections/IntroSection.tsx`, tab panels, scenario explorer cards                                                 |
| `@repo/scrollytelling` | `StickyScrollSection`, `useScrollProgress`, `useMeetingProgress` in `app/sections/IntroSection.tsx` and the Learn-tab scenes                 |
| `@repo/state`          | Zustand + Immer re-exports backing `app/features/map/store.ts` and `app/features/scenarioExplorer/store.ts`                                  |
| `@repo/viz`            | D3 chart components inside `app/features/scenarioExplorer/explorer/tools/panels/dataInDepth` and `app/features/scenarios/components/shared`  |
| `@repo/i18n`           | `TranslationProvider` in `app/layout.tsx`, wrapping the whole app for locale-aware copy                                                      |

Notable third-party packages in this app's `package.json`:

| Packages                            | Used for                                                         |
| ----------------------------------- | ---------------------------------------------------------------- |
| `@emotion/react`, `@emotion/styled` | MUI's CSS-in-JS engine                                           |
| `swr`                               | API caching layer (typed hooks live in `@repo/data`)             |
| `react-scrollama`                   | Step-based scrollytelling in the Learn tab                       |
| `@dnd-kit/*`                        | Share tab: drag-and-drop reordering of share-story items         |
| `html-to-image`                     | Share tab: exporting share cards as PNG                          |
| `jszip`                             | Share tab: bundling exported share cards into a ZIP for download |

## Layout and rendering model

`app/layout.tsx` (Server Component) sets up the layout-level providers and the always-on components:

```
StrictMode
├── FontLoader (Adobe Fonts kit)
└── TranslationProvider
    └── DataProvider
        └── ThemeRegistry (MUI)
            ├── ErrorBoundary > Suspense > ActiveThemePanel    (off-canvas theme drawer)
            └── TabsProvider
                ├── SkipLink                                   (WCAG 2.4.1)
                ├── ErrorBoundary > Suspense > Header
                └── {children}                                 (page content)
```

**Translation provider:** `TranslationProvider` from `@repo/i18n` wraps `DataProvider`, `ThemeRegistry`, and all layout chrome as shown, so every component below it can read locale-aware copy.

`app/page.tsx` (Server Component) renders the home-only stack:

```
MapProvider
├── DynamicMap                  (dynamic import, ssr: false, position: fixed)
├── FloatingGlossary
└── MainContent (<main id="main-content">, pointerEvents: none)
    ├── IntroSection            (VideoHero, About panel, [Suspense > WaterThemesPanel])
    ├── SmoothTabs              (tab strip)
    └── ErrorBoundary > Suspense > TabPanels
```

The map is `position: fixed` at `zIndex.persistentMap`, behind everything. `MainContent` is a `<main>` overlay at `zIndex.pageContent` with `pointerEvents: "none"` so cursor events fall through to the map. Child components re-enable pointer events on the elements they own (panels, buttons, tooltips). The result is a single map that survives every route change and tab switch, with content layered on top.

## Important topics

### Static export (SSG)

`next.config.js` sets `output: "export"`. All pages render to static HTML at build time and deploy as plain files (via AWS Amplify). Implications:

- No API routes, no middleware, no `revalidate`. Data fetching is client-side via SWR against `https://api.coeqwal.org/api` (the `DEFAULT_API_BASE` in `@repo/data`, overridable via `<DataProvider apiBaseUrl={...}>`).
- `NEXT_PUBLIC_MAPBOX_TOKEN` must be set at build time.
- Anything that touches `useSearchParams()` must sit under a `Suspense` boundary because search params are not knowable until the client hydrates (see next section).

### Suspense

Every `useSearchParams()` call in client code suspends during static export. There are four such places in this app, each wrapped in a Suspense boundary:

| Suspending component | Boundary lives in               | Reason                               |
| -------------------- | ------------------------------- | ------------------------------------ |
| `Header`             | `app/layout.tsx`                | reads `?theme=` for nav highlight    |
| `ActiveThemePanel`   | `app/layout.tsx`                | reads `?theme=` to decide visibility |
| `WaterThemesPanel`   | `app/sections/IntroSection.tsx` | reads `?theme=` via `usePanelRoute`  |
| `TabPanels`          | `app/page.tsx`                  | reads `?tab=` for active-tab sync    |

`ThemePanel` and the get-started `WaterIssuesPanel` also read `?theme=` through `usePanelRoute`, but they render inside one of the boundaries above (the `Header` / `ActiveThemePanel` / `WaterThemesPanel` subtree and the `TabPanels` subtree respectively), so they do not need their own.

### Error boundaries

Three layers, from broadest to narrowest:

1. `app/global-error.tsx`: catches errors thrown inside `app/layout.tsx` itself (provider failures). Renders its own `<html>` / `<body>` with plain inline styles since MUI is not yet mounted at that point.
2. `app/error.tsx` (`RouteSegmentError`): catches errors thrown inside any route segment's `page.tsx` and its children. The surrounding layout (Header, providers) stays interactive.
3. Local `ErrorBoundary` from `@repo/utils`, paired with each Suspense above. Decorative or conditional sites (`Header`, `ActiveThemePanel`, `WaterThemesPanel`) silently render `null` on failure. The main interactive surface (`TabPanels`) shows a visible `TabPanelsErrorFallback` with a retry button. The persistent map has its own in `app/components/DynamicMap.tsx` with `MapErrorFallback`.

### URL state and deep links

| Param                                    | Owner / writer                                                              | Reader                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `?tab=`                                  | `TabPanels` (URL `<->` `activeTab` sync)                                    | `TabPanels`, plus URL-init read at mount                       |
| `?theme=`                                | `usePanelRoute` (open/close theme panels)                                   | `Header`, `ActiveThemePanel`, `WaterThemesPanel`, `ThemePanel` |
| `?climate=`, `?items=`, `?story=`, `?v=` | Share-card encoder in `app/features/scenarioExplorer/explorer/share/url.ts` | `useShareUrlRehydration` hook (mount-once)                     |

Share-link rehydration uses `window.location.search` directly inside a mount `useEffect` (see `app/features/scenarioExplorer/explorer/share/useShareUrlRehydration.ts`) so it does not call `useSearchParams` and does not need a Suspense ancestor. Only `?tab=` and `?theme=` are read through `useSearchParams`, which is why those are the only Suspense-causing parameters.

### State management

Three storage tiers, picked by what the state needs to do.

| Mechanism        | Used for                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zustand stores   | High-frequency or cross-cutting UI state. `features/map/store.ts` (camera, layers, hover); `features/scenarioExplorer/store.ts` (selections, share items, tour)                      |
| React Context    | Tree-scoped state with stable identities. `TabsProvider` (active tab, refs, scroll regions); `MapProvider` (Mapbox instance); `TranslationProvider`, `DataProvider`, `ThemeRegistry` |
| URL query params | Shareable / deep-linkable state. See URL section above.                                                                                                                              |

Rule of thumb: if it should survive a copy-paste of the URL, it goes in the URL. If many components need it but state changes are infrequent and tree-shaped, Context. Anything else, Zustand.

### Persistent map pattern

The map renders once at the root of `page.tsx` and stays mounted across tab switches. Two design choices keep this working:

- **Z-index stacking**: the map sits at `theme.zIndex.persistentMap` (low). Content sits at `theme.zIndex.pageContent` (higher). Theme tokens live in `@repo/ui/themes`.
- **Pointer-events pass-through**: `MainContent` sets `pointerEvents: "none"` so map gestures (pan, zoom, click on a basin) work even though there's a `<main>` element on top of the map. Each child that needs to receive cursor events (panels, buttons, tab strip) sets `pointerEvents: "auto"` locally.

`DynamicMap` uses `dynamic(() => import("../features/map/PersistentMapWrapper"), { ssr: false })` because Mapbox GL only runs in the browser.

### Hydration model

`layout.tsx` and `page.tsx` are Server Components. Anything below them that uses hooks, browser APIs, or event handlers is marked `"use client"`. Specifically:

- All providers (`TranslationProvider`, `DataProvider`, `ThemeRegistry`, `TabsProvider`, `MapProvider`) are client components.
- All routed sections (`IntroSection`, `SmoothTabs`, `TabPanels`, the Header) are client components.
- `MainContent` is a Server Component (it's just a styled `<main>`). Theme values are inlined as comments rather than read via `useTheme` so it can stay server-side.
- `PersistentMapWrapper` is dynamically imported with `ssr: false`. It never executes on the build server.

When adding new components, prefer Server Components by default. Add `"use client"` only when the component needs hooks, refs, browser APIs, or event handlers.

### Accessibility

Wired up at the layout level so every route inherits the same baseline:

- **Skip link** (WCAG 2.4.1): `<SkipLink />` is the first focusable element in the DOM. It targets `#main-content` and is keyboard-revealed only.
- **Tab order** (WCAG 2.4.3): `Header` is rendered before `{children}`, so tabbing from the address bar goes Skip Link -> Header nav -> page content.
- **Reduced motion** (WCAG 2.3.3): scroll animations in `Header` and `SkipLink` honor `prefers-reduced-motion`.
