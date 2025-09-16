import { useEffect, useRef } from "react"
import useStoryStore from "../store"

type Options = {
  /** Return true when circle are missing and need a reload */
  needsReload?: () => boolean
  /** Reset when map unmounts */
  watchReady?: boolean
}

export function useSectionLifecycle(
  isSectionActive: boolean,
  init: () => void,
  load: () => void,
  unload: () => void,
  opts: Options = {},
) {
  const { needsReload, watchReady = true } = opts

  const initRef = useRef(init)
  const loadRef = useRef(load)
  const unloadRef = useRef(unload)

  const hasSeen = useRef(false)
  const prevActive = useRef(false)
  const isLoaded = useRef(false)

  const isMapReady = useStoryStore((s) => s.isMapReady)

  // keep latest fns
  useEffect(() => {
    initRef.current = init
    loadRef.current = load
    unloadRef.current = unload
  }, [init, load, unload])

  // reset when map not ready (optional)
  useEffect(() => {
    if (!watchReady) return
    if (!isMapReady) {
      hasSeen.current = false
      isLoaded.current = false
    }
  }, [isMapReady, watchReady])

  useEffect(() => {
    if (watchReady && !isMapReady) return

    const wasActive = prevActive.current
    const nowActive = isSectionActive

    // Rising edge: became active
    if (!wasActive && nowActive) {
      if (!hasSeen.current) {
        initRef.current()
        hasSeen.current = true
      }
      loadRef.current()
      isLoaded.current = true
    }

    // Falling edge: became inactive
    if (wasActive && !nowActive) {
      if (isLoaded.current) {
        unloadRef.current()
        isLoaded.current = false
      }
    }

    // if active but circle got cleared elsewhere
    if (nowActive && (!isLoaded.current || needsReload?.())) {
      loadRef.current()
      isLoaded.current = true
    }

    prevActive.current = nowActive
  }, [isSectionActive, isMapReady, needsReload, watchReady])
}
