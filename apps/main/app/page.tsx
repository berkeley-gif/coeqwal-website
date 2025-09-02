"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { Header } from "./components/Header"
import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
// import MapPanel from "./sections/MapPanel"
import ScenarioExplorer from "./features/scenarioExplorer/ScenarioExplorer"

export default function Home() {
  const theme = useTheme()

  return (
    <>
      {/* Header */}
      <Header />

      {/* Side drawer */}
      <ConnectedMultiDrawer
        drawerWidth={theme.layout.drawer.width}
        overlay={true}
        /*         overlay={!isTablet}
        showRailButtons={true} */
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: (theme) => theme.zIndex.panels,
          overflowX: "clip",
          overflowY: "visible",
        }}
      >
        {/* Panel sections */}
        <IntroSection />
        {/* Temporarily hidden while developing */}
        {/* <MapPanel 
          mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZGlnaWppbGwiLCJhIjoiY2tydmI3dXQyMDR4ajJ2cWUyd3htc3h5MCJ9.8dWK7Z9U3DfG7Ec_DP4Lww"}
          initialLongitude={-121.4944} // California Central Valley
          initialLatitude={37.0902}
          initialZoom={6}
          mapStyle="mapbox://styles/digijill/cmeum8zy2001b01s65c4d1l30"
        /> */}
        <ContentPanels />
        <ScenarioExplorer />
      </Box>
    </>
  )
}
