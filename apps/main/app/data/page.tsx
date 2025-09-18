"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Grid,
  IconButton,
  CircularProgress,
  SelectChangeEvent,
  Alert,
} from "@repo/ui/mui"
import { Header } from "../components/Header"
import { ConnectedMultiDrawer } from "../components/ConnectedMultiDrawer"
import { LeadingMarkerText, ArrowHead } from "@repo/ui"
import DownloadButton from "../components/DownloadButton"
import type { Scenario } from "../types/scenarios"
import { getDownloadUrl } from "../utils/scenarioApi"

export default function DataPage() {
  const theme = useTheme()
  const [selectedZipDataset, setSelectedZipDataset] = useState("")
  const [selectedCsvDataset, setSelectedCsvDataset] = useState("")
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_COEQWAL_PRESIGN_DOWNLOAD_API_BASE

  useEffect(() => {
    let alive = true
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE}/scenario`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`List scenarios failed: ${res.status}`)

        const data = (await res.json()) as { scenarios: Scenario[] }
        if (!alive) return

        const sorted = [...(data.scenarios ?? [])].sort((a, b) =>
          a.scenario_id.localeCompare(b.scenario_id),
        )
        setScenarios(sorted)

        // Clear selections if they no longer exist
        if (!sorted.find((s) => s.scenario_id === selectedZipDataset)) {
          setSelectedZipDataset("")
        }
        if (!sorted.find((s) => s.scenario_id === selectedCsvDataset)) {
          setSelectedCsvDataset("")
        }
      } catch (e: any) {
        if (alive && e.name !== "AbortError") {
          setError(e?.message ?? "Failed to load scenarios")
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
      controller.abort()
    }
  }, [API_BASE]) // re-fetch if base changes

  const handleZipDatasetChange = (event: SelectChangeEvent<string>) => {
    setSelectedZipDataset(event.target.value)
  }

  const handleCsvDatasetChange = (event: SelectChangeEvent<string>) => {
    setSelectedCsvDataset(event.target.value)
  }

  // Filter scenarios that have zip files
  const zipScenarios = scenarios.filter((scenario) => scenario.files.zip)

  // Filter scenarios that have CSV files (either output_csv or sv_csv)
  const csvScenarios = scenarios.filter(
    (scenario) => scenario.files.output_csv || scenario.files.sv_csv,
  )

  // Get selected scenario data
  const selectedZipScenario = scenarios.find(
    (s) => s.scenario_id === selectedZipDataset,
  )
  const selectedCsvScenario = scenarios.find(
    (s) => s.scenario_id === selectedCsvDataset,
  )

  return (
    <>
      <Header />

      <ConnectedMultiDrawer
        drawerWidth={theme.layout.drawer.width}
        overlay={true}
        showRailButtons={false}
      />

      {/* Main content wrapper */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          margin: 0,
          padding: 0,
          overflowX: "hidden",
          width: "100%",
          zIndex: (theme) => theme.zIndex.panels,
          pointerEvents: "auto",
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
            minHeight: "100vh",
            backgroundColor: (theme) => theme.palette.utility.white,
            color: (theme) => theme.palette.blue.darkest,
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              py: 8,
              pt: (theme) => `calc(${theme.layout.headerHeight}px + 32px)`,
            }}
          >
            {/* Header with back arrow */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: (theme) => theme.layout.spacing.md,
                mb: 4,
              }}
            >
              <IconButton
                onClick={() => window.history.back()}
                sx={(theme) => {
                  const typography = theme.typography.h2
                  let fontSize = 16
                  if (typeof typography.fontSize === "string") {
                    if (typography.fontSize.includes("rem")) {
                      fontSize = parseFloat(typography.fontSize) * 16
                    } else {
                      fontSize = parseFloat(typography.fontSize)
                    }
                  } else if (typeof typography.fontSize === "number") {
                    fontSize = typography.fontSize
                  }

                  const lineHeight =
                    typeof typography.lineHeight === "number"
                      ? typography.lineHeight
                      : 1.2

                  const firstLineHeight = fontSize * lineHeight
                  const topOffset = (firstLineHeight - 48) / 2

                  return {
                    color: theme.palette.blue.darkest,
                    width: 48,
                    height: 48,
                    position: "relative",
                    top: Math.max(0, topOffset),
                  }
                }}
              >
                <ArrowHead
                  style={{
                    width: 28,
                    height: 28,
                    transform: "rotate(180deg)",
                  }}
                />
              </IconButton>
              <Typography
                variant="h2"
                sx={{
                  alignSelf: "flex-start",
                  color: (theme) => theme.palette.blue.darkest,
                }}
              >
                Data & downloads
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Content in Grid layout */}
            <Grid
              container
              spacing={4}
              sx={{
                mt: (theme) => theme.layout.spacing.sm,
                pointerEvents: "auto",
              }}
            >
              {/* Full run data Section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <LeadingMarkerText
                  title="Full scenario run files"
                  headlineVariant="h5"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.layout.spacing.sm,
                      opacity: 0.8,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Download raw CalSim3 scenario run files
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Access complete CalSim3 model run files in zipped format.
                    These files include input and output data in WRESL and DSS
                    formats, providing full scenario configuration details.
                  </Typography>

                  {loading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 2 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      {/* Dropdown for dataset selection */}
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="zip-dataset-select-label">
                          Select dataset
                        </InputLabel>
                        <Select
                          labelId="zip-dataset-select-label"
                          id="zip-dataset-select"
                          value={selectedZipDataset}
                          label="Select dataset"
                          onChange={handleZipDatasetChange}
                          disabled={zipScenarios.length === 0}
                        >
                          <MenuItem value="">
                            <em>Choose scenario</em>
                          </MenuItem>
                          {zipScenarios.map((scenario) => (
                            <MenuItem
                              key={scenario.scenario_id}
                              value={scenario.scenario_id}
                            >
                              {scenario.files.zip?.filename ||
                                scenario.scenario_id}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Download buttons (only show when a file is selected) */}
                      {selectedZipDataset && selectedZipScenario?.files.zip && (
                        <Box sx={{ mb: (theme) => theme.layout.spacing.sm }}>
                          <DownloadButton
                            fileId={selectedZipDataset}
                            filename={selectedZipScenario.files.zip.filename}
                            downloadUrl={getDownloadUrl(
                              selectedZipDataset,
                              "zip",
                            )}
                          />
                        </Box>
                      )}
                    </>
                  )}
                </LeadingMarkerText>
              </Grid>

              {/* Scenario Data Section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <LeadingMarkerText
                  title="Scenario data in csv format"
                  headlineVariant="h5"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.layout.spacing.sm,
                      opacity: 0.8,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Download CalSim3 scenario input and output data in csv
                    format
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Access COEQWAL CalSim3 SV input and variable output data in
                    csv format.
                  </Typography>

                  {loading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 2 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      {/* Dropdown for dataset selection */}
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="csv-dataset-select-label">
                          Select dataset
                        </InputLabel>
                        <Select
                          labelId="csv-dataset-select-label"
                          id="csv-dataset-select"
                          value={selectedCsvDataset}
                          label="Select dataset"
                          onChange={handleCsvDatasetChange}
                          disabled={csvScenarios.length === 0}
                        >
                          <MenuItem value="">
                            <em>Choose scenario</em>
                          </MenuItem>
                          {csvScenarios.map((scenario) => (
                            <MenuItem
                              key={scenario.scenario_id}
                              value={scenario.scenario_id}
                            >
                              {scenario.scenario_id}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Download buttons - show when a scenario is selected and files exist */}
                      {selectedCsvDataset && selectedCsvScenario && (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: (theme) => theme.layout.spacing.sm,
                            mb: (theme) => theme.layout.spacing.sm,
                          }}
                        >
                          {selectedCsvScenario.files.output_csv && (
                            <DownloadButton
                              fileId={`${selectedCsvDataset}_output`}
                              filename={
                                selectedCsvScenario.files.output_csv.filename
                              }
                              downloadUrl={getDownloadUrl(
                                selectedCsvDataset,
                                "output",
                              )}
                              variant="outlined"
                              sx={{
                                mb: (theme) =>
                                  theme.spacing(theme.cards.spacing.compact.sm),
                              }}
                            >
                              Download Output CSV
                            </DownloadButton>
                          )}
                          {selectedCsvScenario.files.sv_csv && (
                            <DownloadButton
                              fileId={`${selectedCsvDataset}_sv`}
                              filename={
                                selectedCsvScenario.files.sv_csv.filename
                              }
                              downloadUrl={getDownloadUrl(
                                selectedCsvDataset,
                                "sv",
                              )}
                              variant="outlined"
                            >
                              Download SV Input CSV
                            </DownloadButton>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </LeadingMarkerText>
              </Grid>

              {/* Model Documentation Section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <LeadingMarkerText
                  title="Model documentation"
                  headlineVariant="h5"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.layout.spacing.sm,
                      opacity: 0.8,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Technical documentation and user guides
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Comprehensive documentation for the COEQWAL CalSim3 model,
                    including technical specifications, user guides, and
                    methodology.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: "italic",
                      color: (theme) => theme.palette.blue.darkest,
                      opacity: 0.7,
                    }}
                  >
                    Documentation will be available soon.
                  </Typography>
                </LeadingMarkerText>
              </Grid>

              {/* Research Publications Section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <LeadingMarkerText
                  title="Research publications"
                  headlineVariant="h5"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.layout.spacing.sm,
                      opacity: 0.8,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Scientific papers and research findings
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Access peer-reviewed publications and research papers
                    related to the COEQWAL project and CalSim3 modeling efforts.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: "italic",
                      color: (theme) => theme.palette.blue.darkest,
                      opacity: 0.7,
                    }}
                  >
                    Publications will be available soon.
                  </Typography>
                </LeadingMarkerText>
              </Grid>

              {/* API Access Section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <LeadingMarkerText title="API access" headlineVariant="h5">
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.layout.spacing.sm,
                      opacity: 0.8,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Programmatic access to COEQWAL data
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    REST API endpoints for accessing scenario data, model
                    outputs, and other COEQWAL resources programmatically.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: "italic",
                      color: (theme) => theme.palette.blue.darkest,
                      opacity: 0.7,
                    }}
                  >
                    API documentation will be available soon.
                  </Typography>
                </LeadingMarkerText>
              </Grid>

              {/* Support & Contact Section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <LeadingMarkerText
                  title="Support & contact"
                  headlineVariant="h5"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.layout.spacing.sm,
                      opacity: 0.8,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Get help and technical support
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Contact our team for technical support, questions about the
                    data, or collaboration opportunities.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: "italic",
                      color: (theme) => theme.palette.blue.darkest,
                      opacity: 0.7,
                    }}
                  >
                    Contact information will be available soon.
                  </Typography>
                </LeadingMarkerText>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  )
}