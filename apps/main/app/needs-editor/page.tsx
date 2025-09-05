"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { Header } from "../components/Header"
import { ConnectedMultiDrawer } from "../components/ConnectedMultiDrawer"
import NeedsEditorPanel from "../features/needsEditor/components/NeedsEditorPanel"

export default function NeedsEditorPage() {
  const theme = useTheme()

  return (
    <>
      {/* Header */}
      <Header />

      {/* Side drawer */}
      <ConnectedMultiDrawer
        drawerWidth={theme.layout.drawer.width}
        overlay={true}
        showRailButtons={false}
      />

      {/* Main content wrapper */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          margin: 0,
          padding: 0,
          overflowX: "hidden",
          width: "100%",
          zIndex: (theme) => theme.zIndex.panels,
          pointerEvents: "auto",
        }}
      >
        <Box
          component="main"
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
            overflowX: "hidden",
            width: "100%",
            minHeight: "100vh",
            backgroundColor: (theme) => theme.palette.utility.white,
            color: (theme) => theme.palette.blue.darkest,
          }}
        >
          <NeedsEditorPanel />
        </Box>
      </Box>
    </>
  )
}
