"use client"

/**
 * StickyScrollSection - Sticky container with built-in scroll progress context
 *
 * Combines the common "tall spacer + sticky content" layout pattern with
 * ScrollSectionContext, so children can call useScrollProgress() with no
 * additional setup.
 *
 * The outer element acts as a scroll runway (controlled by `height`).
 * The inner element uses CSS `position: sticky` to pin children in place
 * while the user scrolls through the runway.
 *
 * Use the `overlap` prop to pull the next section closer visually without
 * reducing the scroll runway length.
 *
 * @example
 * <StickyScrollSection id="temperature" height="200vh">
 *   <MyVisualization />
 *   <MyText />
 * </StickyScrollSection>
 *
 * @example
 * // With overlap to reduce visual gap to next section
 * <StickyScrollSection height="300vh" overlap="30vh" stickyTop="10vh">
 *   <Content />
 * </StickyScrollSection>
 */

import React, { useRef, useState, useEffect } from "react"
import { useScroll } from "@repo/motion"
import type { ScrollOffset, ScrollSectionContextValue } from "../types"
import { ScrollSectionContext } from "./ScrollSection"

interface StickyScrollSectionProps {
  /** Scroll runway length.controls how long content stays pinned (default: "200vh") */
  height?: string
  /** CSS top offset for the sticky container (default: "0px") */
  stickyTop?: string | number
  /** Framer Motion scroll offset (default: ["start start", "end end"]) */
  offset?: ScrollOffset
  /**
   * Negative margin-bottom to pull the next section closer visually.
   * Accepts a CSS length string (e.g. "20vh", "100px"). Default: "0px".
   */
  overlap?: string
  /** Height of the sticky inner container (default: "100vh") */
  stickyHeight?: string
  /** Show debug overlay with progress value */
  debug?: boolean
  /** Section ID for navigation */
  id?: string
  /** Accessible label */
  ariaLabel?: string
  /** Additional inline styles for the outer container */
  style?: React.CSSProperties
  /** Additional inline styles for the sticky inner container */
  stickyStyle?: React.CSSProperties
  /** Additional class name for the outer container */
  className?: string
  /** Additional class name for the sticky inner container */
  stickyClassName?: string
  /** Children rendered inside the sticky container */
  children: React.ReactNode
}

export function StickyScrollSection({
  height = "200vh",
  stickyTop = "0px",
  offset = ["start start", "end end"],
  overlap = "0px",
  stickyHeight = "100vh",
  debug = false,
  id,
  ariaLabel,
  style,
  stickyStyle,
  className,
  stickyClassName,
  children,
}: StickyScrollSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [debugProgress, setDebugProgress] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset,
    layoutEffect: false,
  })

  useEffect(() => {
    if (!debug) return
    const unsubscribe = scrollYProgress.on("change", setDebugProgress)
    return unsubscribe
  }, [debug, scrollYProgress])

  const contextValue: ScrollSectionContextValue = {
    progress: scrollYProgress,
    sectionRef,
  }

  const resolvedTop =
    typeof stickyTop === "number" ? `${stickyTop}px` : stickyTop

  return (
    <ScrollSectionContext.Provider value={contextValue}>
      <section
        ref={sectionRef}
        id={id}
        aria-label={ariaLabel}
        className={className}
        style={{
          position: "relative",
          minHeight: height,
          marginBottom: overlap !== "0px" ? `-${overlap}` : undefined,
          ...style,
        }}
      >
        <div
          className={stickyClassName}
          style={{
            position: "sticky",
            top: resolvedTop,
            height: stickyHeight,
            overflow: "hidden",
            ...stickyStyle,
          }}
        >
          {children}
        </div>

        {debug && (
          <div
            style={{
              position: "fixed",
              top: 8,
              right: 8,
              background: "rgba(0,0,0,0.8)",
              color: "#0f0",
              fontFamily: "monospace",
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 4,
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            {id ? `${id}: ` : ""}
            {debugProgress.toFixed(3)}
          </div>
        )}
      </section>
    </ScrollSectionContext.Provider>
  )
}
