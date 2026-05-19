"use client"

import { ErrorBoundary } from "@repo/utils"
import { ErrorFallback } from "@repo/ui"
import type { ExploreMode } from "./store"

type ToolErrorBoundaryProps = {
  tool: ExploreMode
  children: React.ReactNode
}

/** Per-tool error boundary. Resets when exploreMode changes via key={tool}. */
export default function ToolErrorBoundary({
  tool,
  children,
}: ToolErrorBoundaryProps) {
  return (
    <ErrorBoundary
      key={tool}
      fallback={
        <ErrorFallback
          title="This tool couldn't load"
          message="Try a different tool above, or refresh the page."
        />
      }
    >
      {children}
    </ErrorBoundary>
  )
}
