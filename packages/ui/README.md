# `@repo/ui`

Shared UI components and theme system for COEQWAL applications. Built on MUI v7 with Emotion.

For the full visual reference (colors, typography, spacing, component examples), see the **design system page** at `/design-system.html` (served from `apps/main/public/design-system.html`). The theme source is `src/themes/theme.tsx`.

## Imports

```typescript
// Theme
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import theme from "@repo/ui/themes/theme"

// MUI components and icons - always import from here, not directly from MUI
import { Button, Typography, Box, KeyboardArrowDownIcon } from "@repo/ui/mui"
import type { ButtonProps, BoxProps } from "@repo/ui/mui"

// Custom COEQWAL components
import { Card, VideoBackground, Header, BasePanel, VideoPanel } from "@repo/ui"
```

## Why import MUI from `@repo/ui/mui`

All MUI components and icons must be imported from `@repo/ui/mui`, not directly from `@mui/material`. This centralized export:

- Adds the `"use client"` directive required by Next.js App Router
- Keeps a single MUI version across all packages
- Enables tree-shaking and prevents bundle duplication

If a component or type you need is not exported yet, add it to `src/mui-components.tsx`.

## Adding new components

1. Create the component in the appropriate category folder under `src/components/`
2. Use a named export
3. Add the export to `src/components/index.ts`

Use the `sx` prop for all styling. Import MUI components from `@repo/ui/mui`.
