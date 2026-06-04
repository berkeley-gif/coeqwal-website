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
  return (
    <MapProvider>
      <DynamicMap />
      <FloatingGlossary />
      <MainContent>
        <SmoothTabs />
        <ErrorBoundary fallback={<TabPanelsErrorFallback />}>
          <Suspense fallback={null}>
            <TabPanels />
          </Suspense>
        </ErrorBoundary>
      </MainContent>
    </MapProvider>
  )
}

