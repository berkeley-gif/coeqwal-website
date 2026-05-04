"use client"

/**
 * Capture-mode wrapper for ResilienceQuadrant. Forces interactive=false
 * so the cloned SVG carries no listeners, and disables the responsive
 * sizing so the off-screen mount honors the host dimensions exactly.
 */

import React from "react"
import ResilienceQuadrant, {
  type ResilienceQuadrantProps,
} from "./ResilienceQuadrant"

export type ResilienceQuadrantSnapshotProps = Omit<
  ResilienceQuadrantProps,
  "interactive" | "animate"
>

const ResilienceQuadrantSnapshot: React.FC<ResilienceQuadrantSnapshotProps> = (
  props,
) => {
  return <ResilienceQuadrant {...props} interactive={false} animate={false} />
}

ResilienceQuadrantSnapshot.displayName = "ResilienceQuadrantSnapshot"

export default ResilienceQuadrantSnapshot
