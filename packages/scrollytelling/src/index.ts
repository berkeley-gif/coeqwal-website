// Components
export { ScrollSection, ScrollSectionContext } from "./components/ScrollSection"
export { ScrollElement } from "./components/ScrollElement"
export { StickyElement } from "./components/StickyElement"
export { StickyScrollSection } from "./components/StickyScrollSection"
export { ScrollReveal } from "./components/ScrollReveal"

// Hooks
export { useScrollProgress } from "./hooks/useScrollProgress"
export { useScrollPhase } from "./hooks/useScrollPhase"
export { useScrollValue, useScrollString } from "./hooks/useScrollValue"
export type { ScrollValueOptions } from "./hooks/useScrollValue"
export { usePanelBoundaries } from "./hooks/usePanelBoundaries"
export type { PanelBoundary, PanelBoundaries } from "./hooks/usePanelBoundaries"
export { useScrollSideEffect } from "./hooks/useScrollSideEffect"
export { useMeetingProgress } from "./hooks/useMeetingProgress"
export type {
  MeetingProgressOptions,
  ElementEdge,
} from "./hooks/useMeetingProgress"
export { useDockOffset } from "./hooks/useDockOffset"

// Types
export type {
  ProgressRange,
  ScrollPhase,
  PhaseThresholds,
  AnimationType,
  ScrollOffset,
  ScrollProgressOptions,
  ScrollSectionContextValue,
} from "./types"

// Utilities
export { getPhase, getSubProgress } from "./utils"

// Re-export commonly used Framer Motion primitives for convenience
export { useScroll, useTransform, useMotionValue } from "@repo/motion"

// Easing functions for use with useScrollValue
export {
  easeIn,
  easeOut,
  easeInOut,
  circIn,
  circOut,
  backIn,
  backOut,
  anticipate,
  cubicBezier,
} from "@repo/motion"
