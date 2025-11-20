# Floating Glossary Component

A standalone glossary component that provides easy access to term definitions throughout the application.

## Overview

The Floating Glossary is an alternative implementation to the drawer-based glossary, designed to be more accessible and always visible to users. It consists of:

1. **Floating Button**: A black circular button fixed in the bottom-right corner with an open book icon
2. **Sliding Panel**: A side panel that slides in from the right, taking up 1/3 of the viewport width
3. **Interactive Content**: Full glossary with term linking and smooth scrolling

## Architecture

### Components

```
FloatingGlossary/
├── FloatingGlossary.tsx          # Main component managing state
├── FloatingGlossaryButton.tsx    # Floating circular button
├── FloatingGlossaryPanel.tsx     # Sliding panel with content
├── index.tsx                      # Exports
└── README.md                      # This file
```

### Component Structure

```typescript
FloatingGlossary (main)
├── FloatingGlossaryButton (button in bottom right)
└── FloatingGlossaryPanel (sliding panel + backdrop)
    ├── Header (with close button)
    └── Content (scrollable glossary terms)
```

### Data Source

Uses `glossaryTerms` from `apps/main/app/lib/glossary.tsx`. The glossary data lives in the main app rather than the UI package, as it's application-specific content rather than reusable UI code.

## Features

### 1. Floating Button

- **Position**: Fixed to bottom-right corner (32px from edges)
- **Size**: 64x64px circular button
- **Icon**: Open book (MenuBookIcon from MUI)
- **Behavior**:
  - Scales up on hover (1.1x)
  - Scales down on click (0.95x)
  - Fades out when panel is open
- **Styling**: Black background (#000), white icon, prominent shadow

### 2. Sliding Panel

- **Width**: 1/3 of viewport (33.333vw)
- **Constraints**:
  - Minimum width: 400px
  - Maximum width: 600px
- **Animation**: Smooth slide-in from right (300ms ease)
- **Structure**:
  - Sticky header with title and close button
  - Scrollable content area
  - Full-height panel with proper overflow handling

### 3. Interactive Features

- **Term Highlighting**: Selected terms are highlighted with blue background and border
- **Term Linking**: Terms mentioned in definitions are clickable and navigate to that term
- **Smooth Scrolling**: Animated scroll to selected terms
- **Backdrop**: Semi-transparent overlay that closes panel when clicked
- **Icons**: Each term displays its associated icon
- **Tiers**: Terms with tier information display colored tier badges
- **See Also Links**: Related terms are clickable

## Usage

### Basic Implementation

The component is mounted at the app level in `page.tsx`:

```tsx
import { FloatingGlossary } from "./components/FloatingGlossary"

export default function Home() {
  return (
    <>
      <FloatingGlossary />
      {/* Rest of your app */}
    </>
  )
}
```

### With Selected Term

You can optionally pass a selected term to auto-scroll to when opened:

```tsx
<FloatingGlossary selectedTerm="CalSim" />
```

## Styling Details

### Theme Integration

- Uses theme values for:
  - Colors: `theme.palette.blue.*`, `theme.palette.divider`
  - Border radius: `theme.borderRadius.card`
  - Z-index: `theme.zIndex.drawer - 1` (just below drawer)
- Responsive to theme changes

### Z-Index Hierarchy

```
Backdrop:        theme.zIndex.drawer - 2  (below panel)
Panel:           theme.zIndex.drawer - 1  (just below drawer)
Floating Button: theme.zIndex.drawer - 1  (same as panel)
```

### Animations

- Panel slide: 300ms ease transform
- Backdrop fade: 300ms ease opacity
- Button hover: 300ms ease transform + scale
- Scroll: Smooth behavior with 20px margin

## Comparison with Existing Glossary

| Feature         | Drawer Glossary            | Floating Glossary                |
| --------------- | -------------------------- | -------------------------------- |
| **Access**      | Via header navigation      | Floating button (always visible) |
| **Position**    | Slides from left           | Slides from right                |
| **Width**       | Fixed theme width          | 1/3 viewport (responsive)        |
| **State**       | Drawer store (Zustand)     | Local component state            |
| **Integration** | Part of MultiDrawer system | Standalone component             |
| **Data**        | `glossaryTerms`            | `glossaryTerms` (same)           |
| **Persistence** | Keep for reference         | New implementation               |

## Technical Decisions

### Why Standalone State?

- **Simplicity**: Self-contained, no dependency on drawer store
- **Independence**: Can coexist with existing glossary
- **Flexibility**: Easy to move, remove, or modify

### Why Right-Side Panel?

- **Visual Balance**: Drawer glossary is left-aligned
- **Spatial Logic**: Button is right-aligned
- **User Expectation**: Button proximity to panel origin

### Why 1/3 Viewport Width?

- **Readability**: Sufficient width for term definitions
- **Context**: Doesn't overwhelm main content
- **Responsive**: Scales with viewport but has min/max constraints

## Future Enhancements

Potential improvements:

- [ ] Keyboard shortcuts (e.g., 'G' to toggle)
- [ ] Search/filter functionality
- [ ] Term categories/sections
- [ ] Analytics tracking for popular terms
- [ ] Mobile-responsive behavior (full width on small screens)
- [ ] Animation variants (fade, scale, etc.)
- [ ] Custom positioning (left, top, etc.)

## Testing Checklist

When testing this component, verify:

- [ ] Button appears in bottom-right corner
- [ ] Panel slides in smoothly when button is clicked
- [ ] Backdrop appears and closes panel when clicked
- [ ] Close button in header works
- [ ] Terms are scrollable
- [ ] Term linking works (clicking terms in definitions)
- [ ] Selected term highlighting works
- [ ] Smooth scroll to terms works
- [ ] Icons display correctly
- [ ] Tier information renders properly
- [ ] See Also links are clickable
- [ ] Button fades out when panel is open
- [ ] No z-index conflicts with other UI elements
- [ ] Responsive width behavior works

## Notes

- The existing drawer-based glossary is **preserved and untouched**
- Both glossaries use the same data source (`glossaryTerms`)
- The floating glossary is completely independent and can be easily removed
- The component is client-side only (`"use client"`)
