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
      if (!entry) return

      let width, height

      if ("contentRect" in entry && entry.contentRect) {
        width = Math.round(entry.contentRect.width)
        height = Math.round(entry.contentRect.height)
      } else if (entry.target) {
        const rect = (entry.target as HTMLElement).getBoundingClientRect()
        width = Math.round(rect.width)
        height = Math.round(rect.height)
      } else {
        return
      }

      setDimensions((prev) => {
        if (prev.width === width && prev.height === height) return prev
        return { width, height }
      })
    })

    // Store the observer reference
    observerRef.current = resizeObserver

    // Start observing
    if (targetRef.current) {
      resizeObserver.observe(targetRef.current)
    }

    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      setDimensions((prev) => {
        if (prev.width === w && prev.height === h) return prev
        return { width: w, height: h }
      })
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect()
    }
  }, [targetRef])

  return dimensions
}
