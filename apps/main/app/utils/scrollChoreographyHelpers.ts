/**
 * Utility functions for scroll choreography
 */

/**
 * Easing function: ease-out cubic
 * Creates a smooth deceleration effect
 */
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

/**
 * Calculate scroll progress through a panel
 *
 * @param rect - Panel element's bounding rectangle
 * @param viewportHeight - Height of the viewport
 * @returns Progress from 0 (panel entering viewport) to 1 (panel leaving viewport)
 */
export const calculateScrollProgress = (
  rect: DOMRect,
  viewportHeight: number,
): number => {
  return clamp(
    (viewportHeight - rect.top) / (viewportHeight + rect.height),
    0,
    1,
  )
}

/**
 * Check if an element is near or in the viewport (for optimization)
 */
export const isNearViewport = (
  rect: DOMRect,
  viewportHeight: number,
): boolean => {
  return rect.bottom > 0 && rect.top < viewportHeight
}

/**
 * Wait for an element to exist in the DOM
 *
 * @param elementId - ID of the element to wait for
 * @param callback - Function to call when element is found
 * @param checkInterval - How often to check (ms), default 100
 * @returns Interval ID for cleanup
 */
export const waitForElement = (
  elementId: string,
  callback: (element: HTMLElement) => void,
  checkInterval: number = 100,
): number => {
  const interval = window.setInterval(() => {
    const element = document.getElementById(elementId)
    if (element) {
      callback(element)
      clearInterval(interval)
    }
  }, checkInterval)

  return interval
}

/**
 * Determine which panel should be active based on viewport position
 *
 * @param panels - Sorted array of panels
 * @returns Position of the active panel
 */
export const determineActivePanel = (
  panels: Array<{ panelId: string; position: number }>,
): number => {
  const viewportMiddle = window.innerHeight / 2
  let activePanel = 0 // Default to first panel

  // Iterate from last to first to find the bottom-most panel that crosses viewport middle
  for (let i = panels.length - 1; i >= 0; i--) {
    const panel = panels[i]
    if (!panel) continue

    const panelElement = document.getElementById(panel.panelId)
    if (!panelElement) continue

    const rect = panelElement.getBoundingClientRect()

    // Panel is active if viewport middle is between panel top and bottom
    if (rect.top <= viewportMiddle && rect.bottom > viewportMiddle) {
      activePanel = panel.position
      break
    }
  }

  return activePanel
}
