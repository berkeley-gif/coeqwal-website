"use client"

import React, { useState } from "react"
import { ClientSideHead } from "./components/ClientSideHeader"
import { Header } from "@repo/ui/header"
import HomePanel from "./components/layout/HomePanel"
import Drawer from "./components/layout/Drawer"
import IntroInterstitial from "./components/layout/IntroInterstitial"
import CaliforniaWaterPanel from "./components/layout/CaliforniaWaterPanel"
import BaselinePanel from "./components/layout/BaselinePanel"
import MapWrapper from "./components/MapWrapper"

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event &&
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return
      }
      setDrawerOpen(open)
    }

  return (
    <>
      <ClientSideHead />
      <div className={"main-site"}>
        <Header />
        <main>
          <div
            className={"map-wrapper"}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "all",
            }}
          >
            <MapWrapper />
          </div>
          <div
            className={"vertical-panels"}
            style={{
              position: "relative",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <HomePanel />
            <IntroInterstitial />
            <CaliforniaWaterPanel onLearnMoreClick={toggleDrawer(true)} />
            <BaselinePanel onLearnMoreClick={toggleDrawer(true)} />
          </div>
          <Drawer
            open={drawerOpen}
            onClose={toggleDrawer(false)}
            onOpen={toggleDrawer(true)}
          />
        </main>
      </div>
    </>
  )
}
