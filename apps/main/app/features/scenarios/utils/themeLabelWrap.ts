/**
 * Labels longer than this use normal wrapping in ScenarioBadge instead of
 * single-line ellipsis. Keeps a single place to adjust when copy changes.
 * (E.g. "Rivers, salmon and the Delta ecosystem" is the only such row label
 * in THEME_LABEL_CONFIG today at 38 characters.)
 */
export const THEME_BADGE_WRAP_LENGTH_THRESHOLD = 32

export function shouldWrapThemeBadgeLabel(label: string | undefined): boolean {
  if (label == null || label.length === 0) return false
  return label.length > THEME_BADGE_WRAP_LENGTH_THRESHOLD
}
