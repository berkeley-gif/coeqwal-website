# Tooltips

Shared tooltip and popover components. Import them from `@repo/ui`.

The goal is a small set of pieces so you do not have to reinvent positioning or styling. Pick a component by what the user does (hover vs click) and what the content is (a short label vs rich content).

## Which one do I use?

| Need | Use |
| --- | --- |
| A short hint on hover (button labels, icon meanings) | `HoverTip` with `compact` |
| A longer hover hint (a sentence or two) | `HoverTip` |
| Click to open rich content with a close button | `InfoPopover` |
| Hover on desktop, tap to open on touch screens | `HybridTooltip` |
| A description with optional action buttons | `InfoTooltip` |

## Components

### HoverTip

Hover to show, move away to hide. A thin wrapper over MUI Tooltip, styled from `tooltipSurface`. Pass `compact` for short single-line labels (tighter padding, auto width); leave it off for richer hints.

```tsx
<HoverTip content="Download as PNG" compact>
  <IconButton>...</IconButton>
</HoverTip>
```

### InfoPopover

Click a trigger to open rich content next to it, with a close button. Handles positioning, the arrow, and a centered mobile-modal fallback (below the `sm` breakpoint) via `AnchoredPortal`. Works uncontrolled (clicks toggle it) or controlled (pass `open` and `onClose`).

```tsx
<InfoPopover
  open={open}
  onClose={() => setOpen(false)}
  placement="left"
  content={<RichContent />}
>
  <button onClick={() => setOpen(true)}>Info</button>
</InfoPopover>
```

### HybridTooltip

Renders `HoverTip` on pointer devices and `InfoPopover` on touch screens. Use it when hover suits desktop but touch users need an explicit tap.

### InfoTooltip

A description plus optional action buttons, built on `HybridTooltip`.

## Foundations

You usually do not touch these directly. Reach for them only when the four components above do not fit and you are building a new tooltip-like or popover-like component. Use `AnchoredPortal` so you do not re-implement Popper placement, the arrow, or the mobile-modal fallback. Use `tooltipSurface` so the look matches; use `useDisclosure` for open/close state.

- `tooltipSurface(theme, options?)` returns the shared look (background, border, radius, shadow, padding, text). Pass `compact` for tight padding or `elevated` for a stronger shadow.
- `useDisclosure(options?)` is open/close state with opt-in close-on-scroll and close-on-Escape. Returns `isOpen`, `onOpen`, `onClose`, `onToggle`, `setOpen`.
- `AnchoredPortal` positions content next to an element: a desktop MUI Popper with a dynamic arrow, and a mobile-modal fallback. `InfoPopover` is built on it.
- `TooltipCloseButton` is the shared close button used inside popovers.

## Separate tooltip relatives to these tooltips

These solve different problems and keep their own implementations:

- Map hover: `MapFeatureTooltip` (apps/main) renders a maplibre `Popup` anchored to geographic coordinates, not a DOM element.
- Guided tour: the tour card under `scenarioExplorer/.../tour` has its own runner for step sequencing and focus management.
- Scroll tutorial: `ScrollTooltip` (apps/main) is driven by scroll position and Framer Motion. It borrows `tooltipSurface` for its look but is not a general tooltip.
- Form popovers and menus: MUI `Popover` and `Menu` (for example in the resilience and equity panels) are pickers, not tooltips.
