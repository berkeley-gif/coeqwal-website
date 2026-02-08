/**
 * MainContent - Main content wrapper for the page
 *
 * This is a Server Component that provides the semantic <main> element
 * and establishes the visual stacking context for content above the map.
 *
 * Note: We inline the zIndex value (10) instead of using theme.zIndex.pageContent
 * to allow this to be a Server Component. This is a tradeoff between
 * using MUI and SSG optimization.
 */

import { Box } from "@repo/ui/mui"

export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="main"
      id="main-content"
      tabIndex={-1} // Allows keyboard focus to move here programmatically
      sx={{
        position: "relative",
        overflowX: "clip",
        overflowY: "visible",
        // Allow pointer events to pass through to the persistent map
        // Child components re-enable pointer events where needed
        pointerEvents: "none",
        // Above map level so content appears on top
        // Value from theme.zIndex.pageContent (inlined for Server Component)
        zIndex: 10,
        // Remove focus outline when skip link targets this element
        "&:focus": {
          outline: "none",
        },
      }}
    >
      {children}
    </Box>
  )
}
