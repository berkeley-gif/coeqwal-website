import { useEffect, useRef } from "react"
import useStoryStore from "../store"

export const useSectionLifecycle = (
  isSectionActive: boolean,
  init: () => void,
  load: () => void,
  unload: () => void,
) => {
  const hasSeen = useRef(false)
  const initRef = useRef(init)
  const loadRef = useRef(load)
  const unloadRef = useRef(unload)
  const isMapReady = useStoryStore((state) => state.isMapReady)

  // Update refs when functions change
  useEffect(() => {
    initRef.current = init
    loadRef.current = load
    unloadRef.current = unload
  }, [init, load, unload])

  useEffect(() => {
    if (!isMapReady) return
    if (isSectionActive) {
      if (!hasSeen.current) {
        console.log("initialize stuff")
        initRef.current()
        hasSeen.current = true
      }
      loadRef.current()
    } else if (hasSeen.current) {
      console.log("unload stuff")
      unloadRef.current()
    }
  }, [isSectionActive, isMapReady]) // Only depend on isSectionActive
}
