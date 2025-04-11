"use client"

import React, { useState, useEffect } from "react"
import {
  Grid,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  useTheme,
  SwapHorizIcon,
  // Radio,
  // alpha,
  // RadioGroup,
  Box,
  KeyboardArrowDownIcon,
} from "@repo/ui/mui"
import { BasePanel, Card } from "@repo/ui"
import {
  QuestionSummary,
  OperationsSelector,
  OutcomesSelector,
  ClimateSelector,
} from "./components"
import { QuestionBuilderProvider } from "./context/QuestionBuilderContext"
import { useQuestionBuilderHelpers } from "./hooks/useQuestionBuilderHelpers"

// Content component that uses the context
const QuestionBuilderContent = ({
  showSummary = true,
}: {
  showSummary: boolean
}) => {
  const theme = useTheme()
  const {
    state: { includeClimate, swapped },
    toggleClimate,
    toggleSwap,
  } = useQuestionBuilderHelpers()

  // State to track which radio button is selected
  const [searchMode, setSearchMode] = useState("operations")

  // Effect to handle swapping based on search mode
  useEffect(() => {
    // If operations mode is selected but UI is in swapped state
    if (searchMode === "operations" && swapped) {
      toggleSwap()
    }
    // If outcomes mode is selected but UI is in non-swapped state
    else if (searchMode === "outcomes" && !swapped) {
      toggleSwap()
    }
  }, [searchMode, swapped, toggleSwap])

  // Handle radio button change
  const handleSearchModeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSearchMode(event.target.value)
  }

  // Handle swap icon click - sync with radio buttons
  const handleSwapClick = () => {
    toggleSwap()
    // Update the search mode state
    setSearchMode(swapped ? "operations" : "outcomes")
  }

  // Determine if the question builder should be shown
  const showQuestionBuilder = searchMode !== "detailed"

  return (
    <Box sx={{ width: "100%" }}>
      {/* Full height hero section with centered question summary */}
      <Box
        sx={(theme) => ({
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          backgroundColor: theme.palette.background.default,
        })}
      >
        {/* Sticky Question Summary */}
        {showQuestionBuilder && showSummary && (
          <Box
            sx={{
              position: "sticky",
              top: (theme) => theme.layout.headerHeight,
              zIndex: 1000,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: (theme) => theme.spacing(4),
            }}
          >
            <QuestionSummary />
          </Box>
        )}

        {/* Scroll indicator at the bottom - matching HeroQuestionsPanel style */}
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "600px",
            textAlign: "center",
          }}
          onClick={() => {
            const contentElement = document.getElementById(
              "question-builder-content",
            )
            if (contentElement) {
              contentElement.scrollIntoView({ behavior: "smooth" })
            }
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: "rgba(0, 0, 0, 0.8)",
              marginBottom: 6,
              textShadow: "0px 0px 10px rgba(255, 255, 255, 0.5)",
            }}
          >
            Californians share water through one of the largest and most complex
            conveyance systems in the world.
          </Typography>

          <Box
            sx={(theme) => ({
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.palette.common.white,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.3)",
              },
            })}
          >
            <KeyboardArrowDownIcon
              fontSize="large"
              sx={(theme) => ({
                color: theme.palette.common.white,
                "&:hover": {
                  color: theme.palette.common.white,
                },
              })}
            />
          </Box>
        </Box>
      </Box>

      {/* Question builder content below the fold */}
      <BasePanel
        id="question-builder-content"
        fullHeight={false}
        background="light"
        paddingVariant="narrow"
        sx={{
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {/* Climate checkbox */}
        {showQuestionBuilder && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Card>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeClimate}
                    onChange={() => toggleClimate()}
                    color="primary"
                    sx={{
                      color: theme.palette.text.primary,
                      "&.Mui-checked": {
                        color: theme.palette.text.primary,
                      },
                    }}
                  />
                }
                label="Include climate futures"
              />
            </Card>
          </Box>
        )}

        {/* Only show the question builder if not in detailed mode */}
        {showQuestionBuilder && (
          <Grid
            container
            spacing={2}
            sx={{
              width: "100%",
              display: "flex",
            }}
          >
            {/* Column 1: Operations or outcome text */}
            <Grid sx={{ flex: 1, alignSelf: "flex-start" }}>
              {swapped ? <OutcomesSelector /> : <OperationsSelector />}
            </Grid>

            {/* Column 2: Action verb & switch - aligned to top */}
            <Grid
              sx={{
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingTop: theme.spacing(2.5),
              }}
            >
              <Typography variant="h5" sx={{ mt: 0.5, mb: 2 }}>
                {swapped ? "which" : "affect"}
              </Typography>
              <IconButton onClick={handleSwapClick}>
                <SwapHorizIcon />
              </IconButton>
              <Typography
                variant="caption"
                onClick={handleSwapClick}
                sx={{ cursor: "pointer" }}
              >
                switch
              </Typography>
            </Grid>

            {/* Column 3: Outcomes or operations text */}
            <Grid sx={{ flex: 1, alignSelf: "flex-start" }}>
              {swapped ? <OperationsSelector /> : <OutcomesSelector />}
            </Grid>

            {/* Column 4: "with" label */}
            <Grid
              sx={{
                flex: "0 0 auto",
                alignSelf: "flex-start",
                display: includeClimate ? "block" : "none",
              }}
            >
              <Typography variant="h5" sx={{ mt: 3 }}>
                with
              </Typography>
            </Grid>

            {/* Column 5: "climate" label */}
            <Grid
              sx={{
                flex: 1,
                alignSelf: "flex-start",
                display: includeClimate ? "block" : "none",
              }}
            >
              {includeClimate && <ClimateSelector />}
            </Grid>
          </Grid>
        )}

        {/* Placeholder content for detailed search mode */}
        {!showQuestionBuilder && (
          <Grid sx={{ p: 4 }}>
            <Typography variant="h5">Detailed Outcome-Based Search</Typography>
            <Typography>
              This is where the water needs interface would go.
            </Typography>
          </Grid>
        )}
      </BasePanel>
    </Box>
  )
}

// For debugging in React DevTools
QuestionBuilderContent.displayName = "QuestionBuilderContent"

interface QuestionBuilderPanelProps {
  showSummary?: boolean
}

export function QuestionBuilderPanel({
  showSummary = true,
}: QuestionBuilderPanelProps) {
  return (
    <QuestionBuilderProvider>
      <QuestionBuilderContent showSummary={showSummary} />
    </QuestionBuilderProvider>
  )
}

export default QuestionBuilderPanel
