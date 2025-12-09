/**
 * Type declarations for react-scrollama
 * https://github.com/jsonkao/react-scrollama
 */

declare module "react-scrollama" {
  import { ReactNode } from "react"

  export interface StepEvent<T = unknown> {
    /** The data prop passed to the Step */
    data: T
    /** The scroll direction: "up" or "down" */
    direction: "up" | "down"
    /** The underlying IntersectionObserverEntry */
    entry: IntersectionObserverEntry
  }

  export interface StepProgressEvent<T = unknown> extends StepEvent<T> {
    /** Progress through the step, from 0 to 1 */
    progress: number
  }

  export interface ScrollamaProps<T = unknown> {
    /** Callback when a step enters the viewport */
    onStepEnter?: (response: StepEvent<T>) => void
    /** Callback when a step exits the viewport */
    onStepExit?: (response: StepEvent<T>) => void
    /** Callback for progress through a step (only for Steps with progress={true}) */
    onStepProgress?: (response: StepProgressEvent<T>) => void
    /** Offset from top of viewport where step triggers (0 to 1, default: 0.5) */
    offset?: number
    /** Enable debug mode (shows trigger line) */
    debug?: boolean
    /** Threshold for IntersectionObserver (default: 4) */
    threshold?: number
    /** Children (Step components) */
    children: ReactNode
  }

  export interface StepProps<T = unknown> {
    /** Data to pass to Scrollama callbacks */
    data?: T
    /** Enable progress tracking for this step */
    progress?: boolean
    /** Children to render inside the step */
    children: ReactNode
  }

  /**
   * Scrollama container component
   * Wraps Step components and provides scroll detection
   */
  export function Scrollama<T = unknown>(props: ScrollamaProps<T>): JSX.Element

  /**
   * Step component
   * Represents a single scrollytelling step
   */
  export function Step<T = unknown>(props: StepProps<T>): JSX.Element
}
