"use client"

/**
 * Global Error Boundary
 *
 * Next.js App Router automatically uses this file to catch
 * unhandled errors in the route segment and its children.
 */

import { ErrorFallback } from "@repo/ui"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ErrorFallback
        title="Something went wrong"
        message="We've encountered an unexpected error. Please try again."
        onRetry={reset}
      />
    </div>
  )
}
