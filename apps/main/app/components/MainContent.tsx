"use client"

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
        zIndex: (theme) => theme.zIndex.pageContent,
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
