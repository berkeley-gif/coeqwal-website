"use client"

import { Box, Typography } from "@repo/ui/mui"
import { useViewState } from "@repo/state/map"

export default function MapStateDisplay() {
  const viewState = useViewState()

  return (
    <Box
      sx={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        color: "white",
        padding: 2,
        borderRadius: 1,
        maxWidth: 300,
        fontSize: 12,
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontSize: 14 }}>
        Map State
      </Typography>
      <pre style={{ margin: 0, fontSize: 11 }}>
        {JSON.stringify(viewState, null, 2)}
      </pre>
    </Box>
  )
}
