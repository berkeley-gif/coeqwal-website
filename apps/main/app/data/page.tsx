"use client"

/**
 * Data Page - Data downloads and API access
 *
 * Provides downloadable data files and API documentation
 * for scenario outcomes and metrics.
 */

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  CircularProgress,
  SelectChangeEvent,
  Alert,
} from "@repo/ui/mui"
import { Header } from "../components/Header"
import { ArrowHead } from "@repo/ui"
import DownloadButton from "../components/DownloadButton"
import type { Scenario } from "../types/scenarioDownloads"
import {
  getFileDownloadUrl,
  fetchScenariosForDownload,
} from "../lib/api/fileDownloadApi"

export default function DataPage() {
  const [selectedZipDataset, setSelectedZipDataset] = useState("")
  const [selectedCsvDataset, setSelectedCsvDataset] = useState("")
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const data = await fetchScenariosForDownload()
        if (!alive) return

        const sorted = [...(data.scenarios ?? [])].sort((a, b) =>
          a.scenario_id.localeCompare(b.scenario_id),
        )
        setScenarios(sorted)
      } catch (error) {
        if (alive && error instanceof Error) {
          setError(error.message ?? "Failed to load scenarios")
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

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
            backgroundColor: (theme) => theme.palette.background.paper,
            color: (theme) => theme.palette.blue.darkest,
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              py: (theme) => theme.space.section.xl,
              pt: (theme) =>
                `calc(${theme.layout.headerHeight}px + ${theme.spacing(4)})`,
            }}
          >
            {/* Header with back arrow */}
            <Box
              sx={{
                position: "relative",
                mb: (theme) => theme.space.section.lg,
              }}
            >
              <IconButton
                onClick={() => window.history.back()}
                sx={{
                  position: "absolute",
                  left: -56,
                  top: 4,
                  color: (theme) => theme.palette.blue.darkest,
                  width: 40,
                  height: 40,
                }}
              >
                <ArrowHead
                  style={{
                    width: 24,
                    height: 24,
                    transform: "rotate(180deg)",
                  }}
                />
              </IconButton>
              <Typography
                variant="h5"
                sx={{
                  color: (theme) => theme.palette.blue.darkest,
                }}
              >
                Data & downloads
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: (theme) => theme.space.component.lg }}
              >
                {error}
              </Alert>
            )}

            {/* Content in Grid layout */}
            <Grid
              container
              columnSpacing={12}
              rowSpacing={4}
              sx={{
                mt: (theme) => theme.space.section.xs,
                pointerEvents: "auto",
              }}
            >
              {/* Full run data Section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    Full scenario run files
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.section.sm,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Access complete CalSim3 model run files in zipped format,
                    including input and output data in WRESL and DSS formats.
                  </Typography>

                  {loading ? (
                    <Alert
                      severity="info"
                      icon={<CircularProgress size={20} />}
                      sx={{ mb: 2 }}
                    >
                      Loading available datasets... This may take a few moments
                      on first visit as our servers wake up.
                    </Alert>
                  ) : (
                    <>
                      {/* Dropdown for dataset selection */}
                      <FormControl
                        fullWidth
                        sx={{ mb: (theme) => theme.space.section.sm }}
                      >
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
                        <Box sx={{ mb: (theme) => theme.space.section.xs }}>
                          <DownloadButton
                            fileId={selectedZipDataset}
                            filename={selectedZipScenario.files.zip.filename}
                            downloadUrl={getFileDownloadUrl(
                              selectedZipDataset,
                              "zip",
                            )}
                          />
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Grid>

              {/* Scenario data section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    Scenario data in csv format
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.section.sm,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Download CalSim3 scenario input and output data in csv
                    format, including SV input and variable output files.
                  </Typography>

                  {loading ? (
                    <Alert
                      severity="info"
                      icon={<CircularProgress size={20} />}
                      sx={{ mb: 2 }}
                    >
                      Loading available datasets... This may take a few moments
                      on first visit as our servers wake up.
                    </Alert>
                  ) : (
                    <>
                      {/* Dropdown for dataset selection */}
                      <FormControl
                        fullWidth
                        sx={{ mb: (theme) => theme.space.section.sm }}
                      >
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
                            gap: (theme) => theme.space.gap.lg,
                            mb: (theme) => theme.space.section.xs,
                          }}
                        >
                          {selectedCsvScenario.files.output_csv && (
                            <DownloadButton
                              fileId={`${selectedCsvDataset}_output`}
                              filename={
                                selectedCsvScenario.files.output_csv.filename
                              }
                              downloadUrl={getFileDownloadUrl(
                                selectedCsvDataset,
                                "output",
                              )}
                              variant="outlined"
                              sx={{
                                mb: (theme) => theme.space.component.xs,
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
                              downloadUrl={getFileDownloadUrl(
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
                </Box>
              </Grid>

              {/* Model documentation section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    Model documentation
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.component.lg,
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
                      color: (theme) => theme.palette.grey[600],
                    }}
                  >
                    Coming soon
                  </Typography>
                </Box>
              </Grid>

              {/* Research publications section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    Research publications
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.component.lg,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    Peer-reviewed publications and research papers related to
                    the COEQWAL project and CalSim3 modeling efforts.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: "italic",
                      color: (theme) => theme.palette.grey[600],
                    }}
                  >
                    Coming soon
                  </Typography>
                </Box>
              </Grid>

              {/* API access section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    API access
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.component.lg,
                      color: (theme) => theme.palette.blue.darkest,
                    }}
                  >
                    REST API endpoints for programmatic access to scenario data,
                    model outputs, and COEQWAL resources.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: "italic",
                      color: (theme) => theme.palette.grey[600],
                    }}
                  >
                    Coming soon
                  </Typography>
                </Box>
              </Grid>

              {/* Support & contact section */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    Support & contact
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.component.lg,
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
                      color: (theme) => theme.palette.grey[600],
                    }}
                  >
                    Coming soon
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  )
}
