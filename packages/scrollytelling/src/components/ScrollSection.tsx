"use client"

/**
 * ScrollSection - Scroll-tracking container
 *
 * Sets position: relative and minHeight for the scroll runway
 * Runs useScroll with layoutEffect: false (SSR-safe)
 * Publishes scrollYProgress to React context for all children
 * Provides a scroll progress context (0-1) to all children.
 * Children can access progress via useScrollProgress() or the
 * ScrollElement/StickyElement components.
 *
 * @example
 * <ScrollSection height="200vh">
 *   <StickyElement top="15vh">
 *     <h1>Headline</h1>
 *   </StickyElement>
 *   <ScrollElement enter={[0.3, 0.5]} hold={[0.5, 0.7]}>
 *     <p>Paragraph fades in and holds</p>
 *   </ScrollElement>
 * </ScrollSection>
 */

import React, { createContext, useRef, useState, useEffect } from "react"
import { useScroll } from "@repo/motion"
import type { ScrollOffset, ScrollSectionContextValue } from "../types"

export const ScrollSectionContext =
  createContext<ScrollSectionContextValue | null>(null)

interface ScrollSectionProps {
  /** Total scroll distance (default: "100vh") */
  height?: string
  /** HTML element to render (default: "section") */
  as?: React.ElementType
  /** Framer Motion scroll offset (default: ["start start", "end end"]) */
  offset?: ScrollOffset
  /** Show debug overlay with progress value */
  debug?: boolean
  /** Section ID for navigation */
  id?: string
  /** Accessible label */
  ariaLabel?: string
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Additional class name */
  className?: string
  /** Children */
  children: React.ReactNode
}

export function ScrollSection({
  height = "100vh",
  as: Component = "section",
  offset = ["start start", "end end"],
  debug = false,
  id,
  ariaLabel,
  style,
  className,
  children,
}: ScrollSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [debugProgress, setDebugProgress] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset,
    layoutEffect: false,
  })

  // Debug overlay
  useEffect(() => {
    if (!debug) return
    const unsubscribe = scrollYProgress.on("change", setDebugProgress)
    return unsubscribe
  }, [debug, scrollYProgress])

  const contextValue: ScrollSectionContextValue = {
    progress: scrollYProgress,
    sectionRef,
  }

  return (
    <ScrollSectionContext.Provider value={contextValue}>
      <Component
        ref={sectionRef}
        id={id}
        aria-label={ariaLabel}
        className={className}
        style={{
          position: "relative",
          minHeight: height,
          ...style,
        }}
      >
        {children}

        {/* Debug overlay */}
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
      </Component>
    </ScrollSectionContext.Provider>
  )
}
