# @repo/data

Shared data package for COEQWAL applications. Contains static data files that can be used across multiple apps in the monorepo.

## Installation

This package is automatically available to all apps in the monorepo via workspace dependencies.

To use in an app, add to the app's `package.json`:

```json
{
  "dependencies": {
    "@repo/data": "workspace:*"
  }
}
```
and then be sure to:

```shell
pnpm install
```

## Usage

### Importing GIS data

```typescript
import { centralValleyBasins } from '@repo/data'

// Use in your application
console.log(centralValleyBasins);
```

### Direct file import

You can also import specific files directly:

```typescript
import centralValleyBasins from '@repo/data/gis/central_valley_basins_4326.geojson'
```

## Package structure

```
packages/data/
├── src/
│   ├── index.ts          # Main exports
│   └── gis/              # GIS data files (GeoJSON, etc.)
│       └── central_valley_basins_4326.geojson
├── package.json
├── tsconfig.json
└── README.md
```

## Adding new data files

1. Place your data file in the appropriate subdirectory
2. Export it from `src/index.ts`:
   ```typescript
   export { default as myNewData } from './appropriate_directory/my_new_data.geojson';
   ```
3. Document the new data in this README

## Type safety

This package includes TypeScript definitions for GeoJSON via `@types/geojson`, ensuring type safety when working with geographic data.

