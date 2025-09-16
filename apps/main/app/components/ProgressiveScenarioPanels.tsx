"use client"
// Todo: coordinate intersection observer logic with storyline i.o. logic. HY should be an i.o. pro by now.
import { useState, useEffect } from "react"
import { Box } from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"
import ScenarioCard from "./ScenarioCard"
import ClimateCard from "./ClimateCard"
import { useCalSimToggle } from "./CalSimContext"

export default function ProgressiveScenarioPanels() {
  const { setIsPanelsExpanded, setIsPanelsVisible } = useCalSimToggle()
  const [showOperationsPanel, setShowOperationsPanel] = useState(false)
  const [showHydroclimatePanel, setShowHydroclimatePanel] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // State for expanded card functionality
  const [isScenarioCardMinimized, setIsScenarioCardMinimized] = useState(false)
  const [isClimateCardMinimized, setIsClimateCardMinimized] = useState(false)
  const [selectedClimate, setSelectedClimate] = useState(1) // Default to "Historical"

  // Coordinated intersection observer for both panels
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Determine which panels are currently visible
        const visiblePanels = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.id)

        // Operations panel logic: Show starting from "Rethink California water" panel
        const operationsPanels = [
          "scenarios-overlay2", // Start from "Rethink California water" panel
          "scenario-explorer-overlay",
        ]
        const showOperations = visiblePanels.some((id) =>
          operationsPanels.includes(id),
        )

        // Hydroclimate panel logic: Show from scenarios-overlay2 onwards (IntroSection only)
        const hydroclimateStartPanels = [
          "scenarios-overlay2",
          "scenario-explorer-overlay",
        ]
        const showHydroclimate = visiblePanels.some((id) =>
          hydroclimateStartPanels.includes(id),
        )

        // Expansion logic: Only when scenario-explorer-overlay is visible
        const shouldExpand = visiblePanels.includes("scenario-explorer-overlay")

        setShowOperationsPanel(showOperations)
        setShowHydroclimatePanel(showHydroclimate)
        setIsExpanded(shouldExpand)
        setIsPanelsExpanded(shouldExpand) // Communicate expansion state to map
        setIsPanelsVisible(showOperations || showHydroclimate) // Communicate visibility state to map

        console.log("Setting panels state:", {
          expanded: shouldExpand,
          visible: showOperations || showHydroclimate,
        })

        console.log(
          "Coordinated panel state:",
          {
            operations: showOperations,
            hydroclimate: showHydroclimate,
            expanded: shouldExpand,
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

    // Observe only relevant IntroSection panels (starting from scenarios-overlay2)
    const scenariosPanel2 = document.getElementById("scenarios-overlay2")
    const scenarioExplorerOverlay = document.getElementById(
      "scenario-explorer-overlay",
    )

    if (scenariosPanel2) observer.observe(scenariosPanel2)
    if (scenarioExplorerOverlay) observer.observe(scenarioExplorerOverlay)

    return () => observer.disconnect()
  }, [setIsPanelsExpanded, setIsPanelsVisible])

  return (
    <Box
      sx={{
        position: "fixed",
        top: 24,
        left: 24,
        zIndex: (theme) => theme.zIndex.appBar,
        pointerEvents: "none", // Allow map interaction through
        width: "474px", // Match ScenarioExplorer left panel width
        maxHeight: "calc(100vh - 48px)", // Ensure panels fit in viewport
        display: "flex",
        flexDirection: "column",
        gap: 1,

        // Responsive layout for when both panels don't fit
        "@media (max-height: 800px)": {
          flexDirection: "row",
          flexWrap: "wrap",
          width: "calc(100vw - 48px)",
          maxWidth: "900px",
          alignItems: "flex-start",
          gap: 2,
        },
      }}
    >
      {/* Operations Panel */}
      <AnimatePresence>
        {showOperationsPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: {
                duration: 0.15, // Quick fade-out, not yet mastered
                ease: "easeIn",
              },
            }}
            transition={{
              duration: 2.0, // Much slower fade-in to not distract from reading
              ease: "easeOut",
            }}
            style={{
              pointerEvents: "auto",
              flexShrink: 0, // Don't shrink in responsive layout
              width: "474px", // Fixed width for responsive layout
            }}
          >
            <ScenarioCard
              isMinimized={!isExpanded} // Minimized when not in final section, user can control when expanded
              onToggleMinimized={
                isExpanded
                  ? () => setIsScenarioCardMinimized(!isScenarioCardMinimized)
                  : undefined
              }
              minimizedTitle="Operations" // Show "Operations" when not expanded
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hydroclimate panel */}
      <AnimatePresence>
        {showHydroclimatePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: {
                duration: 0.15, // Quick fade-out, not yet mastered, also actions for both panels should be combined
                ease: "easeIn",
              },
            }}
            transition={{
              duration: 2.0, // Much slower fade-in to not distract from reading
              ease: "easeOut",
              delay: 0.5, // Longer delay after operations panel for subtle entrance
            }}
            style={{
              pointerEvents: "auto",
              flexShrink: 0, // Don't shrink in responsive layout
              width: "474px", // Fixed width for responsive layout
            }}
          >
            <ClimateCard
              isMinimized={!isExpanded} // Minimized when not in final section, user can control when expanded
              onToggleMinimized={
                isExpanded
                  ? () => setIsClimateCardMinimized(!isClimateCardMinimized)
                  : undefined
              }
              selectedClimate={selectedClimate}
              onClimateChange={setSelectedClimate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
