# COEQWAL Turborepo

The COEQWAL Turborepo is a monorepo for the Collaboratory for Equity in Water Allocation (COEQWAL) project. It facilitates the development, management, and deployment of applications and packages that support equitable water management decisions by combining community input, computational models, and open data.

This repository uses Turborepo to streamline development workflows, allowing shared code, efficient builds, and cross-project collaboration. A key concept in a Turborepo is that there is a directory for apps and a directory for packages. Apps are standalone apps that can be developed independently and imported into other apps or built and run separately. Packages are components that can be shared between apps. Both are "workspaces," to use the Turborepo terminology, and can be connected by setting up exports and imports in their respective `package.json` files.

Dependencies and configurations set at the root level are overriden by local dependencies and configurations. For example, if you'd like to set a different linting configuration or a different dependency version for a specific app, you can configure these using that app's `package.json` and configuration files.

## Stack

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Turborepo](https://turbo.build/repo)
- [pnpm](https://pnpm.io/)
- [React-map-gl](https://visgl.github.io/react-map-gl/) (using mapbox)
  - [Mapbox](https://mapbox.com/)
- [D3](https://d3js.org/)
- [MaterialUI](https://mui.com/material-ui/)
- [motion](https://motion.dev/)
- [SASS](https://sass-lang.com/)

## Installation

### Prerequisites

Node.js: Ensure you have Node.js version 22.x installed. Use nvm or Volta for version management.

```sh
nvm install 22.21.1
nvm use 22.21.1
```

pnpm: Install pnpm using Corepack locally (included in Node.js 22.x).

```sh
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

Note (in case you were reading the `amplify.yml` and wondering): Locally it's easiest to use Corepack. AWS Amplify instead installs pnpm globally in the container they use to run the build.

### Installating the repo and packages

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
pnpm dev --filter=main
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

## Changes from the Standard Turborepo

This Turborepo has been customized to meet the needs of the COEQWAL project. Key changes include:

### Global dependencies:

- `react`, `react-dom`, all their types, and `typescript`, `@types/node`, and `prettier` are installed at the root to ensure consistency across apps and reduce duplication. Compare the dependencies in the root `package.json` with the `package.json` in the individual `apps` and `packages` directories for details. Note that apps must install `next` (because packages wouldn't use next, so it doesn't make sense to install it at the root...maybe). We need to keep the `next` versions in sync.

### Shared packages:

- The shared `eslint-config`, `typescript-config` and `ui` are standard for Turborepo setups, but these can be customized for the project.
- We have `ui`, `i18n`, and `map` packages. We can set up a shared data package, a common parameters library package, an api package, and a viz/D3 package.
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
  - scripts and dependencies should generally be as in the `map` or `i18n` package. Note that you should write in `eslint": "^9.15.0` as a devDependency. I haven't automated that yet.
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

### Next steps

- In the near future, I'd like to implement pnpm cataloging to keep package versions in sync. This looks like having a `pnpm-workspace.yaml` that contains packages and versions like so:

```
catalog:
  react: 19.2.1
  react-dom: 19.2.1
  next: 15.5.9
  typescript: 5.8.2
  turbo: 2.6.3
```

Then in each app/package that needs them:

```
{
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "next": "catalog:"
  }
}
```

This can be optional and per app. If you are a developer responsible for making sure an app "stays in place" over time, you can pin a version in your `package.json`.
