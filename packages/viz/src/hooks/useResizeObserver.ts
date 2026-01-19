"use client"

import { useEffect, useState, useRef } from "react"

interface DimensionObject {
  width: number
  height: number
}

/**
 * A hook that observes the size of an element and returns its dimensions
 *
 * @param targetRef - The ref of the element to observe
 * @returns The dimensions of the observed element
 */
export function useResizeObserver<T extends HTMLElement>(
  targetRef: React.RefObject<T>,
): DimensionObject {
  const [dimensions, setDimensions] = useState<DimensionObject>({
    width: 0,
    height: 0,
  })

  // Use a refs to track the observer and the current element
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    // Create the observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) || !entries.length) return

      const entry = entries[0]
      if (!entry) return // Exit if entry is undefined

      // Get dimensions from content rect or bounding client rect
      let width, height

      if ("contentRect" in entry && entry.contentRect) {
        width = entry.contentRect.width
        height = entry.contentRect.height
      } else if (entry.target) {
        const rect = (entry.target as HTMLElement).getBoundingClientRect()
        width = rect.width
        height = rect.height
      } else {
        // Exit if we can't get dimensions
        return
      }

      setDimensions({ width, height })
    })

    // Store the observer reference
    observerRef.current = resizeObserver

    // Start observing
    if (targetRef.current) {
      resizeObserver.observe(targetRef.current)
    }

    // Get initial dimensions
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height,
      })
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect()
    }
  }, [targetRef])

  return dimensions
}
