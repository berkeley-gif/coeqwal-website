# UI Component Library

This package contains shared UI components for COEQWAL applications.

## Import patterns

Our UI package exposes the different types of components through specific import paths:

- `@repo/ui/themes` - Theme Registry and theme configuration
- `@repo/ui` - Custom COEQWAL components
- `@repo/ui/mui` - MUI components and icons

### Importing themes

```typescript
// Theme Registry for wrapping your app
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"

// Theme object for accessing values
import theme from "@repo/ui/themes/theme"
```

### Importing components

#### MUI Components and Icons

```typescript
// MUI components and icons - please import from our package, not directly from MUI!
import {
  // Components
  Button,
  Typography,
  Box,

  // Icons
  KeyboardArrowDownIcon,
  VisibilityIcon,
} from "@repo/ui/mui"

// If you need the types, you can use the component type directly
// or import types with the same pattern
import type { ButtonProps, BoxProps } from "@repo/ui/mui"
```

> **Note:** We selectively export MUI components to keep the bundle size small. If you need a component that's not exported yet, add it to `mui-components.tsx` rather than importing directly from MUI.

#### Custom Components

```typescript
// Import custom components from the main export
import { Card, VideoBackground, Header, BasePanel, VideoPanel } from "@repo/ui"
```

## Adding new custom components

When adding new components:

1. Create the component in the appropriate category folder, or create a new folder as appropriate

2. Export the component using a named export (preferred)

3. Add the export to the main index file (src/components/index.ts)

## MUI integration best practices

When creating components that use MUI:

1. **Always import MUI components from our package**:

   ```typescript
   // ✅ CORRECT: Import from our centralized export
   import { Button, Box, styled, type ButtonProps } from "@repo/ui/mui"

   // ❌ INCORRECT: Don't import directly from MUI
   import { Button } from "@mui/material"
   import { styled } from "@mui/material/styles"
   ```

2. **Why this approach?**

   The centralized MUI import approach solves several key problems:

   - **Client components in Next.js**:

     - MUI components need the "use client" directive in Next.js App Router
     - Our centralized export automatically adds this directive
     - Prevents the common error of forgetting to add "use client" when using MUI components

   - **Version control**:

     - Single point of control for MUI dependency versions
     - Upgrade paths become simpler - update one place instead of many
     - Ensures all components use the same MUI version

   - **Bundle optimization**:

     - Prevents multiple instances of MUI in the bundle
     - Enables better tree-shaking through consistent import paths
     - Reduces duplication in the final bundle

   - **Customization & theming**:

     - Allows us to provide pre-configured component variants
     - Can intercept and modify components before they're used
     - Ensures consistent theming across all MUI usage

   - **Maintainability**:
     - Easier to track which MUI components are used in the project
     - Simpler to apply global changes to how specific components work
     - Centralizes MUI-related code for better organization

3. **Missing components or types**:
   - If a component or type you need isn't exported from `@repo/ui/mui`,
     add it to the mui-components.tsx file rather than importing directly.
