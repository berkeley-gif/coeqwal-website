// Components
export { ScrollSection, ScrollSectionContext } from "./components/ScrollSection"
export { ScrollElement } from "./components/ScrollElement"
export { StickyElement } from "./components/StickyElement"

// Hooks
export { useScrollProgress } from "./hooks/useScrollProgress"
export { useScrollPhase } from "./hooks/useScrollPhase"
export { useScrollValue, useScrollString } from "./hooks/useScrollValue"

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
