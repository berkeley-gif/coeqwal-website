# COEQWAL Turborepo

The COEQWAL Turborepo is a monorepo for the Collaboratory for Equity in Water Allocation (COEQWAL) project. It facilitates the development, management, and deployment of applications and packages that support equitable water management decisions by combining community input, computational models, and open data.

This repository uses Turborepo to streamline development workflows, allowing shared code, efficient builds, and cross-project collaboration. A key concept in a Turborepo is that there is a directory for apps and a directory for packages. Apps are standalone apps that can be developed independently and imported into other apps or built and run separately. Packages are components that can be shared between apps. Both are "workspaces," to use the Turborepo terminology, and can be connected by setting up exports and imports in their respective `package.json` files.

Dependencies and configurations set at the root level are overriden by local dependencies and configurations. For example, if you'd like to set a different linting configuration or a different dependency version for a specific app, you can configure these using that app's `package.json` and configuration files.

## Overview

### Monorepo structure

The repository is managed with **Turborepo + pnpm workspaces** and split into two top-level directories:

- `apps/` standalone Next.js applications
- `packages/` shared libraries consumed by the apps

### Applications

- **`apps/main`** The primary COEQWAL website. A Next.js 15 (App Router) application with an interactive Mapbox map, a scenario explorer, data visualizations, and a three-tab system (Learn / Explore / Share). All pages are statically exported.
- **`apps/storyline-flow`** A standalone storyline app focused on water flow narratives (Next.js 15, static export).
- **`apps/storyline-climate`** A standalone storyline app focused on climate scenarios (Next.js 15, static export).

### Shared packages

- **`@repo/ui`** Shared UI component library built on MUI v7 and Emotion. Exports components (header, panels, chips, tooltips, inputs, modals), a centralized MUI re-export entry point, theme configuration, and UI hooks.
- **`@repo/data`** Data fetching and caching layer using SWR. Provides COEQWAL API types, fetch functions, React hooks, cache key management, a `DataProvider`, and static GIS data (GeoJSON files).
- **`@repo/viz`** D3-based visualization components for water data: bar charts, line charts, percentile band charts, rose charts, spill charts, parallel line plots, glyph components, and shared D3 utilities.
- **`@repo/map`** Mapbox GL mapping components via react-map-gl. Includes the core `Map` component, `MapProvider` context, geocoding control, declarative layer management hooks, spatial query hooks (point-in-polygon), and transition utilities.
- **`@repo/state`** Shared state management utilities. Re-exports Zustand and Immer, and provides a shared drawer store.
- **`@repo/motion`** Animation wrapper around Framer Motion.
- **`@repo/i18n`** Internationalization provider and translation hooks.
- **`@repo/utils`** General utilities including an `ErrorBoundary` component.
- **`@repo/typescript-config`** Shared TypeScript configuration presets (base, Next.js, React library).
- **`@repo/eslint-config`** Shared ESLint configuration.

### Main app architecture

The main app (`apps/main`) has three routes:

- `/` Home page with a video hero, intro section, and the three-tab system overlaid on a persistent Mapbox map
- `/about` Project information, partner logos, and contact details
- `/data` Scenario data downloads (ZIP and CSV)

Key features live in `apps/main/app/features/`:

- **`map/`** Mapbox instance with base layers (rivers, basins), visualization layers (outcomes, tier markers), overlay panels, camera presets, and its own Zustand store
- **`scenarioExplorer/`** Multi-view scenario explorer with list, comparison, equity, and data explorer views
- **`scenarios/`** Scenario selection components and data hooks
- **`glossary/`** Floating glossary panel
- **`tooltips/`** Tier tooltips, map feature tooltips, and scroll tooltips

Styling uses **MUI v7 with Emotion** (CSS-in-JS via the `sx` prop and a shared theme from `@repo/ui/themes`). This choice was made so facilitate design system collaboration. It does however greatly expand the hydration boundary for the site, effectively limiting our SSR options. That said, we are using i18n, map layers, and d3 extensively in the site, which also greatly expands our hydration boundary.

