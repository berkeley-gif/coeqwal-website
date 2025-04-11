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
  Radio,
  alpha,
  RadioGroup,
  Box,
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
    <BasePanel
      fullHeight={false} // Allow panel to be taller than viewport - updated from CombinedPanel
      background="light"
      paddingVariant="narrow"
      sx={{
        width: "100%", // Updated from CombinedPanel
        maxWidth: "100%", // Prevent horizontal scrollbar
      }}
    >
      {/* Row 1: Headline & climate checkbox */}
      <Grid
        container
        spacing={2}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          width: "100%",
          maxWidth: "100%",
          margin: 0,
        }}
      >
        {/* Left: Title and description */}
        <Grid
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: "calc(100% - 200px)", // Leave room for the climate card
          }}
        >
          <Typography variant="h4" gutterBottom>
            Explore Options for California Water
          </Typography>
          <Typography variant="body1">
            Search our collection of water management scenarios to see how
            different decisions — like reservoir rules or delivery priorities —
            shape outcomes across California.
          </Typography>

          {/* Radio Buttons for Search Options */}
          <RadioGroup
            name="search-type"
            value={searchMode}
            onChange={handleSearchModeChange}
            sx={{ width: "100%" }}
          >
            <Grid
              container
              spacing={2}
              sx={{
                mt: 2,
                width: "100%",
                display: "flex",
              }}
            >
              <Grid>
                <FormControlLabel
                  value="operations"
                  control={
                    <Radio
                      sx={{
                        color: "black",
                        "&.Mui-checked": {
                          color: "black",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      component="span"
                      sx={{
                        backgroundColor: alpha(theme.palette.pop.main, 0.15),
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        color: theme.palette.pop.main,
                        fontWeight: "medium",
                      }}
                    >
                      understand the effects of operations
                    </Typography>
                  }
                />
              </Grid>
              <Grid>
                <FormControlLabel
                  value="outcomes"
                  control={
                    <Radio
                      sx={{
                        color: "black",
                        "&.Mui-checked": {
                          color: "black",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      component="span"
                      sx={{
                        backgroundColor: alpha(theme.palette.cool.main, 0.15),
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        color: theme.palette.cool.main,
                        fontWeight: "medium",
                      }}
                    >
                      find scenarios that change outcomes
                    </Typography>
                  }
                />
              </Grid>
              <Grid>
                <FormControlLabel
                  value="detailed"
                  control={
                    <Radio
                      sx={{
                        color: "black",
                        "&.Mui-checked": {
                          color: "black",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      component="span"
                      sx={{
                        backgroundColor: alpha(theme.palette.cool.dark, 0.15),
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        color: theme.palette.cool.dark,
                        fontWeight: "medium",
                      }}
                    >
                      detailed outcome-based search
                    </Typography>
                  }
                />
              </Grid>
            </Grid>
          </RadioGroup>
        </Grid>

        {/* Right: Climate checkbox */}
        {showQuestionBuilder && (
          <Grid
            sx={{
              width: "auto",
              marginLeft: "auto",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
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
          </Grid>
        )}
      </Grid>

      {/* Only show the question builder if not in detailed mode */}
      {showQuestionBuilder && (
        <>
          {/* Row 2: Question summary - now with sticky positioning */}
          <Box
            sx={{
              position: "sticky",
              top: (theme) => theme.layout.headerHeight,
              zIndex: 1000,
              backgroundColor: theme.palette.common.white,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {showSummary && <QuestionSummary />}
          </Box>

          {/* Row 3: Question builder */}
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
        </>
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
