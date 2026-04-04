# @repo/scrollytelling

Composable scroll-linked animation primitives for the COEQWAL website. Built on [Framer Motion](https://www.framer.com/motion/) via `@repo/motion`.

## Quick start

```tsx
import {
  ScrollSection,
  ScrollElement,
  StickyElement,
} from "@repo/scrollytelling"

function MyScrollStory() {
  return (
    <ScrollSection height="200vh" id="intro">
      <StickyElement top="15vh">
        <h1>This headline stays pinned</h1>
      </StickyElement>
      <ScrollElement enter={[0.3, 0.5]} hold={[0.5, 0.7]} exit={[0.7, 0.9]}>
        <p>This paragraph fades in, holds, and fades out</p>
      </ScrollElement>
    </ScrollSection>
  )
}
```

## How it works

```
Scroll progress: 0 ──────────────────────────── 1

                 ┌─ enter ─┐┌── hold ──┐┌─ exit ─┐
Opacity:    0    ▁▁▁▁▁▁▄▄▄█████████████▄▄▄▁▁▁▁▁▁    0
                 │         ││           ││         │
                 0.1     0.3│         0.7│       0.9
                            0.3         0.7
```

A **ScrollSection** tracks scroll progress (0-1) through its height. Its children (**ScrollElement**, **StickyElement**) react to that progress.

- **enter**: element animates from invisible to visible
- **hold**: element stays fully visible
- **exit**: element animates from visible to invisible

## API

### Components

#### `<ScrollSection>`

Container that tracks scroll progress and provides it to children via React Context.

| Prop        | Type                | Default                      | Description                 |
| ----------- | ------------------- | ---------------------------- | --------------------------- |
| `height`    | `string`            | `"100vh"`                    | Total scroll distance       |
| `as`        | `React.ElementType` | `"section"`                  | HTML element to render      |
| `offset`    | `[string, string]`  | `["start start", "end end"]` | Framer Motion scroll offset |
| `debug`     | `boolean`           | `false`                      | Show progress overlay       |
| `id`        | `string`            | .                            | Section ID                  |
| `ariaLabel` | `string`            | .                            | Accessible label            |

#### `<ScrollElement>`

Animated child that responds to parent section's scroll progress.

| Prop        | Type                                           | Default        | Description                    |
| ----------- | ---------------------------------------------- | -------------- | ------------------------------ |
| `enter`     | `[number, number]`                             | **(required)** | Progress range for fade-in     |
| `hold`      | `[number, number]`                             | .              | Progress range to stay visible |
| `exit`      | `[number, number]`                             | .              | Progress range for fade-out    |
| `animation` | `"fade" \| "slideUp" \| "slideLeft" \| "none"` | `"fade"`       | Animation type                 |

#### `<StickyElement>`

CSS sticky wrapper that pins content during scroll.

| Prop     | Type               | Default | Description       |
| -------- | ------------------ | ------- | ----------------- |
| `top`    | `string \| number` | `0`     | Sticky top offset |
| `zIndex` | `number`           | `1`     | Stacking order    |

### Hooks

#### `useScrollProgress(ref?, options?)`

Core primitive. Returns a `MotionValue<number>` (0-1) tracking scroll progress.

```tsx
// With a ref
const sectionRef = useRef(null)
const progress = useScrollProgress(sectionRef)

// Inside a ScrollSection (uses context automatically)
const progress = useScrollProgress()
```

#### `useScrollPhase(progress, thresholds)`

Returns current phase and sub-progress within it.

```tsx
const { phase, phaseProgress } = useScrollPhase(progress, {
  enter: [0, 0.3],
  hold: [0.3, 0.7],
  exit: [0.7, 1],
})
// phase: "before" | "enter" | "hold" | "exit" | "after"
// phaseProgress: 0-1 within the current phase
```

#### `useScrollValue(progress, inputRange, outputRange)`

Map progress to any animated value.

```tsx
const opacity = useScrollValue(progress, [0.2, 0.4], [0, 1])
const y = useScrollValue(progress, [0, 0.3], [100, 0])
```

## WCAG compliance

All animations respect `prefers-reduced-motion`:

- `ScrollElement` renders at final state without animation
- `useScrollProgress` still tracks progress for non-visual logic
- `StickyElement` works without animation (CSS only)

## Examples

### Sticky headline with fading paragraph

```tsx
<ScrollSection height="200vh">
  <StickyElement top="140px">
    <h1>Headline pins at top</h1>
  </StickyElement>
  <ScrollElement
    enter={[0.3, 0.5]}
    hold={[0.5, 0.8]}
    animation="slideUp"
    style={{ marginTop: "100vh" }}
  >
    <p>Paragraph slides up and holds</p>
  </ScrollElement>
</ScrollSection>
```

### Sequential fade-in panels

```tsx
<ScrollSection height="300vh">
  <ScrollElement enter={[0.05, 0.2]} hold={[0.2, 0.35]} exit={[0.35, 0.4]}>
    <Panel>First panel</Panel>
  </ScrollElement>
  <ScrollElement enter={[0.35, 0.5]} hold={[0.5, 0.65]} exit={[0.65, 0.7]}>
    <Panel>Second panel</Panel>
  </ScrollElement>
  <ScrollElement enter={[0.65, 0.8]} hold={[0.8, 0.95]}>
    <Panel>Third panel (no exit)</Panel>
  </ScrollElement>
</ScrollSection>
```

### Custom hook usage

```tsx
function CustomScrollEffect() {
  const sectionRef = useRef(null)
  const progress = useScrollProgress(sectionRef)
  const { phase } = useScrollPhase(progress, {
    enter: [0, 0.4],
    hold: [0.4, 0.6],
    exit: [0.6, 1],
  })
  const rotation = useScrollValue(progress, [0, 1], [0, 360])

  return (
    <div ref={sectionRef} style={{ height: "200vh" }}>
      <motion.div style={{ rotate: rotation }}>Phase: {phase}</motion.div>
    </div>
  )
}
```

## Migration from existing patterns

| Existing pattern                                | Scrollytelling equivalent                                           |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| Manual `useScroll` + `useTransform` for opacity | `<ScrollElement enter={...}>`                                       |
| CSS `position: sticky` in a tall container      | `<StickyElement top={...}>` inside `<ScrollSection height="200vh">` |
| `IntersectionObserver` for visibility toggle    | `useScrollPhase` with `phase === "hold"`                            |
| `react-scrollama` step detection                | `useScrollPhase` with multiple threshold configs                    |
| `useScrollOpacity` from `@repo/motion`          | `useScrollProgress` + `useScrollValue`                              |
