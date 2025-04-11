# UI Component Library

This package contains shared UI components for COEQWAL applications.

## Component Organization

Components are organized by category:

- **Common**: Basic shared components (Card, Logo, VideoBackground, etc.)
- **Navigation**: Header, menu, and navigation components
- **Panels**: Page layout panels (BasePanel, HeroPanel, VideoPanel, etc.)

## Import Patterns

### Component Imports

```typescript
// Import components directly from their category
import { Card } from "@repo/ui/common/Card"
import { VideoBackground } from "@repo/ui/common/VideoBackground"
import { Header } from "@repo/ui/navigation/Header"
import { BasePanel } from "@repo/ui/panels/BasePanel"
import { VideoPanel } from "@repo/ui/panels/VideoPanel"
```

### MUI Components

```typescript
// MUI components
import { Button, Typography, Box } from "@repo/ui/mui"

// MUI types
import type { ButtonProps, BoxProps } from "@repo/ui/mui"
```

### Theme Registry

```typescript
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import theme from "@repo/ui/themes/theme"
```

## Benefits of Direct Imports

- Better tree-shaking (only imports exactly what you need)
- Clear component source (imports show exactly where components come from)
- Easier to trace dependencies
- Faster TypeScript type checking
- Better build performance

## Add New Components

When adding new components:

1. Create the component in the appropriate category folder
2. Export it with a default or named export
3. That's it! No need to update any barrel index files or `package.json`
4. If you make a new component category, you will need to update the `package.json` with that directory's export.

## MUI Integration Best Practices

When creating components that use MUI:

1. **Always import MUI components from our package**:

   ```typescript
   // ✅ CORRECT: Import from our centralized export
   import { Button, Box, styled, type ButtonProps } from "@repo/ui/mui"

   // ❌ INCORRECT: Don't import directly from MUI
   import { Button } from "@mui/material"
   import { styled } from "@mui/material/styles"
   ```

2. **Benefits of this approach**:

   - Ensures the "use client" directive is applied consistently
   - Creates a single place to manage MUI version changes
   - Provides a clear inventory of which MUI components are used
   - Prevents duplicate imports across the codebase

3. **Missing components or types**:
   - If a component or type you need isn't exported from `@repo/ui/mui`,
     add it to the mui-components.tsx file rather than importing directly.
