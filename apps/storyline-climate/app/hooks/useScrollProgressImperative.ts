"use client"

import { useEffect, useRef, useState } from "react"

export function useScrollProgressImperative(containerRef: React.RefObject<HTMLElement>, initial: number = 0) {
  const rafRef = useRef<number | null>(null)
  const [progress, setProgress] = useState<number>(initial)

  useEffect(() => {
    const update = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const el = containerRef.current
        if (!el || typeof window === "undefined") return

        const rect = el.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const containerHeight = el.offsetHeight
        const scrollRange = containerHeight - windowHeight

        let p = 0
        if (scrollRange <= 0) {
          p = rect.top < 0 ? 1 : 0
        } else {
          p = -rect.top / scrollRange
          p = Math.max(0, Math.min(1, p))
        }

        setProgress(p)
      })
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)

    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [containerRef])

  return progress
}