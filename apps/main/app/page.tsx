"use client"

import React, { useState, useEffect } from "react"
import { ClientSideHead } from "./components/ClientSideHeader"
import { Header } from "@repo/ui/header"
import HomePanel from "./components/layout/HomePanel"
import Drawer from "./components/layout/Drawer"
import IntroInterstitial from "./components/layout/IntroInterstitial"
import CaliforniaWaterPanel from "./components/layout/CaliforniaWaterPanel"
import BaselinePanel from "./components/layout/BaselinePanel"
import SearchAlternativesPanel from "./components/layout/SearchAlternativesPanel"
import MapWrapper from "./components/MapWrapper"
import MapControlsPanel from "./components/MapControlsPanel"

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Map controls state
  const [showAquiferToggle, setShowAquiferToggle] = useState(false)
  const [isAquiferVisible, setIsAquiferVisible] = useState(true)
  const [showCalSimToggle, setShowCalSimToggle] = useState(false)
  const [isCalSimVisible, setIsCalSimVisible] = useState(true)
  const [showBasins] = useState(true)
  const [isBasinsVisible, setIsBasinsVisible] = useState(false)

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

  // Handler for aquifer toggle
  const handleAquiferToggle = () => {
    setIsAquiferVisible(!isAquiferVisible)
  }

  // Handler for CalSim nodes toggle
  const handleCalSimToggle = () => {
    setIsCalSimVisible(!isCalSimVisible)
  }

  // Handler for basins toggle
  const handleBasinsToggle = () => {
    setIsBasinsVisible(!isBasinsVisible)
  }

  useEffect(() => {
    // Clean up any debug elements that might have been left in the DOM
    const debugElement = document.getElementById("debug-output")
    if (debugElement && debugElement.parentNode) {
      debugElement.parentNode.removeChild(debugElement)
    }
  }, [])

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
            <MapWrapper
              showAquiferToggle={showAquiferToggle}
              isAquiferVisible={isAquiferVisible}
              showCalSimToggle={showCalSimToggle}
              isCalSimVisible={isCalSimVisible}
              showBasins={showBasins}
              isBasinsVisible={isBasinsVisible}
            />
          </div>

          {/* Map Controls Panel - positioned above map but below content panels */}
          <MapControlsPanel
            showAquiferToggle={showAquiferToggle}
            isAquiferVisible={isAquiferVisible}
            onAquiferToggle={handleAquiferToggle}
            showCalSimToggle={showCalSimToggle}
            isCalSimVisible={isCalSimVisible}
            onCalSimToggle={handleCalSimToggle}
            showBasins={showBasins}
            isBasinsVisible={isBasinsVisible}
            onBasinsToggle={handleBasinsToggle}
          />

          <div
            className={"vertical-panels"}
            style={{
              position: "relative",
              zIndex: 10, // Higher than map controls
              pointerEvents: "none",
            }}
          >
            <HomePanel
            // onVisible={() => setActivePanel("home")}
            />
            <IntroInterstitial
            // onVisible={() => setActivePanel("intro")}
            />
            <CaliforniaWaterPanel
              onLearnMoreClick={toggleDrawer(true)}
              setShowAquiferToggle={setShowAquiferToggle}
              setIsAquiferVisible={setIsAquiferVisible}
              // onVisible={() => setActivePanel("californiaWater")}
            />
            <BaselinePanel
              onLearnMoreClick={toggleDrawer(true)}
              setShowCalSimToggle={setShowCalSimToggle}
              setIsCalSimVisible={setIsCalSimVisible}
              setIsBasinsVisible={setIsBasinsVisible}
              // onVisible={() => setActivePanel("baseline")}
            />
            <SearchAlternativesPanel
            // onVisible={() => setActivePanel("searchAlternatives")}
            />
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
