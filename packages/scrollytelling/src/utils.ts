import type { ProgressRange, ScrollPhase, PhaseThresholds } from "./types"

/**
 * Determine which phase a progress value falls into.
 */
export function getPhase(
  progress: number,
  thresholds: PhaseThresholds,
): ScrollPhase {
  const { enter, hold, exit } = thresholds

  if (progress < enter[0]) return "before"
  if (progress >= enter[0] && progress <= enter[1]) return "enter"
  if (hold && progress > hold[0] && progress <= hold[1]) return "hold"
  if (exit && progress > exit[0] && progress <= exit[1]) return "exit"
  if (exit && progress > exit[1]) return "after"
  if (!exit && hold && progress > hold[1]) return "after"
  if (!exit && !hold && progress > enter[1]) return "after"

  return "hold"
}

/**
 * Calculate sub-progress (0-1) within a given range.
 */
export function getSubProgress(progress: number, range: ProgressRange): number {
  const [start, end] = range
  if (end === start) return progress >= start ? 1 : 0
  return Math.max(0, Math.min(1, (progress - start) / (end - start)))
}
