"use client"
/**
 * /learn page — hosts the Learn, Explore, and Share tabs.
 */

import { Suspense } from "react"
import { Box } from "@repo/ui/mui"
import { ErrorFallback } from "@repo/ui"
import { ErrorBoundary } from "@repo/utils"
import { MapProvider } from "@repo/map/client"
import { MainContent } from "../components/MainContent"
import { DynamicMap } from "../components/DynamicMap"
import { FloatingGlossary } from "../features/glossary"
import SmoothTabs from "../components/tabs/SmoothTabs"
import TabPanels from "../components/tabs/TabPanels"
import TabsShell from "../components/tabs/TabsShell"
import { TourAnchorProvider } from "../features/scenarioExplorer/explorer/tools/tour"

import { useMediaQuery, useTheme } from "@repo/ui/mui"
import { MobileNotSupported } from "@repo/ui"

function TabPanelsErrorFallback() {
  return (
    <Box sx={{ minHeight: 320, display: "flex", justifyContent: "center" }}>
      <ErrorFallback
        title="This tab couldn't load"
        message="Something went wrong rendering this section."
      />
    </Box>
  )
}

export default function LearnPage() {
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down("sm")) // portrait phones
  const isShort = useMediaQuery("(max-height: 600px)") // landscape phones
  
  // Should be checking for landscape mode on phones as well
  const isMobile = isNarrow || isShort

  if (isMobile) {
    return <MobileNotSupported />
  }

  return (
    <MapProvider>
      <DynamicMap />
      <FloatingGlossary />
      <MainContent>
        <TabsShell>
          <TourAnchorProvider>
            <SmoothTabs />
            <ErrorBoundary fallback={<TabPanelsErrorFallback />}>
              <Suspense fallback={null}>
                <TabPanels />
              </Suspense>
            </ErrorBoundary>
          </TourAnchorProvider>
        </TabsShell>
      </MainContent>
    </MapProvider>
  )
}
