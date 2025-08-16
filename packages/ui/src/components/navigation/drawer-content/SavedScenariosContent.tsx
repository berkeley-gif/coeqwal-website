"use client"

import React from "react"
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  useTheme,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import EditIcon from "@mui/icons-material/Edit"

// Types for saved scenarios
export interface SavedScenario {
  id: string
  name: string
  description?: string
  scenarios: string[]
  region: string
  savedAt: Date
  tags?: string[]
}

export interface SavedScenariosContentProps {
  onClose: () => void
  savedScenarios?: SavedScenario[]
  onLoadScenario?: (scenario: SavedScenario) => void
  onDeleteScenario?: (scenarioId: string) => void
  onEditScenario?: (scenario: SavedScenario) => void
}

/**
 * Content component for the Saved Scenarios drawer tab
 *
 * Features:
 * - List of saved scenario configurations
 * - Load, edit, and delete actions
 * - Search and filter capabilities
 * - Empty state when no scenarios are saved
 */
export function SavedScenariosContent({
  onClose,
  savedScenarios = [],
  onLoadScenario,
  onDeleteScenario,
  onEditScenario,
}: SavedScenariosContentProps) {
  const handleLoadScenario = (scenario: SavedScenario) => {
    if (onLoadScenario) {
      onLoadScenario(scenario)
      onClose() // Close drawer after loading
    }
  }

  const handleDeleteScenario = (scenarioId: string) => {
    if (onDeleteScenario) {
      onDeleteScenario(scenarioId)
    }
  }

  const handleEditScenario = (scenario: SavedScenario) => {
    if (onEditScenario) {
      onEditScenario(scenario)
    }
  }

  return (
    <Box sx={{ p: 2, height: "100%" }}>
      {/* Header section with standardized typography */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Box sx={(theme) => ({ ...theme.mixins.cardTypography.eyebrow })}>
          MY SCENARIOS
        </Box>
        <Box sx={(theme) => ({ ...theme.mixins.cardTypography.cardTitle })}>
          Story
        </Box>

        {/* HR separator */}
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: (theme) => theme.palette.grey[300],
            my: 2.5,
            mb: 0,
          }}
        />
      </Box>

      {/* Instructional text */}
      <Box sx={{ flexShrink: 0, pb: 2 }}>
        <Box sx={(theme) => ({ ...theme.mixins.cardTypography.bodyContainer })}>
          <Typography
            variant="body1"
            sx={(theme) => ({
              ...theme.mixins.cardTypography.instructionalText,
            })}
          >
            <Box
              component="span"
              sx={(theme) => ({
                ...theme.mixins.cardTypography.highlightedSpan,
              })}
            >
              Click
            </Box>{" "}
            on the icon to save a scenario or scenario view to your story. You
            can view and edit your story with the story tools.
          </Typography>
        </Box>
      </Box>

      {/* Empty state */}
      {savedScenarios.length === 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            textAlign: "center",
            px: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
            No saved scenarios yet
          </Typography>
        </Box>
      )}

      {/* Scenarios list */}
      {savedScenarios.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {savedScenarios.map((scenario, index) => (
            <Box key={scenario.id}>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  backgroundColor: "background.paper",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                {/* Scenario header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 500, mb: 0.5 }}
                    >
                      {scenario.name}
                    </Typography>
                    {scenario.description && (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mb: 1 }}
                      >
                        {scenario.description}
                      </Typography>
                    )}
                  </Box>

                  {/* Action buttons */}
                  <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleLoadScenario(scenario)}
                      title="Load scenario"
                      sx={{ color: "primary.main" }}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditScenario(scenario)}
                      title="Edit scenario"
                      sx={{ color: "text.secondary" }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteScenario(scenario.id)}
                      title="Delete scenario"
                      sx={{ color: "error.main" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Scenario details */}
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Region: {scenario.region} • {scenario.scenarios.length}{" "}
                    scenario{scenario.scenarios.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>

                {/* Scenarios chips */}
                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}
                >
                  {scenario.scenarios.slice(0, 3).map((scenarioName) => (
                    <Chip
                      key={scenarioName}
                      label={scenarioName}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  ))}
                  {scenario.scenarios.length > 3 && (
                    <Chip
                      label={`+${scenario.scenarios.length - 3} more`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem", color: "text.secondary" }}
                    />
                  )}
                </Box>

                {/* Tags */}
                {scenario.tags && scenario.tags.length > 0 && (
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}
                  >
                    {scenario.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          backgroundColor: "action.selected",
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* Saved date */}
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  Saved {scenario.savedAt.toLocaleDateString()}
                </Typography>
              </Box>

              {/* Divider between scenarios */}
              {index < savedScenarios.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Box>
      )}

      {/* Footer actions */}
      {savedScenarios.length > 0 && (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            backgroundColor: "background.default",
            pt: 2,
            mt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ textTransform: "none", width: "100%" }}
          >
            Back to Scenarios
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default SavedScenariosContent
