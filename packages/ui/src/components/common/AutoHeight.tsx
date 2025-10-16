"use client"

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
      style={{ height: h }}
      animate={{ height: h }}
      transition={transition}
      className={className}
    >
      <div ref={wrapRef}>{children}</div>
    </motion.div>
  )
}
