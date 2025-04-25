# COEQWAL Visualization Package

A React-based data visualization library for COEQWAL built with D3.js.

## Features

- **DecileBarChart**: Visualize decile data with customizable colors
- TypeScript support with comprehensive type definitions
- Utility functions for data processing and formatting

## Installation

The package is part of the COEQWAL monorepo and is available via workspace imports:

```js
// In your application package.json
"dependencies": {
  "@repo/viz": "workspace:*"
}
```

## Usage

```jsx
import { DecileBarChart } from "@repo/viz"

// Example component
function MyComponent() {
  // Sample decile data
  const data = [
    { decile: 1, value: 10 },
    { decile: 2, value: 25 },
    { decile: 3, value: 30 },
    // ... more deciles
  ]

  return (
    <div style={{ width: "100%", height: "300px" }}>
      <DecileBarChart
        data={data}
        title="Flow Distribution by Decile"
        xAxisLabel="Decile"
        yAxisLabel="Flow (TAF)"
        colorScheme="blues"
        showValues={true}
        responsive={true}
      />
    </div>
  )
}
```

## Props

### DecileBarChart Props

| Prop        | Type                                                    | Default                                        | Description                                        |
| ----------- | ------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| data        | `DecileData[]` or `Record<string, any>`                 | required                                       | Array of decile objects or object with decile data |
| width       | number                                                  | 400                                            | Chart width in pixels                              |
| height      | number                                                  | 300                                            | Chart height in pixels                             |
| margin      | object                                                  | `{ top: 30, right: 20, bottom: 40, left: 50 }` | Chart margins                                      |
| title       | string                                                  | 'Decile Distribution'                          | Chart title                                        |
| xAxisLabel  | string                                                  | 'Decile'                                       | X-axis label                                       |
| yAxisLabel  | string                                                  | 'Value'                                        | Y-axis label                                       |
| colorScheme | 'blues' \| 'greens' \| 'purples' \| 'oranges' \| 'reds' | 'blues'                                        | Color scheme for bars                              |
| showValues  | boolean                                                 | true                                           | Whether to show values above bars                  |
| responsive  | boolean                                                 | true                                           | Whether chart should adapt to container size       |

## Development

To add new chart types or update existing ones:

1. Add types to `src/types.ts`
2. Create the component in `src/components/`
3. Add utility functions in `src/utils/` if needed
4. Export from `src/index.ts`
