"use client"

import React, { useState } from "react"
import {
  Typography,
  Container,
  Box,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
} from "@mui/material"
// import { useTranslation } from "@repo/i18n"

export default function SearchAlternativesPanel() {
  // const { t } = useTranslation()
  const theme = useTheme()

  // State for dropdown values
  const [operationalAction, setOperationalAction] = useState("")
  const [impactArea, setImpactArea] = useState("")
  const [geographicArea, setGeographicArea] = useState("")
  const [hydroclimateScenario, setHydroclimateScenario] = useState("")
  const [impactDirection, setImpactDirection] = useState("")

  // Add state to track whether we're in default or outcome-focused mode
  const [isOutcomeMode, setIsOutcomeMode] = useState(false)

  // Handle changes for each dropdown
  const handleOperationalActionChange = (event: SelectChangeEvent) => {
    setOperationalAction(event.target.value)
  }

  const handleImpactAreaChange = (event: SelectChangeEvent) => {
    setImpactArea(event.target.value)
  }

  const handleGeographicAreaChange = (event: SelectChangeEvent) => {
    setGeographicArea(event.target.value)
  }

  const handleHydroclimateScenarioChange = (event: SelectChangeEvent) => {
    setHydroclimateScenario(event.target.value)
  }

  // Add handler for the new impact direction dropdown
  const handleImpactDirectionChange = (event: SelectChangeEvent) => {
    setImpactDirection(event.target.value)
  }

  // Toggle between default and outcome-focused modes
  const toggleFormMode = () => {
    setIsOutcomeMode(!isOutcomeMode)
    // Reset form values when switching modes
    setOperationalAction("")
    setImpactArea("")
    setGeographicArea("")
    setHydroclimateScenario("")
    setImpactDirection("")
  }

  // Dropdown options
  const operationalActionOptions = [
    "theme 1",
    "theme 2",
    "theme 3",
    "theme 4",
    "theme 5",
    "🔍 More options…",
  ]

  const impactAreaOptions = [
    "storage",
    "flows",
    "deliveries",
    "Delta outflow",
    "groundwater levels",
  ]

  // Options for the new impact direction dropdown
  const impactDirectionOptions = ["increase", "decrease", "affect"]

  const geographicAreaOptions = [
    "Sacramento Valley",
    "San Joaquin Valley",
    "Delta region",
    "Central Valley (overall)",
    "All of California",
    "🔍 More options…",
  ]

  const hydroclimateScenarioOptions = [
    "typical conditions",
    "hotter and drier future climate",
    "highly variable climate conditions",
  ]

  // Style for the select dropdowns
  const selectStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
    borderRadius: 1,
    minWidth: 180,
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    "& .MuiSvgIcon-root": {
      color: "white",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255, 255, 255, 0.5)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "white",
    },
    "& .MuiMenu-paper": {
      backgroundColor: "#ffffff",
    },
  }

  // Style for dropdown menu items (need to be applied separately to the MenuItems)
  const menuItemStyle = {
    color: theme.palette.primary.dark,
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
      color: "white",
    },
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: "white",
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
      },
    },
  }

  return (
    <Container
      sx={{
        backgroundColor: theme.palette.primary.dark,
        minHeight: "100vh",
        pointerEvents: "none",
        "& .MuiFormControl-root, & a, & [role='button']": {
          pointerEvents: "auto",
        },
        maxWidth: "xl",
        pt: 10,
        pb: 10,
      }}
      role="main"
    >
      <Box
        sx={{
          marginTop: "150px",
          width: "100%",
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            whiteSpace: { xs: "normal", md: "normal" },
            mb: 4,
          }}
        >
          Search for alternatives
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              flexWrap: "wrap",
              gap: { xs: 1, md: 1 },
            }}
          >
            {!isOutcomeMode ? (
              // Default mode: "How does [action] affect [impact] in [area] during [climate]?"
              <>
                <Typography variant="body1" component="span">
                  How does
                </Typography>

                <FormControl size="small" sx={{ minWidth: 250, mx: { md: 1 } }}>
                  <Select
                    value={operationalAction}
                    onChange={handleOperationalActionChange}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="" disabled sx={menuItemStyle}>
                      <span style={{ opacity: 0 }}>Blank</span>
                    </MenuItem>
                    {operationalActionOptions.map((option) => (
                      <MenuItem key={option} value={option} sx={menuItemStyle}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography
                  variant="body1"
                  component="span"
                  sx={{ mx: { md: 1 } }}
                >
                  affect
                </Typography>

                <FormControl size="small" sx={{ minWidth: 180, mx: { md: 1 } }}>
                  <Select
                    value={impactArea}
                    onChange={handleImpactAreaChange}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="" disabled sx={menuItemStyle}>
                      <span style={{ opacity: 0 }}>Blank</span>
                    </MenuItem>
                    {impactAreaOptions.map((option) => (
                      <MenuItem key={option} value={option} sx={menuItemStyle}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography
                  variant="body1"
                  component="span"
                  sx={{ mx: { md: 1 } }}
                >
                  in
                </Typography>

                <FormControl size="small" sx={{ minWidth: 200, mx: { md: 1 } }}>
                  <Select
                    value={geographicArea}
                    onChange={handleGeographicAreaChange}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="" disabled sx={menuItemStyle}>
                      <span style={{ opacity: 0 }}>Blank</span>
                    </MenuItem>
                    {geographicAreaOptions.map((option) => (
                      <MenuItem key={option} value={option} sx={menuItemStyle}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography
                  variant="body1"
                  component="span"
                  sx={{ mx: { md: 1 } }}
                >
                  during
                </Typography>

                <FormControl size="small" sx={{ minWidth: 250, mx: { md: 1 } }}>
                  <Select
                    value={hydroclimateScenario}
                    onChange={handleHydroclimateScenarioChange}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="" disabled sx={menuItemStyle}>
                      <span style={{ opacity: 0 }}>Blank</span>
                    </MenuItem>
                    {hydroclimateScenarioOptions.map((option) => (
                      <MenuItem key={option} value={option} sx={menuItemStyle}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography
                  variant="body1"
                  component="span"
                  sx={{ mx: { md: 1 } }}
                >
                  ?
                </Typography>
              </>
            ) : (
              // Outcome mode: "Which operations can [outcome] in [location] under [climate]?"
              <>
                <Typography variant="body1" component="span">
                  Which operations can
                </Typography>

                <FormControl size="small" sx={{ minWidth: 120, mx: { md: 1 } }}>
                  <Select
                    value={impactDirection}
                    onChange={handleImpactDirectionChange}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="" disabled sx={menuItemStyle}>
                      <span style={{ opacity: 0 }}>Blank</span>
                    </MenuItem>
                    {impactDirectionOptions.map((option) => (
                      <MenuItem key={option} value={option} sx={menuItemStyle}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 180, mx: { md: 1 } }}>
                  <Select
                    value={impactArea}
                    onChange={handleImpactAreaChange}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="" disabled sx={menuItemStyle}>
                      <span style={{ opacity: 0 }}>Blank</span>
                    </MenuItem>
                    {impactAreaOptions.map((option) => (
                      <MenuItem key={option} value={option} sx={menuItemStyle}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography
                  variant="body1"
                  component="span"
                  sx={{ mx: { md: 1 } }}
                >
                  in
                </Typography>

                <FormControl size="small" sx={{ minWidth: 200, mx: { md: 1 } }}>
                  <Select
                    value={geographicArea}
                    onChange={handleGeographicAreaChange}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="" disabled sx={menuItemStyle}>
                      <span style={{ opacity: 0 }}>Blank</span>
                    </MenuItem>
                    {geographicAreaOptions.map((option) => (
                      <MenuItem key={option} value={option} sx={menuItemStyle}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography
                  variant="body1"
                  component="span"
                  sx={{ mx: { md: 1 } }}
                >
                  under
                </Typography>

                <FormControl size="small" sx={{ minWidth: 250, mx: { md: 1 } }}>
                  <Select
                    value={hydroclimateScenario}
                    onChange={handleHydroclimateScenarioChange}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="" disabled sx={menuItemStyle}>
                      <span style={{ opacity: 0 }}>Blank</span>
                    </MenuItem>
                    {hydroclimateScenarioOptions.map((option) => (
                      <MenuItem key={option} value={option} sx={menuItemStyle}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography
                  variant="body1"
                  component="span"
                  sx={{ mx: { md: 1 } }}
                >
                  ?
                </Typography>
              </>
            )}
          </Box>

          {/* Convert to clickable link with hover effect */}
          <Box
            component="a"
            onClick={toggleFormMode}
            sx={{
              mt: 3,
              cursor: "pointer",
              display: "inline-block",
              textDecoration: "none",
              pointerEvents: "auto",
              color: "rgba(255, 255, 255, 0.8)",
              "&:hover": {
                color: "#ffffff", // Bright white on hover
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                fontStyle: "italic",
              }}
            >
              {isOutcomeMode
                ? "Looking for how actions affect outcomes?"
                : "Have a question about a specific outcome?"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                fontStyle: "italic",
                mt: 3,
              }}
            >
              Explore the 2023 DWR baseline scenario
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
