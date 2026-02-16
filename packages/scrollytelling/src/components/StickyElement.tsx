"use client"

/**
 * StickyElement - CSS sticky wrapper within a ScrollSection
 *
 * Pins its children at a specified offset from the viewport top
 * while the parent ScrollSection is in view. When the section
 * scrolls past, the element un-sticks and scrolls away.
 *
 * Works best when the parent ScrollSection has a height greater
 * than 100vh to create scroll distance for the sticky effect.
 *
 * @example
 * <ScrollSection height="200vh">
 *   <StickyElement top="15vh">
 *     <h1>This headline stays pinned</h1>
 *   </StickyElement>
 * </ScrollSection>
 *
 * @example
 * // With custom z-index for layering
 * <StickyElement top={100} zIndex={10}>
 *   <nav>Sticky navigation</nav>
 * </StickyElement>
 */

import React from "react"

interface StickyElementProps {
  /** Top offset when sticky (CSS value or number in px) */
  top?: string | number
  /** Z-index for stacking (default: 1) */
  zIndex?: number
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Additional class name */
  className?: string
  /** Children */
  children: React.ReactNode
}

export function StickyElement({
  top = 0,
  zIndex = 1,
  style,
  className,
  children,
}: StickyElementProps) {
  return (
    <div
      className={className}
      style={{
        position: "sticky",
        top: typeof top === "number" ? `${top}px` : top,
        zIndex,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
