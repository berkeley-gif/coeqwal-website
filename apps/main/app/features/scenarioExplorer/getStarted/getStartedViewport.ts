/**
 * getStartedViewport - a sizing helper. Computes CSS height value, so the content panels (PanelShell) and the tier animation (TierAnimationSection) share one layout rule.
 * 
 * Default height = the viewport minus
 * the sticky header stack and a fixed breathing margin. This matches
 * `panels/PanelShell` default `minHeight` and the tier map panel
 * so the map overlay and shell cards share one layout rule.
 * 
 * The formula is: 100vh - stickyStackOffsetPx - GET_STARTED_PANEL_BREATHING_PX
 * 
 */

export const GET_STARTED_PANEL_BREATHING_PX = 80

type LayoutSlice = {
  layout: { collapsedHeaderHeight: number; collapsedTabHeight: number }
}

function stickyStackOffsetPx(theme: LayoutSlice) {
  return (
    theme.layout.collapsedHeaderHeight + 2 * theme.layout.collapsedTabHeight
  )
}

/**
 * Returns a CSS `height` or `min-height` value, e.g.
 * `calc(100vh - 200px)`.
 *
 * `contentOverflowPx` adds pixels *beyond* the viewport-fits baseline,
 * so the panel deliberately extends below the fold. Used by the tier
 * animation(`TierAnimationSection`) whose left text column + right
 * overlay composition is taller than one viewport by necessity: the user
 * scrolls so the title + Play button park at the top of the visible
 * area, and the extra pixels hold the remaining content without
 * crowding. Defaults to 0 (strict viewport fit) for the standard
 * `panels/PanelShell` behavior.
 */
export function getStartedViewportCardHeightCss(
  theme: LayoutSlice,
  options: { contentOverflowPx?: number } = {},
) {
  const { contentOverflowPx = 0 } = options
  return `calc(100vh - ${
    stickyStackOffsetPx(theme) +
    GET_STARTED_PANEL_BREATHING_PX -
    contentOverflowPx
  }px)`
}
