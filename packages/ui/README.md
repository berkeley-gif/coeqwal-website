# UI Component Library

This package contains shared UI components, comprehensive theme system, and design standards for COEQWAL applications.

## Theme system

Our theme system provides a complete design foundation built on MUI with branding, standardized spacing, typography, and component styling.

### Import patterns

- `@repo/ui/themes` - Theme Registry and theme configuration
- `@repo/ui` - Custom COEQWAL components
- `@repo/ui/mui` - MUI components and icons

### Quick start

```typescript
// Theme Registry for wrapping your app
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"

// Theme object for accessing values
import theme from "@repo/ui/themes/theme"
```

## Typography system

### Font families

- **Display text (h3, h5, h6)**: Neue Haas Display
- **Body & UI text**: Neue Haas Text

### Typography scale

TBD

### Compact UI typography

For dialogs, tooltips, and form controls:

- **compact.title**: 0.9rem - Dialog titles
- **compact.subtitle**: 0.8rem - Dialog subtitles
- **compact.caption**: 0.75rem - Form labels
- **compact.micro**: 0.7rem - Helper text

## Spacing & layout

### Standard spacing

Uses MUI's 8px base unit system with theme-specific additions.

### Compact spacing

For UI elements requiring tighter spacing:

- **xs**: 2px - Micro spacing
- **sm**: 4px - Tight spacing
- **md**: 8px - Compact spacing
- **lg**: 12px - Medium compact
- **xl**: 16px - Standard compact

## Color system

### Palette

- **Brand**: Sky blue and water blue gradients
- **Blue**: 5-step scale from darkest navy to light blue
- **Accent**: Gold and warm highlights
- **Nature**: Teal, sage, mint, and forest greens
- **Utility**: Black and white
- **Ambient**: Translucent ripple effects

### Specialized colors

- **Categories**: 12 distinct colors for operation categories
- **Tiers**: 4-tier outcome colors (green, blue, orange, red)
- **Interactive**: Hover and selection states

## Component system

### Z-Index system

Organized layering system prevents stacking conflicts:

- **Background** (-1): Maps, section backgrounds
- **Content** (0-99): Panels, main content
- **Interactive** (1000-1199): Map controls, floating elements
- **Navigation** (1200-1499): Drawers, modals, app bar
- **System** (1500+): Tooltips, notifications, debug

### Border & shadows

- **Border Radius**: pill, rounded, card, standard, none
- **Border Styles**: standard, thin, thick variations
- **Shadows**: Minimal shadow system

## Usage examples

### Accessing theme values

```typescript
// Typography
sx={{ fontSize: theme.typography.compact.title }}

// Spacing
sx={{ margin: theme.spacing(theme.cards.spacing.compact.sm) }}

// Colors
sx={{ color: theme.palette.blue.darkest }}

// Z-index
sx={{ zIndex: theme.zIndex.tooltip }}
```

## 📚 Detailed Documentation

The theme file (`src/themes/theme.tsx`) contains comprehensive documentation including:

- **Complete color specifications** with hex values
- **Typography scale ratios** and font family assignments
- **Spacing system details** with pixel equivalents
- **Z-index layering guide** with usage patterns

Refer to the theme file for specific values, implementation details, and advanced usage patterns.

## Component Imports

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

#### Custom components

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
