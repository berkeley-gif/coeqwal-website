/**
 * useWhichScrollSection — Tracks which section is currently being read
 * within a scrollable container.
 *
 * Strategy: on every scroll event, find the section whose top is
 * closest to (but not past) the top of the container.
 */

"use client"

import { useEffect, useState, useRef } from "react"

export function useWhichScrollSection(
  sectionIds: string[],
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] as string)
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId

  useEffect(() => {
    const container = containerRef.current
    if (!container || sectionIds.length === 0) return
    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top

      const sectionPositions = sectionIds
        .map((id) => {
          const el = container.querySelector(`#${id}`)
          if (!el) return null
          const rect = el.getBoundingClientRect()
          return { id, top: rect.top - containerTop }
        })
        .filter(Boolean) as { id: string; top: number }[]

      // Detect if user has scrolled to the bottom of the container
      // scrollHeight - scrollTop - clientHeight < threshold means near bottom
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        50

      let newId: string

      if (isNearBottom) {
        // Force last section active when near bottom —
        // handles short sections that never reach the top threshold
        newId = sectionIds[sectionIds.length - 1] ?? sectionIds[0] ?? ""
      } else {
        const active = sectionPositions.filter((s) => s.top <= 80).at(-1)
        newId = active?.id ?? sectionIds[0] ?? ""
      }

      if (newId !== activeIdRef.current) {
        setActiveId(newId)
        activeIdRef.current = newId
      }
    }
    container.addEventListener("scroll", handleScroll, { passive: true })
    // Run once on mount to set initial state
    handleScroll()

    return () => container.removeEventListener("scroll", handleScroll)
  }, [sectionIds, containerRef])

  // Reset to empty when theme changes
  useEffect(() => {
    setActiveId(sectionIds[0] ?? "")
  }, [sectionIds])

  return activeId
}
