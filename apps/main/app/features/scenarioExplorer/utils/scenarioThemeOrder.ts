/**
 * When scenario rows are in display order, each theme should form a single
 * contiguous block. Search, sort, pin, and filters can interleave themes;
 * in that case theme subheaders are misleading, so the UI should show
 * inline theme badges instead.
 */
const THEME_KEY = (theme: string | null | undefined) => theme ?? "__none__"

export function areThemeGroupsContiguous(
  scenarios: { theme?: string | null }[],
): boolean {
  if (scenarios.length <= 1) return true
  let current = THEME_KEY(scenarios[0]?.theme)
  const closed = new Set<string>()

  for (let i = 1; i < scenarios.length; i++) {
    const t = THEME_KEY(scenarios[i]?.theme)
    if (t === current) continue
    if (closed.has(t)) return false
    closed.add(current)
    current = t
  }
  return true
}
