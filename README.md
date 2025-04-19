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
- [SASS](https://sass-lang.com/)

## Installation

### Prerequisites

Node.js: Ensure you have Node.js version 22.x installed. Use nvm or Volta for version management.

```sh
nvm install 22.13.0
nvm use 22.13.0
```

pnpm: Install pnpm using Corepack (included in Node.js 22.x).

```sh
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

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

### Run a specific app only

To run a specific app (e.g., `main`), navigate to its directory and start it:

```sh
cd apps/main
pnpm dev
```

### Build script sequence

To build, and before I push to GitHub, I run:

```sh
pnpm format
pnpm lint
pnpm build
```

## Changes from the Standard Turborepo

This Turborepo has been customized to meet the needs of the COEQWAL project. Key changes include:

### Global dependencies:

- `react`, `react-dom`, all their types, and `typescript`, `@types/node`, and `prettier` are installed at the root to ensure consistency across apps and reduce duplication. Compare the dependencies in the root `package.json` with the `package.json` in the individual `apps` and `packages` directories for details. Note that apps must install `next` (because packages wouldn't use next, so it doesn't make sense to install it at the root...maybe). We need to keep the `next` versions in sync.

### Shared packages:

- The shared `eslint-config`, `typescript-config` and `ui` are standard for Turborepo setups, but these can be customized for the project.
- We have `ui`, `i18n`, and `map` packages. We can set up a shared data package, a common parameters library package, an api package, and a viz/D3 package.
- The Viz Team should feel free to set up packages to support their common work.

## Adding a new app

To add a new app, cd into the `apps` directory and run

```sh
pnpm dlx create-next-app@latest <app name>
```

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
