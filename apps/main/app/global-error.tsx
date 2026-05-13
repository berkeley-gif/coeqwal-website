"use client"

/**
 * App-level (layout) error boundary
 *
 * Next.js App Router auto-mounts this file when an error is thrown
 * inside `app/layout.tsx` itself (theme registry, translation provider,
 * data provider, tabs provider, etc.), which is the case `error.tsx`
 * cannot recover because the layout has not finished mounting.
 *
 * Special requirements (per Next.js docs):
 *   - Must be a Client Component (`"use client"`).
 *   - Must render its own `<html>` and `<body>` because it replaces the
 *     entire root layout when it activates.
 *   - Cannot rely on app-level providers (theme, i18n, MUI). Styling is
 *     plain inline CSS so it renders even when the rest of the tree
 *     fails to mount.
 *
 * For per-segment errors (failures inside `page.tsx` or its children
 * while the layout is still healthy) see `app/error.tsx`.
 */

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          color: "#1a1a1a",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                margin: "0 0 12px",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              The page failed to load. Please try again, or refresh the browser
              if the problem persists.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                padding: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: "#1a1a1a",
                backgroundColor: "transparent",
                border: "1px solid #1a1a1a",
                borderRadius: "4px",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
