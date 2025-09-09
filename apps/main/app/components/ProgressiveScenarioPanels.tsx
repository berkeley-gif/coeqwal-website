"use client"

import { useState, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"
import ScenarioCard from "./ScenarioCard"
import ClimateCard from "./ClimateCard"

export default function ProgressiveScenarioPanels() {
  const theme = useTheme()
  const [showScenarioCard, setShowScenarioCard] = useState(false)
  const [showClimateCard, setShowClimateCard] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // State for expanded card functionality
  const [isScenarioCardMinimized, setIsScenarioCardMinimized] = useState(false)
  const [isClimateCardMinimized, setIsClimateCardMinimized] = useState(false)
  const [selectedClimate, setSelectedClimate] = useState(1)

  // Intersection observer for scenario-related panels (Operations)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const scenariosPanels = [
          "scenarios-overlay",
          "scenarios-overlay2",
          "content-panels",
        ]
        const anyScenarioPanelVisible = entries.some(
          (entry) =>
            scenariosPanels.includes(entry.target.id) && entry.isIntersecting,
        )

        setShowScenarioCard(anyScenarioPanelVisible)
        console.log(
          "🎬 Operations panel visibility:",
          anyScenarioPanelVisible,
          "- triggered by:",
          entries
            .filter((e) => e.isIntersecting)
            .map((e) => e.target.id)
            .join(", "),
        )
      },
      {
        threshold: 0.1, // Lower threshold to trigger earlier
        rootMargin: "0px 0px -50px 0px", // Less aggressive margin
      },
    )

    // Observe scenarios panels and content panels
    const scenariosPanel = document.getElementById("scenarios-overlay")
    const scenariosPanel2 = document.getElementById("scenarios-overlay2")
    const contentPanels = document.getElementById("content-panels")

    if (scenariosPanel) observer.observe(scenariosPanel)
    if (scenariosPanel2) observer.observe(scenariosPanel2)
    if (contentPanels) observer.observe(contentPanels)

    return () => observer.disconnect()
  }, [])

  // Intersection observer for climate panel (shows on second scenarios panel OR content panels)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const relevantPanels = ["scenarios-overlay2", "content-panels"]
        const anyRelevantPanelVisible = entries.some(
          (entry) =>
            relevantPanels.includes(entry.target.id) && entry.isIntersecting,
        )

        setShowClimateCard(anyRelevantPanelVisible)
        console.log(
          "🎬 Hydroclimate panel visibility:",
          anyRelevantPanelVisible,
          "- triggered by:",
          entries
            .filter((e) => e.isIntersecting)
            .map((e) => e.target.id)
            .join(", "),
        )
      },
      {
        threshold: 0.1, // Lower threshold to trigger earlier
        rootMargin: "0px 0px -50px 0px", // Less aggressive margin
      },
    )

    // Observe both the second scenarios panel and content panels
    const secondScenariosPanel = document.getElementById("scenarios-overlay2")
    const contentPanels = document.getElementById("content-panels")

    if (secondScenariosPanel) observer.observe(secondScenariosPanel)
    if (contentPanels) observer.observe(contentPanels)

    return () => observer.disconnect()
  }, [])

  // Intersection observer for expansion state (scenario-explorer-overlay)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "scenario-explorer-overlay") {
            setIsExpanded(entry.isIntersecting)
            console.log(
              "🎬 Panel expansion state:",
              entry.isIntersecting,
              "- triggered by scenario-explorer-overlay"
            )
          }
        })
      },
      {
        threshold: 0.3, // Trigger when 30% of the panel is visible
        rootMargin: "0px 0px -100px 0px",
      },
    )

    const scenarioExplorerOverlay = document.getElementById("scenario-explorer-overlay")
    if (scenarioExplorerOverlay) {
      observer.observe(scenarioExplorerOverlay)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <Box
      sx={{
        position: "fixed",
        left: 24,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: (theme) => theme.zIndex.appBar,
        pointerEvents: "none", // Allow map interaction through
        width: "320px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Scenario Card */}
      <AnimatePresence>
        {showScenarioCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            style={{ pointerEvents: "auto" }}
          >
            {isExpanded ? (
              // Expanded state: Full ScenarioCard
              <ScenarioCard
                isMinimized={isScenarioCardMinimized}
                onToggleMinimized={() => setIsScenarioCardMinimized(!isScenarioCardMinimized)}
              />
            ) : (
              // Simple state: Just "Operations" text
              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: theme.borderRadius.card,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.blue.darkest,
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  Operations
                </Typography>
              </Box>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Climate Card */}
      <AnimatePresence>
        {showClimateCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: 0.2, // Slight delay after scenario card
            }}
            style={{ pointerEvents: "auto" }}
          >
            {isExpanded ? (
              // Expanded state: Full ClimateCard
              <ClimateCard
                isMinimized={isClimateCardMinimized}
                onToggleMinimized={() => setIsClimateCardMinimized(!isClimateCardMinimized)}
                selectedClimate={selectedClimate}
                onClimateChange={setSelectedClimate}
              />
            ) : (
              // Simple state: Just "Hydroclimate" text
              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: theme.borderRadius.card,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.blue.darkest,
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  Hydroclimate
                </Typography>
              </Box>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
