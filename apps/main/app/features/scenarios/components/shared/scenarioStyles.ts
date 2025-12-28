/**
 * Shared scenario styles - used by both Learn and Explore views
 *
 * Uses theme tokens for consistency with the design system.
 */

import type { Theme } from "@repo/ui/mui"

/**
 * Get panel title typography styles
 * Used for section headers like "Key operations", "Key outcomes", etc.
 */
export const getScenarioPanelTitleStyles = (theme: Theme) => ({
  ...theme.typography.subtitle2,
  color: theme.palette.grey[900],
})
