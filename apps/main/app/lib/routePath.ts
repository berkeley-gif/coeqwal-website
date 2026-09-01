/**
 * routePath - pure helpers for comparing App Router pathnames.
 *
 * The static export emits directory-style pages (`trailingSlash: true`), so
 * the browser URL, and with it `usePathname()`, can carry a trailing slash
 * ("/explore/") where component code compares string literals ("/explore").
 * Normalize before comparing. Pure module: no React, no side effects.
 *
 * Exports:
 *  - `normalizePathname` for equality checks against literal routes
 *  - `lastPathSegment` for reading the route segment out of a pathname
 */

/** "/explore/" -> "/explore"; "/" stays "/". */
export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const trimmed = pathname.replace(/\/+$/, "")
    return trimmed === "" ? "/" : trimmed
  }
  return pathname
}

/** Last non-empty segment ("/explore/" -> "explore"), or null at the root. */
export function lastPathSegment(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean)
  return segments.length > 0 ? (segments[segments.length - 1] ?? null) : null
}
