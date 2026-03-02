export {
  motion,
  useInView,
  useAnimation,
  AnimatePresence,
  useScroll,
  useTransform,
  MotionValue,
  useAnimationControls,
  useMotionValue,
  useMotionValueEvent,
  animate,
  useSpring,
  // WCAG 2.3.3: Reduced motion support
  MotionConfig,
  useReducedMotion,
  // Drag-to-reorder support
  Reorder,
  // Easing functions for use with useScrollValue / useTransform
  easeIn,
  easeOut,
  easeInOut,
  circIn,
  circOut,
  circInOut,
  backIn,
  backOut,
  backInOut,
  anticipate,
  cubicBezier,
} from "framer-motion"

export type { EasingFunction, EasingDefinition } from "framer-motion"

export { interpolate as FlubberInterpolate } from "flubber"
