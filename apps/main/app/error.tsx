"use client"

/**
 * Route-segment error boundary.
 *
 * Next.js App Router auto-mounts this file as a React error boundary
 * around the route segment's `page.tsx` and its children. It catches
 * unhandled errors thrown during render of the segment's content while
 * leaving the surrounding `layout.tsx` (Header, TabsProvider, theme,
 * translations) intact and interactive.
 *
 * For errors thrown inside `layout.tsx`, see `app/global-error.tsx`,
 * which replaces the entire document.
 */

import { ErrorFallback } from "@repo/ui"

export default function RouteSegmentError({
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
