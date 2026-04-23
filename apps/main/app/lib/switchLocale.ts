/**
 * switchLocale - Shared utility for locale switching in a static export app.
 */
export function switchLocale(pathname: string, newLocale: string) {
  const segments = pathname.split("/")
  segments[1] = newLocale
  window.location.href = segments.join("/")
}