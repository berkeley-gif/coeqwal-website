# COEQWAL Turborepo

The COEQWAL Turborepo is a monorepo for the Collaboratory for Equity in Water Allocation (COEQWAL) project. It facilitates the development, management, and deployment of applications and packages that support equitable water management decisions by combining community input, computational models, and open data.

This repository uses Turborepo to streamline development workflows, allowing shared code, efficient builds, and cross-project collaboration. A key concept in a Turborepo is that there is a directory for apps and a directory for packages. Apps are standalone apps that can be developed independently and imported into other apps or built and run separately. Packages are components that can be shared between apps. Both are "workspaces," to use the Turborepo terminology, and can be connected by setting up exports and imports in their respective `package.json` files.

Dependencies and configurations set at the root level are overriden by local dependencies and configurations. For example, if you'd like to set a different linting configuration or a different dependency version for a specific app, you can configure these using that app's `package.json` and configuration files.

## Table of contents

- [Overview](#overview)
  - [Monorepo structure](#monorepo-structure)
  - [Applications](#applications)
  - [Shared packages](#shared-packages)
  - [Main app architecture](#main-app-architecture)
- [Stack](#stack)
- [Key architecture patterns](#key-architecture-patterns)
- [Installation](#installation)
- [How to run](#how-to-run)
- [How to deploy](#how-to-deploy)
  - [Deployment rules](#deployment-rules)
  - [Apps and Amplify ids](#apps-and-amplify-ids)
  - [Shared-package PRs](#shared-package-prs)
  - [How to deploy your app after a package change](#how-to-deploy-your-app-after-a-package-change)
  - [Adding a new app to the dev deploy pipeline](#adding-a-new-app-to-the-dev-deploy-pipeline)
- [Do local dev builds feel sluggish?](#do-local-dev-builds-feel-sluggish)
- [Changes from the standard Turborepo](#changes-from-the-standard-turborepo)
- [React StrictMode](#react-strictmode)
- [SSG and hydration boundaries](#ssg-and-hydration-boundaries)
- [Adding a new app to the Turborepo (monorepo)](#adding-a-new-app)
- [Adding a new package](#adding-a-new-package)
- [Regular Turborepo maintenance (for lead dev)](#regular-turborepo-maintenance-for-lead-dev)
- [Roadmap](#roadmap)

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
- **`@repo/scrollytelling`** Scrollytelling primitives (components and hooks) layered on `react-scrollama` and `@repo/motion`. Used by the storyline apps.
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
| Animation      | [Framer Motion](https://motion.dev/) |
| Scrollytelling | [react-scrollama](https://github.com/jsonkao/react-scrollama), custom `@repo/scrollytelling`                                        |
| Drag and drop  | [@dnd-kit](https://dndkit.com/)                                                                                                     |
| Deploy         | [AWS Amplify](https://aws.amazon.com/amplify/) (static export)                                                                      |

## Key architecture patterns

### Data flow

The main app wraps its component tree in a `DataProvider` (SWR) that communicates with the external COEQWAL API at `https://api.coeqwal.org/api`. Typed hooks in `@repo/data` (such as `useScenarios`, `useTiers`, `useReservoirPercentiles`, and others) abstract the API calls and manage caching via SWR cache keys. File downloads are handled through a separate AWS API Gateway endpoint. There are no Next.js API routes in the repo. All apps are statically exported.

### State management

Zustand stores manage UI state for the map (`apps/main/app/features/map/store.ts`) and the scenario explorer (`apps/main/app/features/scenarioExplorer/store.ts`). React Context is used for the map API (`MapContext`), tab navigation (`TabsProvider`), chart grid layout (`ChartGridContext`), and internationalization (`TranslationProvider`). The active tab is also synced to URL query parameters.

### Persistent map

The main app renders a Mapbox map that persists behind all scrolling and tabbed content. A `LayerOrchestrator` manages base layers (basins, rivers, directional arrows) and visualization layers (scenario outcome polygons, tier markers, points of interest). The map is dynamically imported with `ssr: false` to avoid bundling Mapbox GL on the server.

### Static export

All apps use `output: "export"` in their Next.js config, producing fully static sites deployed to AWS Amplify. This means no server-side rendering at request time, no API routes, and no middleware. The `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable is required at build time.

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

Amplify installs pnpm with `npm install -g pnpm@<version>` in its build container (see the per-app stanzas in [`amplify.yml`](amplify.yml) at the repo root). When bumping pnpm, update the root `package.json` `packageManager` field and the `npm install -g pnpm@X` lines in `amplify.yml` together.

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

The COEQWAL website is hosted on AWS Amplify as the independent apps that share this monorepo. The dispatcher is a GitHub Actions workflow ([Deploy to Amplify](.github/workflows/deploy-amplify.yml)) which assumes a GitHub OIDC (GitHub OpenID Connect) role (`coeqwal-website-amplify-deploy-role`) and calls `aws amplify start-job` for each selected app.

### Deployment rules

"Shared workspaces" are `packages/**`, `pnpm-workspace.yaml`, `turbo.json`, and the root `package.json`.

**Summary** There are two kinds of changes, and they behave differently:

- **App-only changes** (files under `apps/<x>/**`) deploy automatically.
- **Shared-workspace changes** can affect every app at once, so they never auto-deploy. They go through a PR, and each app owner redeploys their own app when ready.

**Quick rules**

- **Editing one app?** Open a PR into `dev`. When it merges (or when you push to `dev`), that one app auto-deploys. Markdown-only edits never deploy an app.
- **Editing shared code?** Open a PR. Merging it updates the source on `dev` but doesn't deploy an app. Affected app owners get a notification listing their apps and the deploy link, and they redeploy when ready. Pushing shared code straight to `dev` without a PR fails CI on purpose.
- **Need to deploy right now** (for example, to pick up a shared change)? Go to the **Actions** tab -> **Deploy to Amplify** -> **Run workflow**, then choose your app and `dev`.

When in doubt, the table below is the full reference for every trigger, with the exact files that configure each behavior.

| Trigger                                                                                  | What happens                                                                                                                                                                                                           | Where it is configured                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Push or PR merge to `dev` touching one or more `apps/<x>/**` (non-Markdown)              | Each app with changes auto-deploys.                                                                                                                                                                                    | [deploy-amplify.yml](.github/workflows/deploy-amplify.yml): `on.push.paths`, `dorny/paths-filter` filters, and the `compute` step that maps changed apps to deploy targets.                                                                                                         |
| PR into `dev` touching shared workspaces (non-Markdown)                                  | [Notify package changes](.github/workflows/notify-package-changes.yml) posts a sticky comment listing affected apps, their [CODEOWNERS](.github/CODEOWNERS), and a per-app dispatch link. **Never triggers a deploy.**  Merging a shared-package PR to `dev` changes the source on `dev`, but it will not deploy to the site without manual deployment.| [notify-package-changes.yml](.github/workflows/notify-package-changes.yml): `on.pull_request.paths`; impact list from [compute-affected-apps.mjs](.github/scripts/compute-affected-apps.mjs).|
| Push to `dev` (not via PR) touching shared workspaces or `pnpm-lock.yaml` (non-Markdown) | [Enforce package-PR rule](.github/workflows/enforce-package-pr.yml) fails the run. The pusher gets a "workflow failed" email. Please open a PR for shared workspaces.                                                  | [enforce-package-pr.yml](.github/workflows/enforce-package-pr.yml): `on.push.paths` and the "Inspect push commits for PR provenance" step.                                                                                                                                          |
| Anything touching only Markdown                                                          | Nothing. Markdown is exempt from both notify and enforce.                                                                                                                                                              | [deploy-amplify.yml](.github/workflows/deploy-amplify.yml): `!apps/<app>/**/*.md` in `on.push.paths` and in `dorny/paths-filter`. [enforce-package-pr.yml](.github/workflows/enforce-package-pr.yml): `!**/*.md` / `!**/*.mdx` in `on.push.paths` and the inspect-step `grep -vE`.  |
| Anything touching only `pnpm-lock.yaml`                                                  | No notify, no deploy. A lockfile-only PR merge to `dev` is a non-event. A direct (non-PR) lockfile push to `dev` still fails [Enforce package-PR rule](.github/workflows/enforce-package-pr.yml) (see the row above).   | Omitted from [notify-package-changes.yml](.github/workflows/notify-package-changes.yml) `on.pull_request.paths` and from [compute-affected-apps.mjs](.github/scripts/compute-affected-apps.mjs); not in [deploy-amplify.yml](.github/workflows/deploy-amplify.yml) `on.push.paths`. But `pnpm-lock.yaml` **is** in [enforce-package-pr.yml](.github/workflows/enforce-package-pr.yml) `on.push.paths` and its inspect-step `grep`.  |
| Deploy to Amplify via GitHub Actions tab -> Run workflow                             | Manually deploys the chosen app(s) on `dev`.                                                                                                                                                                           | [deploy-amplify.yml](.github/workflows/deploy-amplify.yml): `on.workflow_dispatch` inputs (`apps`, `branch`) and the deploy job `MAP` lookup.                                                                                                                                       |

### Apps and Amplify ids

| Console name            | Repo path                | Custom domain (today -> launch)    |
| ----------------------- | ------------------------ | ---------------------------------- |
| `coeqwal-website-dev`   | `apps/main`              | `dev.coeqwal.org` -> `coeqwal.org` |
| `storyline-flow-dev`    | `apps/storyline-flow`    | `flow.coeqwal.org`                 |
| `storyline-climate-dev` | `apps/storyline-climate` | `climate.coeqwal.org`              |

The Amplify build-spec is the repo-root [`amplify.yml`](amplify.yml). The online Amplify Console build spec has been entered in the console for each app as a fallback that mirrors each app's matching stanza. If the root file is ever removed, Amplify falls back to the console version.

### Shared-package PRs

A PR into `dev` that touches `packages/**`, `pnpm-workspace.yaml`, `turbo.json`, or root `package.json` triggers [Notify package changes](.github/workflows/notify-package-changes.yml). The script [`compute-affected-apps.mjs`](.github/scripts/compute-affected-apps.mjs) diffs the PR against `dev`, reads [`.github/CODEOWNERS`](.github/CODEOWNERS) to learn which apps the monorepo deploys, and reads each app's `package.json` to find which apps depend on each changed package. It then posts a comment on the PR (header `package-deploy-impact`) listing the affected apps, their CODEOWNERS, and a per-app dispatch link.

`pnpm-lock.yaml` is intentionally excluded from the trigger paths and from the script's impact set because lockfile churn (regenerations, transitive bumps, dependabot) is too noisy.

### How to deploy your app after a package change

After a package PR merges to `dev`, each affected app's CODEOWNER decides whether to ship the change into their app. Three situations:

- **Already validated locally** (e.g., the package PR was opened from your branch and you ran your app against it): dispatch **Deploy to Amplify** for your app on `dev`. Done.
- **Not yet validated**: pull `dev`, run `pnpm install`, run `pnpm dev --filter <your-app>`, click around. Push when satisfied.
- **App is feature-complete and dormant**: do nothing. The previously-deployed build keeps running until somebody explicitly redeploys.

### Adding a new app to the dev deploy pipeline

Steps 1, 4, and 5 are repo edits. Make them on a branch and merge them into `dev` before the smoke test in step 6, because that test runs against whatever is on `dev`. Steps 2 and 3 are AWS-side (Amplify Console and IAM). The App ID created in step 2 is needed by the IAM policy (step 3) and the workflow `MAP` (step 4).

1. **Root [amplify.yml](amplify.yml) - author the build spec first.** Add an `applications:` stanza copy-pasted from one of the existing three, with `appRoot: apps/<name>`, `baseDirectory: apps/<name>/out`, and `--filter=<name>`. Keep the same `cache:` block and `NODE_VERSION` pin. The console step mirrors this stanza as its fallback, so it has to exist first.
2. **Amplify Console - create the app as a static (`WEB`) host.** These apps are static exports (`output: "export"` in each `next.config`, emitted to `out/`), so they should run on Amplify's static `WEB` platform, not the Next.js `WEB_COMPUTE` (server) platform. Amplify's framework auto-detection, when it sees a Next.js repo, generally defaults the new app to `WEB_COMPUTE`, which expects `baseDirectory: .next` and will not serve our `out/`, so the platform has to be forced back to `WEB`. The console paths below are the expected locations. Labels can shift between Amplify Console versions, so navigate around if they have changed:
   - **a.** Amplify Console -> **Create new app** -> **GitHub**, authorize, then choose `berkeley-gif/coeqwal-website` and branch `dev`.
   - **b.** Check **My app is a monorepo** and enter the app root `apps/<name>`. The console sets `AMPLIFY_MONOREPO_APP_ROOT=apps/<name>` for you.
   - **c.** **Force the platform to `WEB`.** Amplify auto-detects Next.js and creates the app as `WEB_COMPUTE`, which expects `baseDirectory: .next` and serves nothing from our `out/`. After the app is created, flip it back with the AWS CLI (the console may not expose a reliable platform toggle once Next.js is detected, so the CLI is the dependable way):
      ```bash
      aws amplify update-app --app-id <appId> --platform WEB
      # verify (must print WEB):
      aws amplify get-app --app-id <appId> --query 'app.platform' --output text
      ```
      The AWS console should now show the app as `WEB`.
   - **d.** **Disable auto-build on `dev`** (App settings -> Branch settings -> turn off automatic builds). Every deploy is driven by the `Deploy to Amplify` workflow, never by Amplify's own Git trigger.
   - **e.** Paste a per-app fallback inline build spec mirroring the stanza you added in step 1.
   - **f.** Note the **App ID**. You need it for the IAM policy (step 3) and the workflow `MAP` lookup (step 4).
   - **g.** Set the app's **build-time environment variables** (App settings -> Environment variables). Any `NEXT_PUBLIC_*` value the app reads at build time goes here. Today that means `NEXT_PUBLIC_MAPBOX_TOKEN` if the app renders a map. Each such variable must also be listed in root [turbo.json](turbo.json) (`globalEnv` and the `build` task's `env`), or Turbo strips it from the build environment and the value reaches the bundle as `undefined`. `NEXT_PUBLIC_MAPBOX_TOKEN` is already declared there. A var that is new to the monorepo needs that declaration added.
3. **IAM:** extend the `amplify-start-job` policy on role `coeqwal-website-amplify-deploy-role` to grant `amplify:StartJob` and `amplify:GetJob` on the new app's job resources, i.e. add `arn:aws:amplify:us-west-2:<acct>:apps/<appId>/*` to the policy's `Resource` list (the `/*` reaches the branch and job sub-resources that these actions act on; the bare `apps/<appId>` ARN is not enough). This policy is deliberately scoped to each app's ARN, so a new app is denied deploys until its ARN is added here. The reason the `Resource` has to name the job sub-resource is that `amplify:StartJob` and `amplify:GetJob` are resource-scoped to the `jobs` resource type (`arn:...:apps/${AppId}/branches/${BranchName}/jobs/${JobId}`). See the [AWS Amplify Service Authorization Reference](https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsamplify.html) (the `jobs` resource type, and the `StartJob` / `GetJob` rows) and [How Amplify works with IAM](https://docs.aws.amazon.com/amplify/latest/userguide/security_iam_service-with-iam.html).
4. **[.github/workflows/deploy-amplify.yml](.github/workflows/deploy-amplify.yml):** register the new app in the deploy workflow according to the process below. All of the edits below are made in this file (`.github/workflows/deploy-amplify.yml`):
   - **Dispatch menu:** add `- <name>` to `workflow_dispatch.inputs.apps.options`.
   - **"Deploy all" option:** add `<name>` to the `all)` case's `APPS='[...]'` array so the `all` choice includes it.
   - **Push trigger paths:** add `apps/<name>/**` and `!apps/<name>/**/*.md` to the workflow-level `push.paths`.
   - **Path filter:** add a matching block to the `dorny/paths-filter` `filters` map (`<name>:` with `apps/<name>/**` and `!apps/<name>/**/*.md`). The step uses `predicate-quantifier: 'every'`, so the `!*.md` line acts as an exclusion.
   - **Compute step, `env:`** add `<NAME>_CHANGED: ${{ steps.filter.outputs.<name> || 'false' }}` to the `compute` step's `env:` block.
   - **Compute step, dispatch `case`:** add `<name>) APPS='["<name>"]' ;;` to the `case "$SELECTION"` block.
   - **Compute step, push append:** add `[[ "$<NAME>_CHANGED" == "true" ]] && APPS=$(jq -c '. + ["<name>"]' <<<"$APPS")` to the push branch, so a push touching the app auto-deploys it. Use the same `<NAME>_CHANGED` name as the `env:` entry above. **Without this line the app never auto-deploys on push** (the dispatch `case` alone only covers manual runs).
   - **App-ID lookup:** add `["dev:<name>"]="d<appId>"` to the `MAP` in the lookup step.
   - Do **not** add a production branch entry yet. That comes when production is wired.
   - No new GitHub secret or variable is needed: the workflow authenticates with the shared `AMPLIFY_DEPLOY_ROLE_ARN` Actions variable (repo Settings -> Secrets and variables -> Actions -> Variables), which every app reuses.
5. **[.github/CODEOWNERS](.github/CODEOWNERS):** add `/apps/<name>/  @owner1 @owner2`. The notify workflow reads CODEOWNERS as the source of truth for which apps are tracked.
6. **Smoke test:** once steps 1, 4, and 5 are merged to `dev`, dispatch **Deploy to Amplify** for `<name>` on `dev`, confirm `SUCCEED`. Then push a one-line edit under `apps/<name>/`, confirm only `<name>` auto-deploys.
7. **Custom domain:** In Amplify Console (Hosting -> Custom domains), attach `<sub>.coeqwal.org`. Amplify provisions HTTPS through [AWS Certificate Manager](https://docs.aws.amazon.com/acm/) (ACM). Complete ACM DNS validation: add the CNAME records Amplify shows in Route 53 (or wherever `coeqwal.org` DNS is hosted) and wait until the certificate is **Issued** and `https://<sub>.coeqwal.org` loads. This step is DNS and certificate setup only, not a deploy or smoke test (those are step 6).

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

- `react`, `react-dom`, all their types, `typescript`, `@types/node`, `prettier`, `eslint`, `turbo`, and `sass` are installed at the root to ensure consistency across apps and reduce duplication. Compare the dependencies in the root `package.json` with the `package.json` in the individual `apps` and `packages` directories for details. Note that apps must install `next` (because packages wouldn't use next, so it doesn't make sense to install it at the root...maybe). We need to keep the `next` versions in sync.

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

2. **Explicit hydration boundaries**: Client providers are rendered directly inside Server Components. Layout-wide providers (theme, translations, data, `TabsProvider`) live in `app/layout.tsx`. Home-page-only providers (`MapProvider`) are rendered inline in `app/page.tsx`.

3. **Dynamic imports for heavy libraries**: The Mapbox map is dynamically imported with `ssr: false` to reduce initial bundle size.

### Guidelines

- **Add `"use client"` when**: Component uses React hooks, browser APIs, or event handlers
- **Keep as Server Component when**: Component is purely presentational with static or inlined values
- **Use dynamic imports for**: Heavy libraries that aren't needed for initial render (maps, charts)
- **Document substituted inlined values**: Always comment where the value comes from (e.g., `// from theme.zIndex.pageContent`)

### Future improvements

MUI supports CSS variables mode (`cssVariables: true` in theme config), which would allow Server Components to use theme values via `var(--mui-zIndex-pageContent)`. This is a potential future optimization.

## Adding a new app to the Turborepo (monorepo)

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

- **Sync `next` versions across apps.** The apps currently drift (some on `^15.5.9`, some on `^15.2.1`). Bump the stragglers so all apps share one `next` version. Adopting `catalog:` (below) would make this enforceable going forward.

- **Production cutover at launch.** Per-app: create the production git branch, create the production Amplify app, add the branch to the GiHub Action workflow's `branch:` dropdown, add the `MAP` row, smoke-test, cut over the custom domain via ACM (AWS Certificate Manager). Enable Amplify Firewall (WAF) on the production apps. Narrow CORS and presign allowlists from `*` to production hostnames.

- (Nice to have) **pnpm catalog.** Adopt `catalog:` in `pnpm-workspace.yaml` to keep shared library versions (`react`, `react-dom`, `next`, `typescript`, `turbo`) in sync across workspaces. Apps can opt out by pinning a specific version in their own `package.json`.

- **Node 24 LTS cadence.** Bump from Node 22 to Node 24 shortly after Node 24 enters Maintenance LTS in October 2026 (see [Node version cadence](#node-version-cadence); Node 24 EOL is April 2028 per the [official release schedule](https://github.com/nodejs/Release/blob/master/schedule.json)).