State management combines **Zustand** stores (map state, scenario explorer state) with **React Context** (tab state) and URL query-parameter sync for the active tab.

## Stack

| Layer          | Technology                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Framework      | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://reactjs.org/), [TypeScript 5.8](https://www.typescriptlang.org/) |
| Build          | [Turborepo](https://turbo.build/repo), [pnpm 10](https://pnpm.io/), Node 22                                                         |
| UI             | [MUI v7](https://mui.com/material-ui/) + [Emotion](https://emotion.sh/), [SASS](https://sass-lang.com/)                             |
| State          | [Zustand](https://zustand-demo.pmnd.rs/) (with [Immer](https://immerjs.github.io/immer/)), React Context                            |
| Data fetching  | [SWR](https://swr.vercel.app/), native fetch                                                                                        |
| Maps           | [Mapbox GL](https://mapbox.com/) + [react-map-gl](https://visgl.github.io/react-map-gl/), [Turf.js](https://turfjs.org/)            |
| Charts         | [D3 v7](https://d3js.org/) (custom components in `@repo/viz`)                                                                       |
| Animation      | [Framer Motion](https://motion.dev/), [Flubber](https://github.com/veltman/flubber) (shape morphing)                                |
| Scrollytelling | [react-scrollama](https://github.com/jsonkao/react-scrollama), custom `@repo/scrollytelling`                                        |
| Drag and drop  | [@dnd-kit](https://dndkit.com/)                                                                                                     |
| Deploy         | [AWS Amplify](https://aws.amazon.com/amplify/) (static export)                                                                      |

## Key architecture patterns

### Data flow

The main app wraps its component tree in a `DataProvider` (SWR) that communicates with the external COEQWAL API at `https://api.coeqwal.org/api`. Typed hooks in `@repo/data` (such as `useScenarios`, `useTiers`, `useReservoirPercentiles`, and others) abstract the API calls and manage caching via SWR cache keys. File downloads are handled through a separate AWS API Gateway endpoint. There are no Next.js API routes in the repo. All three apps are statically exported and rely entirely on client-side fetching to external services.

### State management

Zustand stores manage complex UI state for the map (`apps/main/app/features/map/store.ts`) and the scenario explorer (`apps/main/app/features/scenarioExplorer/store.ts`). React Context is used for the map API (`MapContext`), tab navigation (`TabsProvider`), chart grid layout (`ChartGridContext`), and internationalization (`TranslationProvider`). The active tab is also synced to URL query parameters.

### Persistent map

The main app renders a Mapbox map that persists behind all scrolling and tabbed content. A `LayerOrchestrator` manages base layers (basins, rivers, directional arrows) and visualization layers (scenario outcome polygons, tier markers, points of interest). The map is dynamically imported with `ssr: false` to avoid bundling Mapbox GL on the server.

### Static export

All three apps use `output: "export"` in their Next.js config, producing fully static sites deployed to AWS Amplify. This means no server-side rendering at request time, no API routes, and no middleware. The `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable is required at build time.

### Visualization

The `@repo/viz` package contains custom D3 chart components covering a wide range of chart types. These are purpose-built for water data and scenario comparison.

### Internationalization

Under construction

## Installation

### Prerequisites

Node.js: install the version pinned in [`.nvmrc`](.nvmrc) (currently `22.x`, see [Node version cadence](#node-version-cadence) below). With nvm or fnm, `nvm install` / `nvm use` read `.nvmrc` automatically:

```sh
nvm install
nvm use
node -v   # should print v22.x.y
```

If you don't use a version manager, install any Node 22 LTS patch through your system package manager.

pnpm: install via Corepack. The version is pinned in the root `package.json` `packageManager` field (currently `pnpm@10.0.0`):

```sh
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm -v   # should print 10.0.0
```

Amplify installs pnpm with `npm install -g pnpm@<version>` in its build container (see the three per-app stanzas in [`amplify.yml`](amplify.yml) at the repo root). When bumping pnpm, update the root `package.json` `packageManager` field and all three `npm install -g pnpm@X` lines in `amplify.yml` together.

### Installing the repo and packages

Clone the repository, cd into the repo, and install dependencies.

```sh
git clone https://github.com/berkeley-gif/coeqwal-website.git
cd coeqwal-website
pnpm install
```

## How to run

See `package.json` for scripts. Note that after running the build scripts, the builds will appear in the `.next/` directory of each app. You can run the built app by running `pnpm start` in the app's directory.

Here is how to explicitly run the dev script:

### Run all apps in development mode

```sh
pnpm dev
```

### Run a specific app only (dev)

To run a specific app (e.g., `main`), navigate to its directory and start it:

```sh
cd apps/main
pnpm dev
```

or

```sh
pnpm dev --filter main
```

This is recommended while developing because running the whole `pnpm dev` will slow down your dev builds and hot reload because it will start every package/app that has a dev task and their watchers.

You can also add scripts to the root `package.json` like:

```sh
    "dev:main": "pnpm --filter main dev",
```

if you find that convenient. Feel free to use shorthand for apps with long names:

```sh
    "dev:sf": "pnpm --filter storyline-flow dev",
```

### Build script sequence

To build, and before pushing to github:

```sh
pnpm format
pnpm lint
pnpm build
```

or

```sh
pnpm format --filter=main
pnpm lint --filter=main
pnpm build --filter=main
```

## How to deploy

The COEQWAL website is hosted on AWS Amplify as three independent apps that share this monorepo. Each app deploys on its own. The dispatcher is a GitHub Actions workflow ([Deploy to Amplify](.github/workflows/deploy-amplify.yml)), which assumes a GitHub OIDC role and calls `aws amplify start-job` for the selected app. Build spec source-of-truth is the repo-root [amplify.yml](amplify.yml).

### Deployment process for developers

- **On-demand:** in this repo on GitHub, open the **Actions** tab, pick **Deploy to Amplify** in the sidebar, click **Run workflow**, choose your app (`main`, `storyline-flow`, `storyline-climate`, or `all-three`) and branch (`dev` today, `production-<name>` after launch). The run goes green only when Amplify reports `SUCCEED`.

- **Auto-deploy on push:** a push to `dev` that touches `apps/<X>/**` automatically dispatches the workflow for just that app. Pushes that only touch packages, the lockfile, or other paths do not auto-deploy any app.

- **Shared-package PRs:** opening a PR to `dev` that touches `packages/**`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, or root `package.json` triggers [Notify package changes](.github/workflows/notify-package-changes.yml). When working, it posts a single sticky comment (header `package-deploy-impact`) listing the apps that depend on the changed code, their [CODEOWNERS](.github/CODEOWNERS), and a dispatch link for each. The comment never triggers a deploy. Status today: see [Roadmap](#roadmap).

- **Production:** never auto-deploys. Each app gets its own `production-<name>` branch and its own production Amplify app, dispatched manually from the same workflow.

- **When a build fails:** open the failed run in the Actions tab. The GHA wait step surfaces `FAILED` / `CANCELLED` from `aws amplify get-job`. Click through to the Amplify Console build log for the actual `pnpm install` / `next build` output.

- Each Amplify Console inline spec is kept as a fallback mirror of root [amplify.yml](amplify.yml). If the root file is ever removed, Amplify falls back to the Console version.

### Adding a new app to the deploy pipeline

This complements [Adding a new app](#adding-a-new-app), which covers the code scaffolding. It assumes `apps/<name>/` already builds locally and produces a static export at `apps/<name>/out/`.

1. **Amplify Console:** create a new Amplify app pointed at `berkeley-gif/coeqwal-website`, branch `dev`. Set `AMPLIFY_MONOREPO_APP_ROOT=apps/<name>`. Build instance: Standard. **Disable auto-build on `dev`** (deploys are driven by GitHub Actions, not webhooks). Paste a per-app fallback inline build spec mirroring the matching stanza in root [amplify.yml](amplify.yml). Note the resulting App ID (`dxxxxxxxxxxxxx`).

2. **IAM:** extend the inline `amplify-start-job` policy on role `coeqwal-website-amplify-deploy-role` to include the new app's ARN under `Resource:` for actions `amplify:StartJob`, `amplify:GetJob`, `amplify:ListJobs`.

3. **Root [amplify.yml](amplify.yml):** add a fourth `applications:` stanza copy-pasted from one of the existing three, with `appRoot: apps/<name>`, `baseDirectory: apps/<name>/out`, `--filter=<name>`. Keep the same `cache:` block (pnpm store only) and `NODE_VERSION` pin.

4. **[.github/workflows/deploy-amplify.yml](.github/workflows/deploy-amplify.yml):** add `<name>` to the `workflow_dispatch.inputs.apps.options` list and `production-<name>` to the `branch.options` list. Add `apps/<name>/**` to the `push.paths` filter and to the `dorny/paths-filter` filter map. Add a `case` line for `<name>` in the compute step and a `MAP[dev:<name>]="d<appId>"` entry in the lookup step.

5. **[.github/CODEOWNERS](.github/CODEOWNERS):** add `/apps/<name>/  @owner1 @owner2`. The notify workflow reads CODEOWNERS as the source of truth for which apps are tracked, so this is what wires the new app into the package-impact comment.

6. **Smoke test:** in the Actions tab, dispatch **Deploy to Amplify** for `<name>` on branch `dev`. Confirm `SUCCEED` in the Amplify Console. Then push a one-line edit under `apps/<name>/` on a feature branch and merge to `dev`; confirm only `<name>` auto-deploys.

7. **Custom domain (later, at launch):** in Amplify Console, attach `<sub>.coeqwal.org`, validate via ACM.

## Do local dev builds feel sluggish?

### Try clearing your cache

(especially if you have been doing data intensive work)

- To clean bloated Turbo and app-level NextJS caches
  (again, using `main` app as example):

```sh
rm -rf .turbo/cache
rm -rf .turbo apps/main/.next
```

See also the `clean` scripts in the root `package.json`.

## Changes from the standard Turborepo

This Turborepo has been customized to meet the needs of the COEQWAL project. Key changes include:

### Global dependencies:

- `react`, `react-dom`, all their types, and `typescript`, `@types/node`, and `prettier` are installed at the root to ensure consistency across apps and reduce duplication. Compare the dependencies in the root `package.json` with the `package.json` in the individual `apps` and `packages` directories for details. Note that apps must install `next` (because packages wouldn't use next, so it doesn't make sense to install it at the root...maybe). We need to keep the `next` versions in sync.

### Shared packages:

- The shared `eslint-config`, `typescript-config` and `ui` are standard for Turborepo setups, but these can be customized for the project.
- The Viz Team should feel free to set up packages to support their common work.

## React StrictMode

The `main` app has React StrictMode enabled in `apps/main/app/layout.tsx`. StrictMode is a development tool that helps catch common bugs early.

### Benefits

- **Catches impure renders**: Identifies components that produce different output on re-render
- **Detects missing effect cleanup**: Finds effects that don't properly clean up subscriptions, timers, or event listeners
- **Warns about deprecated APIs**: Alerts you to legacy React patterns that will break in future versions
- **Improves code quality**: Encourages patterns that work well with React's concurrent features

### Side effects (development only)

StrictMode intentionally double-invokes certain functions to help detect side effects:

- **Double console logs**: You'll see console.log statements appear twice in development
- **Effects run twice**: `useEffect` callbacks run twice to verify proper cleanup
- **Render functions called twice**: Components render twice to detect impure renders

These double invocations **only happen in development mode** Production builds are unaffected.

### Example console output

```
// Development with StrictMode:
"Component mounted"    // First invocation
"Component mounted"    // Second invocation (StrictMode check)

// In production:
"Component mounted"    // Single invocation
```

### Implementation

We encourage enabling StrictMode in other apps to maintain code quality. If you choose to do so, here are the steps:

1. Add to your `layout.tsx`:

```tsx
import { StrictMode } from "react"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StrictMode>{/* your providers and content */}</StrictMode>
      </body>
    </html>
  )
}
```

That's it! If you encounter issues, you can temporarily disable StrictMode by removing the wrapper, fix the underlying problem, then re-enable it.

## SSG and hydration boundaries

The `main` app uses Next.js App Router with static export (SSG). Understanding the Server Component / Client Component boundary is essential for maintaining performance.

### The MUI + SSG challenge

MUI's `sx` prop uses Emotion CSS-in-JS, which processes styles at runtime. When you use theme functions, that code must run in the browser, requiring a Client Component.

**Strategies we use:**

1. **Inline known values**: If it's beneficial to make a component a static layout component, for example if it is the ancestor to many other components, we hardcode theme values with comments referencing the source:

   ```tsx
   // Value from theme.zIndex.pageContent (inlined for Server Component)
   zIndex: 10,
   ```

2. **Explicit hydration boundaries**: We use wrapper components (`ClientProviders.tsx`) to establish clear boundaries between Server and Client Components.

3. **Dynamic imports for heavy libraries**: The Mapbox map is dynamically imported with `ssr: false` to reduce initial bundle size.

### Architecture

```
page.tsx (Server Component)
└── ClientProviders (Client boundary - provides MapProvider, TabsProvider)
    ├── SkipLink
    ├── Header
    ├── DynamicMap (dynamic import, ssr: false)
    ├── FloatingGlossary
    └── MainContent (Server Component - inlined theme values)
        ├── IntroSection (Client - uses hooks)
        ├── SmoothTabs (Client - uses hooks)
        └── TabPanels (Client - uses hooks)
```

### Guidelines

- **Add `"use client"` when**: Component uses React hooks, browser APIs, or event handlers
- **Keep as Server Component when**: Component is purely presentational with static or inlined values
- **Use dynamic imports for**: Heavy libraries that aren't needed for initial render (maps, charts)
- **Document substituted inlined values**: Always comment where the value comes from (e.g., `// from theme.zIndex.pageContent`)

### Future improvements

MUI supports CSS variables mode (`cssVariables: true` in theme config), which would allow Server Components to use theme values via `var(--mui-zIndex-pageContent)`. This is a potential future optimization.

## Adding a new app

To add a new app, cd into the `apps` directory and run

```sh
pnpm dlx create-next-app@latest <app name>
```

To maintain consistent structure for all apps, for configurations, choose **No** for TailwindCSS, `src/` directory, and import alias; otherwise, choose **Yes**.
This generator should create your directory and install necessary files, configurations, and dependencies. Then go to the root level and run:

```sh
cd ../
pnpm install
```

To make sure everything is linked correctly. Run `pnpm dev` and `pnpm build` to make sure the installation works.

3. To match the configuration with the rest of the Turborepo:

```sh
cd apps/<app name>
pnpm remove react react-dom typescript @types/node @types/react @types/react-dom eslint eslint-config-next @eslint/eslintrc
```

You can use the `main` app's `package.json` as a guide.

```sh
pnpm install
```

Run `pnpm dev` and `pnpm build` to make sure the changes are okay.

Finally, set up eslint using the `eslint-config` package:

```sh
pnpm add @repo/eslint-config -D --workspace
```

Replace eslint.config.mjs with eslint.config.js like in the `main` app.

```sh
pnpm install
```

And be sure to test the app by running `pnpm dev` and `pnpm build`.

If your installation gets messed up at any point, try

```sh
rm -rf node_modules .turbo && pnpm install && pnpm build
```

## Adding a new package

Adding a new package to a Turborepo involves creating a new directory for the package, setting up its structure, and configuring it to work with the rest of the monorepo.

Packages typically wouldn't use Nextjs, but they could use React. There are multiple ways to add a new package, but the most straightforward is to run:

```sh
pnpm turbo gen workspace --destination packages/<my-new-package> --type package
```

- `Name` should be `@repo/<package-name>`.
- In 99% of cases you'll want to select `eslint-config` and `typescript-config` as devDependencies.

This will create a new package in the `packages` directory with a `package.json`. Tasks now are:

- Fill in the scripts and dependencies in the `package.json` file.
  - `name` should be `"@repo/<my-new-package>"`
  - include `"type": "module"`,
  - scripts and dependencies should generally be as in the `map` package. Add `eslint` as a devDependency, matching the root pin (currently `^9.39.2`). I haven't automated that yet.
  - refer to these packages for suggestions for the dependencies and dev dependencies.
- Add a `tsconfig.json` file to the package to use the shared typescript config (copy from `i18n package`).
- Add an `eslint.config.mjs` file to the package to use the shared eslint config (copy from `i18n package`).
- Set up your `src` directory.
- Set up the appropriate exports in the `package.json` file.
- Set up the appropriate imports in the `package.json` files of the apps that will use the package.
- Run

```sh
pnpm install
```

at the root level to make sure all new packages and workspace import/exports are installed.

## Regular Turborepo maintenance (for lead dev)

Ideally a quarterly review, but at least yearly:

- Keep node, NextJS, and package versions up-to-date
- Review and maintain configs

### Node version cadence

The three apps and the Amplify build images target a single Node major. The strategy is to ride the current Active LTS, then bump one major shortly after the next LTS enters maintenance. That keeps us continuously on a supported LTS without scrambling near EOL.

Current target: **Node 22 LTS**.

Files to touch when bumping:

- Root [package.json](package.json) `engines.node` and `devDependencies.@types/node`
- Root [.nvmrc](.nvmrc)
- This README's "Installation" section
- Root [amplify.yml](amplify.yml) (the three `nvm install <n>` lines and the three `NODE_VERSION` values, one per app stanza)
- Each Amplify Console inline build spec (kept as a fallback in case root `amplify.yml` is ever removed; re-paste the matching stanza)

Validate by dispatching the Deploy to Amplify workflow against each app on `dev` and smoke-testing the resulting site. Backout: revert the commit, re-paste the previous YAML into the console.

## Roadmap

Outstanding items, in no particular order:

- **Refine deploy triggers.** Today the `push:` paths filter in [.github/workflows/deploy-amplify.yml](.github/workflows/deploy-amplify.yml) only watches `apps/main/**`, `apps/storyline-flow/**`, `apps/storyline-climate/**`. A change to the shared build spec ([amplify.yml](amplify.yml)) or the GitHub Actions workflows themselves does not auto-trigger any deploy and must be dispatched by hand. Decide which of `amplify.yml`, `.github/workflows/**`, root `package.json`, `pnpm-lock.yaml`, `turbo.json` should fan out to all three apps on push and update the filter and `resolve` job accordingly.

- **Fix the `Notify package changes` workflow.** Currently failing with `Unable to locate executable file: pnpm`, originating from `actions/setup-node@v5`'s Corepack auto-detection of the root `packageManager: pnpm@10.0.0`. The script [`compute-affected-apps.mjs`](.github/scripts/compute-affected-apps.mjs) only uses Node built-ins, so the cleanest fix is to drop the `setup-node` step entirely (Ubuntu runners already ship with Node). Once unblocked, finish the remaining smoke tests (packages-only PR and combined packages-plus-app PR).

- **Production cutover at launch.** Create `production-main`, `production-storyline-flow`, `production-storyline-climate` branches and three matching production Amplify apps. Cut over custom domains (`coeqwal.org`, `flow.coeqwal.org`, `climate.coeqwal.org`) via ACM. Enable Amplify Firewall (WAF) on the production apps only. Narrow CORS and presign allowlists from `*` to production hostnames.

- **Re-tidy Amplify Console inline build specs.** Each Console fallback should mirror its matching stanza in root [amplify.yml](amplify.yml) including the store-only `cache: { paths: [~/.cache/pnpm/**/*] }` block. Trivial paste-three-files task whenever convenient.

- **pnpm catalog.** Adopt `catalog:` in `pnpm-workspace.yaml` to keep shared library versions (`react`, `react-dom`, `next`, `typescript`, `turbo`) in sync across workspaces. Apps can opt out by pinning a specific version in their own `package.json`.

- **Node 24 LTS cadence.** Bump from Node 22 to Node 24 shortly after Node 24 enters Maintenance LTS in April 2028 (see [Node version cadence](#node-version-cadence)).
