# COEQWAL Turborepo

The COEQWAL Turborepo is a monorepo for the Collaboratory for Equity in Water Allocation project. It facilitates the development, management, and deployment of applications and packages that support equitable water management decisions by combining community input, computational models, and open data.

This repository uses Turborepo to streamline development workflows, allowing shared code, efficient builds, and cross-project collaboration.

## Stack

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/)
- [Turborepo](https://turbo.build/repo)
- [Mapbox](https://mapbox.com/)
- [D3](https://d3js.org/)
- [MaterialUI](https://mui.com/material-ui/)
- [SASS](https://sass-lang.com/)

## Installation

### Prerequisites

Node.js: Ensure you have Node.js version 22.x installed. Use nvm or Volta for version management.

```sh
nvm install 22.13.0
```

pnpm: Install pnpm globally using Corepack (included in Node.js 22.x).

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

See package.json for scripts. Here is how to explicitly run the dev script. Note that after running the build scripts, the builds will appear in the .next/ directory of each app. You can run the built app by running `pnpm start` in the app's directory.

### Start all apps in development mode

```sh
pnpm dev
```

### Start a Specific App

To run a specific app (e.g., main), navigate to its directory and start it:

```sh
cd apps/main
pnpm dev
```

## Changes from the Standard Turborepo

This Turborepo has been customized to meet the needs of the COEQWAL project. Key changes include:

### Global Dependencies:

- next, react, react-dom, and @types/node are installed globally to ensure consistency across apps and reduce duplication.
- Shared TypeScript configuration (@repo/typescript-config) centralizes TypeScript settings.

### Shared Packages:

- A packages/ui package provides reusable UI components.
- A packages/types package stores shared TypeScript types.

## Adding a new app

To add a new app

1. create a new directory in the apps/ directory.
2. run

```sh
pnpm dlx create-next-app@latest <app name>
```

You can delete the .gitignore file if you like and just use the turbo repo-wide one.

Run `pnpm dev` and `pnpm build` to make sure the installation works.

3. To match the configuration with the rest of the Turborepo:

```sh
pnpm remove react react-dom next typescript @types/node @types/react @types/react-dom eslint eslint-config-next @eslint/eslintrc
```

Run `pnpm dev` and `pnpm build` to make sure the changes are okay.

```sh
pnpm add @repo/eslint-config -D --workspace
```

Replace eslint.config.mjs with eslint.config.js.



