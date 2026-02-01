"use client"

/**
 * SelectionBanner - Scenario selection summary bar
 *
 * Displays selected scenarios with compare button.
 * Appears when scenarios are selected for comparison.
 * Uses framer-motion for smooth enter/exit animations.
 */

import { Box, Typography, Button, Chip, useTheme } from "@repo/ui/mui"
import { motion, AnimatePresence, Reorder } from "@repo/motion"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"

/**
 * SelectionBanner: Shows selected scenarios with clear all option
 */
export default function SelectionBanner() {
  const theme = useTheme()
  const { selectedScenarios, clearScenarios, toggleScenario, selectScenarios } =
    useScenarioExplorerStore()
  const { getDisplayName } = useScenarioList()

  const hasSelection = selectedScenarios.length > 0

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          <Box
            // WCAG 4.1.3: Live region for dynamic selection updates
            role="status"
            aria-live="polite"
            aria-atomic="true"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderBottom: theme.border.light,
              px: theme.space.page.x,
              py: theme.space.component.md,
            }}
          >
            {/* Top row: count + Clear button */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.space.gap.md,
                mb: selectedScenarios.length > 0 ? theme.space.gap.sm : 0,
              }}
            >
              <Typography
                variant="overline"
                sx={{ color: theme.palette.grey[500], flexShrink: 0 }}
              >
                {selectedScenarios.length} scenario
                {selectedScenarios.length !== 1 ? "s" : ""} selected
              </Typography>

              <Button
                variant="text"
                size="small"
                onClick={clearScenarios}
                sx={{
                  color: theme.palette.grey[500],
                  minWidth: "auto",
                  flexShrink: 0,
                  px: theme.space.component.sm,
                  "&:hover": {
                    color: theme.palette.grey[700],
                    backgroundColor: theme.palette.grey[100],
                  },
                }}
              >
                Clear
              </Button>
            </Box>

            {/* Scenario chips (drag to reorder) */}
            <Reorder.Group
              axis="x"
              values={selectedScenarios}
              onReorder={selectScenarios}
              as="div"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: theme.space.gap.sm,
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {selectedScenarios.map((scenarioId) => (
                <Reorder.Item
                  key={scenarioId}
                  value={scenarioId}
                  as="div"
                  style={{ cursor: "grab" }}
                  whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                >
                  <Chip
                    label={getDisplayName(scenarioId)}
                    onDelete={() => toggleScenario(scenarioId)}
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.grey[100],
                      color: theme.palette.blue.darkest,
                      fontWeight: theme.typography.fontWeightMedium,
                      "& .MuiChip-deleteIcon": {
                        color: theme.palette.grey[400],
                        fontSize: "1rem",
                        "&:hover": {
                          color: theme.palette.grey[600],
                        },
                      },
                    }}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
