"use client"

import React, { useState } from "react"
import {
  Box,
  Typography,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@repo/ui/mui"
import type { SelectChangeEvent } from "@mui/material/Select"
import { AppHeader, useTheme } from "@repo/ui"
import { ConnectedMultiDrawer } from "../components/ConnectedMultiDrawer"
import { BasePanel } from "@repo/ui"
import DownloadButton from "../components/DownloadButton"

export default function DataPage() {
  const theme = useTheme()
  const [selectedDataset, setSelectedDataset] = useState("")

  const handleDatasetChange = (event: SelectChangeEvent<string>) => {
    setSelectedDataset(event.target.value)
  }

  // Map file IDs to display names
  const fileNames: Record<string, string> = {
    "1": "s0002_9.3.1_danube_adj.zip",
    "2": "s0003_9.3.1_danube_cc50.zip",
    "3": "s0004_9.3.1_danube_cc75.zip",
    "4": "s0005_9.3.1_danube_cc95.zip",
  }

  return (
    <>
      {/* Same header as main page */}
      <AppHeader />

      <ConnectedMultiDrawer
        drawerWidth={theme.layout.drawer.width}
        overlay={true}
        showRailButtons={false}
      />

      {/* Background similar to main page */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: (theme) => theme.zIndex.basement,
        }}
      />

      {/* Main content area */}
      <Box
        sx={{
          position: "relative",
          zIndex: (theme) => theme.zIndex.panels,
          pointerEvents: "auto",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Box
          component="main"
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
            overflowX: "hidden",
            width: "100%",
            "& > *": {
              margin: 0,
            },
          }}
        >
          {/* Data page content */}
          <BasePanel
            fullHeight={false}
            includeHeaderSpacing={true}
            background="light"
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Container maxWidth="lg">
              <Typography
                variant="h1"
                sx={{
                  mb: 4,
                  textAlign: "center",
                  color: (theme) => theme.palette.primary.dark,
                }}
              >
                Data & Downloads
              </Typography>

              <Typography
                variant="h3"
                sx={{
                  mb: 6,
                  textAlign: "center",
                  color: (theme) => theme.palette.primary.dark,
                }}
              >
                Access COEQWAL datasets and scenario results
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 4,
                  mt: 6,
                }}
              >
                {/* Scenario data section */}
                <Box
                  sx={{
                    p: 4,

                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Scenario data
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Download raw CalSim3 scenario run files in zipped format.
                    CalSim3 model run files include input and output files in
                    wresl and dss formats.
                  </Typography>

                  {/* Dropdown for dataset selection */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="dataset-select-label">
                      Select Dataset
                    </InputLabel>
                    <Select
                      labelId="dataset-select-label"
                      id="dataset-select"
                      value={selectedDataset}
                      label="Select Dataset"
                      onChange={handleDatasetChange}
                    >
                      <MenuItem value="">
                        <em>Choose scenario</em>
                      </MenuItem>
                      <MenuItem value="1">s0002_9.3.1_danube_adj.zip</MenuItem>
                      <MenuItem value="2">s0003_9.3.1_danube_cc50.zip</MenuItem>
                      <MenuItem value="3">s0004_9.3.1_danube_cc75.zip</MenuItem>
                      <MenuItem value="4">s0005_9.3.1_danube_cc95.zip</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Download button - only show when a file is selected */}
                  {selectedDataset && (
                    <DownloadButton
                      fileId={selectedDataset}
                      filename={fileNames[selectedDataset] || selectedDataset}
                    />
                  )}

                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 3 }}
                  >
                    • CalSim3 model run files in zipped format
                    <br />
                    • Includes input and output files
                    <br />
                    • WRESL and DSS file formats
                    <br />• Complete scenario configuration
                  </Typography>
                </Box>

                {/* Model Documentation Section */}
                <Box
                  sx={{
                    p: 4,

                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Model Documentation
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Technical documentation, methodology, and data dictionaries
                    for COEQWAL models.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    • CalSim model specifications
                    <br />
                    • Scenario assumptions
                    <br />
                    • Data processing methods
                    <br />• API documentation
                  </Typography>
                </Box>

                {/* Research Publications Section */}
                <Box
                  sx={{
                    p: 4,

                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Research Publications
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Peer-reviewed papers, reports, and publications using
                    COEQWAL data and models.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    • Journal articles
                    <br />
                    • Technical reports
                    <br />
                    • Conference proceedings
                    <br />• Policy briefs
                  </Typography>
                </Box>

                {/* API Access Section */}
                <Box
                  sx={{
                    p: 4,

                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    API Access
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Programmatic access to COEQWAL data through our REST API and
                    data services.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    • RESTful API endpoints
                    <br />
                    • Real-time data feeds
                    <br />
                    • Query parameters
                    <br />• Authentication guides
                  </Typography>
                </Box>
              </Box>

              {/* Contact Information */}
              <Box
                sx={{
                  mt: 8,
                  p: 4,

                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Need Help?
                </Typography>
                <Typography variant="body1">
                  For questions about data access, technical support, or
                  collaboration opportunities, please contact the COEQWAL team.
                </Typography>
              </Box>
            </Container>
          </BasePanel>
        </Box>
      </Box>
    </>
  )
}
