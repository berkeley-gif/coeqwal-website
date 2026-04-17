/**
 * Explore shell passes `highlightedIds` while the user hovers the scenario
 * sidebar (or theme header rows). Charts should emphasize those IDs without
 * dimming user-selected scenarios in `chosenIds`.
 */

export function isFullOpacityDuringSidebarHighlight(
  scenarioId: string,
  highlightedIds: Set<string> | null | undefined,
  chosenIds: Set<string> | null | undefined,
): boolean {
  if (highlightedIds == null || highlightedIds.size === 0) return false
  return highlightedIds.has(scenarioId) || (chosenIds?.has(scenarioId) ?? false)
}
