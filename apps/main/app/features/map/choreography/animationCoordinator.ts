/**
 * AnimationCoordinator - centralized management for map animations
 */

import type { RefObject } from "react"
import type { MapboxGLMap, MapRef } from "@repo/map"

type AnimationId = string
type CleanupFn = () => void

interface AnimationState {
  frameId: number | null
  cleanup?: CleanupFn
  startTime: number
}

interface StartOptions {
  duration?: number
  onComplete?: () => void
  onCancel?: () => void
}

class AnimationCoordinator {
  private animations = new Map<AnimationId, AnimationState>()

  /**
   * Start an animation. Automatically cancels any existing animation with same ID.
   * @param id Unique identifier for this animation
   * @param animateFn Function called each frame. Receives (timestamp, elapsed). Return false to stop.
   * @param options Optional duration, onComplete, onCancel callbacks
   */
  start(
    id: AnimationId,
    animateFn: (frame: number, elapsed: number) => boolean,
    options?: StartOptions,
  ): void {
    this.cancel(id) // Cancel existing animation with this ID

    const startTime = performance.now()
    const state: AnimationState = { frameId: null, startTime }

    const tick = (now: number) => {
      const elapsed = now - startTime

      // Check if animation was cancelled
      if (!this.animations.has(id)) {
        options?.onCancel?.()
        return
      }

      // Check duration limit
      if (options?.duration && elapsed >= options.duration) {
        this.animations.delete(id)
        options?.onComplete?.()
        return
      }

      // Run animation frame - catch any errors to prevent crashes
      let shouldContinue = false
      try {
        shouldContinue = animateFn(now, elapsed)
      } catch (e) {
        console.warn(`[AnimationCoordinator] Animation ${id} error:`, e)
        shouldContinue = false
      }

      if (shouldContinue) {
        state.frameId = requestAnimationFrame(tick)
        this.animations.set(id, state)
      } else {
        this.animations.delete(id)
        options?.onComplete?.()
      }
    }

    state.frameId = requestAnimationFrame(tick)
    this.animations.set(id, state)
  }

  /**
   * Cancel a specific animation by ID
   */
  private cancel(id: AnimationId): void {
    const state = this.animations.get(id)
    if (state) {
      if (state.frameId) cancelAnimationFrame(state.frameId)
      state.cleanup?.()
      this.animations.delete(id)
    }
  }

  /**
   * Cancel all animations matching a prefix
   * e.g., cancelGroup("layer-") cancels all layer animations
   */
  cancelGroup(prefix: string): void {
    for (const id of this.animations.keys()) {
      if (id.startsWith(prefix)) {
        this.cancel(id)
      }
    }
  }

  /**
   * Get a fresh, valid map instance or null.
   * Safely handles cases where map is unmounted or invalid.
   */
  getValidMap(
    mapRef: RefObject<MapRef | null> | null,
  ): MapboxGLMap | null {
    try {
      const instance = mapRef?.current?.getMap?.()
      if (instance && typeof instance.getLayer === "function") {
        return instance
      }
    } catch {
      // Map is invalid or unmounted
    }
    return null
  }

  /**
   * Safely check if a layer exists on the map
   */
  hasLayer(
    mapRef: RefObject<MapRef | null> | null,
    layerId: string,
  ): boolean {
    const map = this.getValidMap(mapRef)
    if (!map) return false
    try {
      return !!map.getLayer(layerId)
    } catch {
      return false
    }
  }
}

// Singleton instance - use this throughout the map components
export const coordinator = new AnimationCoordinator()
