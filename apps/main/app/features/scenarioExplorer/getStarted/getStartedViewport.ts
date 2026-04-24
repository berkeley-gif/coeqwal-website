/**
 * Default height for get-started map and panel cards: the viewport minus
 * the sticky header stack and a fixed breathing margin. This matches
 * `GetStartedPanelShell` default `minHeight` and the tier map panel
 * so the map overlay and shell cards share one layout rule.
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
 */
export function getStartedViewportCardHeightCss(theme: LayoutSlice) {
  return `calc(100vh - ${
    stickyStackOffsetPx(theme) + GET_STARTED_PANEL_BREATHING_PX
  }px)`
}
