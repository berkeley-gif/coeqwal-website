"use client"

import { useState, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"
import ScenarioCard from "./ScenarioCard"
import ClimateCard from "./ClimateCard"

export default function ProgressiveScenarioPanels() {
  const theme = useTheme()
  const [showOperationsPanel, setShowOperationsPanel] = useState(false)
  const [showHydroclimatePanel, setShowHydroclimatePanel] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // State for expanded card functionality
  const [isScenarioCardMinimized, setIsScenarioCardMinimized] = useState(false)
  const [isClimateCardMinimized, setIsClimateCardMinimized] = useState(false)
  const [selectedClimate, setSelectedClimate] = useState(1)

  // Coordinated intersection observer for both panels
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Determine which panels are currently visible
        const visiblePanels = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.id)

        // Operations panel logic: Show only during IntroSection map overlays
        const operationsPanels = [
          "scenarios-overlay",
          "scenarios-overlay2", 
          "scenario-explorer-overlay"
        ]
        const showOperations = visiblePanels.some(id => operationsPanels.includes(id))

        // Hydroclimate panel logic: Show from scenarios-overlay2 onwards (IntroSection only)
        const hydroclimateStartPanels = [
          "scenarios-overlay2", 
          "scenario-explorer-overlay"
        ]
        const showHydroclimate = visiblePanels.some(id => hydroclimateStartPanels.includes(id))

        // Expansion logic: Only when scenario-explorer-overlay is visible
        const shouldExpand = visiblePanels.includes("scenario-explorer-overlay")

        setShowOperationsPanel(showOperations)
        setShowHydroclimatePanel(showHydroclimate)
        setIsExpanded(shouldExpand)
        
        console.log(
          "🎬 Coordinated panel state:",
          { 
            operations: showOperations,
            hydroclimate: showHydroclimate, 
            expanded: shouldExpand 
          },
          "- visible panels:",
          visiblePanels.join(", "),
        )
      },
      {
        threshold: 0.1, // Lower threshold to trigger earlier
        rootMargin: "0px 0px -50px 0px", // Less aggressive margin
      },
    )

    // Observe only IntroSection panels (no content-panels)
    const scenariosPanel = document.getElementById("scenarios-overlay")
    const scenariosPanel2 = document.getElementById("scenarios-overlay2")
    const scenarioExplorerOverlay = document.getElementById("scenario-explorer-overlay")

    if (scenariosPanel) observer.observe(scenariosPanel)
    if (scenariosPanel2) observer.observe(scenariosPanel2)
    if (scenarioExplorerOverlay) observer.observe(scenarioExplorerOverlay)

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
        width: "400px", // Match ScenarioExplorer left panel width (2/7 of typical viewport)
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Operations Panel */}
      <AnimatePresence>
        {showOperationsPanel && (
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

      {/* Hydroclimate Panel */}
      <AnimatePresence>
        {showHydroclimatePanel && (
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
