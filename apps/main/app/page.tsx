"use client"

import { Suspense } from "react"
import { Box } from "@repo/ui/mui"
import { Header } from "./components/Header"
import { FloatingGlossary } from "./components/floatingglossary"
import IntroSection from "./sections/IntroSection"

import { TabsProvider } from "./context/Tabs"
import SmoothTabs from "./components/tabs/SmoothTabs"
import TabPanels from "./components/tabs/TabPanels"

export default function Home() {
  return (
    <>
      <TabsProvider>
        <Header />
        <FloatingGlossary />
        <Box
          component="main"
          sx={{
            position: "relative",
            overflowX: "clip",
            overflowY: "visible",
          }}
        >
          <IntroSection />
          <Suspense fallback={null}>
            <SmoothTabs />
            <TabPanels />
          </Suspense>
        </Box>
      </TabsProvider>
    </>
  )
}
