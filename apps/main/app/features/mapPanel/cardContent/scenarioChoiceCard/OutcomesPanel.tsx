"use client"

import React, { useState } from "react"
import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
} from "@repo/ui/mui"

export default function OutcomesPanel() {
  const [isRelativeView, setIsRelativeView] = useState(true)
  const [highlightBaseline, setHighlightBaseline] = useState(false)

  const handleViewModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsRelativeView(event.target.checked)
  }

  const handleHighlightBaselineChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setHighlightBaseline(event.target.checked)
  }

  const handleLearnMoreClick = () => {
    // TODO: Implement learn more functionality
    console.log("Learn more about this chart clicked")
  }

  return (
    <Box>
      {/* Full-width paragraph with inline learn more link */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            fontSize: "0.95rem",
            fontWeight: 400,
            color: (theme) => theme.palette.text.primary,
          }}
        >
          COEQWAL has <strong>___</strong> alternative scenarios. Each colored
          dot represents a scenario placed by its outcome. Click on a dot to
          preview that scenario. Slide the sliders on each outcome to isolate
          scenarios meeting your requirements.{" "}
          <Button
            variant="text"
            onClick={handleLearnMoreClick}
            sx={{
              textDecoration: "underline",
              color: (theme) => theme.palette.blue.bright,
              cursor: "pointer",
              padding: 0,
              minWidth: "auto",
              fontSize: "0.95rem", // Match paragraph fontSize
              fontWeight: 500,
              textTransform: "none",
              verticalAlign: "baseline", // Align with text baseline
              "&:hover": {
                color: (theme) => theme.palette.blue.darkest,
                backgroundColor: "transparent",
                textDecoration: "underline",
              },
            }}
          >
            Learn more about this chart
          </Button>
          .
        </Box>
      </Box>

      {/* Two equal columns for interface elements */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          mb: 4,
        }}
      >
        {/* Left Column - Checkbox */}
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={isRelativeView}
                onChange={handleViewModeChange}
                size="small"
              />
            }
            label="view relative to current operations"
          />
        </Box>

        {/* Right Column - Checkbox */}
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={highlightBaseline}
                onChange={handleHighlightBaselineChange}
                size="small"
              />
            }
            label="highlight current operations"
          />
        </Box>
      </Box>

      {/* Visualization interface */}
      <Box
        sx={{
          minHeight: "300px",
          border: "2px dashed",
          borderColor: (theme) => theme.palette.grey[300],
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: (theme) => theme.palette.grey[50],
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: (theme) => theme.palette.grey[500],
            fontStyle: "italic",
          }}
        >
          Visualization interface will go here
        </Typography>
      </Box>
    </Box>
  )
}
