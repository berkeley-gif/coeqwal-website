"use client"

/**
 * AutoHeight - Container that animates height changes
 *
 * Wraps content and smoothly animates when the content height changes.
 * Useful for expandable sections and accordions.
 */

import React, { useLayoutEffect, useRef, useState } from "react"
import { motion } from "@repo/motion"

export default function AutoHeight({
  children,
  transition = { type: "spring", stiffness: 280, damping: 30 },
  className,
}: {
  children: React.ReactNode
  transition?: object
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [h, setH] = useState<number | "auto">("auto")

  useLayoutEffect(() => {
    const el = wrapRef.current

    if (!el) return
    setH(el.scrollHeight)

    const ro = new ResizeObserver(() => setH(el.scrollHeight))
    ro.observe(el)

    return () => ro.disconnect()
  }, [])

  return (
    <motion.div
      style={{ height: h, pointerEvents: "inherit" }}
      animate={{ height: h }}
      transition={transition}
      className={className}
    >
      <div ref={wrapRef} style={{ pointerEvents: "inherit" }}>
        {children}
      </div>
    </motion.div>
  )
}
