"use client"

/**
 * Data Page - Data downloads and API access
 *
 * Provides downloadable data files and API documentation
 * for scenario outcomes and metrics.
 */

import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Container,
  Select,
  MenuItem,
  ListSubheader,
  FormControl,
  Grid,
  IconButton,
  CircularProgress,
  SelectChangeEvent,
  Alert,
  useTheme,
} from "@repo/ui/mui"
import { Header } from "../components/Header"
import { ArrowHead, ScenarioBadge } from "@repo/ui"
import DownloadButton from "../components/DownloadButton"
import { ContactSection } from "../components/ContactSection"
import type { Scenario } from "../types/scenarioDownloads"
import {
  getFileDownloadUrl,
  fetchScenariosForDownload,
} from "../lib/api/fileDownloadApi"
import {
  getScenarioLabel,
  getScenarioTheme,
  type ScenarioTheme,
} from "../content/scenarios"
import { THEME_LABEL_CONFIG } from "../content/themes"

// Theme order matches ScenarioSelectionSidebar
const THEME_ORDER: ScenarioTheme[] = [
  "baseline",
  "cws",
  "ag_gw",
  "eco",
  "delta",
]

/** Group a scenario list by theme, preserving THEME_ORDER, dropping empty groups. */
function groupByTheme<T extends { scenario_id: string }>(
  items: T[],
): { theme: ScenarioTheme; scenarios: T[] }[] {
  const buckets = new Map<ScenarioTheme, T[]>()
  THEME_ORDER.forEach((t) => buckets.set(t, []))
  items.forEach((s) => {
    const t = getScenarioTheme(s.scenario_id)
    buckets.get(t)?.push(s)
  })
  return THEME_ORDER.map((t) => ({
    theme: t,
    scenarios: buckets.get(t) ?? [],
  })).filter(({ scenarios }) => scenarios.length > 0)
}

// ── Shared dropdown option components ────────────────────────────────────────

/**
 * Two-row dropdown option matching the StrategyHeader eyebrow convention.
 * Top row: SCENARIOID (overline). Bottom row: full scenario label.
 * Theme is conveyed by the ListSubheader group above, so no badge here.
 */
function ScenarioOption({ scenarioId }: { scenarioId: string }) {
  const theme = useTheme()
  const label = getScenarioLabel(scenarioId)

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography
        component="span"
        variant="overline"
        sx={{
          color: theme.palette.grey[600],
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: "0.7rem",
          lineHeight: 1,
        }}
      >
        {scenarioId}
      </Typography>
      <Typography
        variant="body2"
        sx={{ lineHeight: 1.3, color: theme.palette.text.primary }}
      >
        {label}
      </Typography>
    </Box>
  )
}

/**
 * Compact single-line renderValue for the closed Select state.
 * SCENARIOID (overline) + full label, matching the StrategyHeader eyebrow style.
 */
function SelectedScenarioValue({ scenarioId }: { scenarioId: string }) {
  const theme = useTheme()
  const label = getScenarioLabel(scenarioId)

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        component="span"
        variant="overline"
        sx={{
          color: theme.palette.grey[600],
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: "0.7rem",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {scenarioId}
      </Typography>
      <Typography component="span" variant="body2">
        {label}
      </Typography>
    </Box>
  )
}

/**
 * Grouped scenario Select. Encapsulates all styling and rendering logic;
 * callers supply id, value, onChange, the grouped data, and disabled state.
 */
function ScenarioSelect({
  id,
  value,
  onChange,
  groups,
  disabled = false,
}: {
  id: string
  value: string
  onChange: (event: SelectChangeEvent<string>) => void
  groups: { theme: ScenarioTheme; scenarios: Scenario[] }[]
  disabled?: boolean
}) {
  const theme = useTheme()
  const menuProps = {
    PaperProps: {
      sx: {
        mt: 0.5,
        backgroundColor: "common.white",
        boxShadow: theme.shadow.sm,
        border: `1px solid ${theme.palette.grey[200]}`,
        borderRadius: theme.borderRadius.md,
        "& .MuiMenuItem-root": {
          py: 1,
          whiteSpace: "normal" as const,
          wordBreak: "break-word" as const,
          "&:hover": { backgroundColor: theme.palette.grey[50] },
          "&.Mui-selected": {
            backgroundColor: theme.palette.grey[100],
            "&:hover": { backgroundColor: theme.palette.grey[100] },
          },
        },
        "& .MuiListSubheader-root": {
          lineHeight: 1,
          backgroundColor: "common.white",
        },
      },
    },
  }

  return (
    <FormControl fullWidth sx={{ mb: (t) => t.space.section.sm }}>
      <Select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        displayEmpty
        sx={SELECT_SX}
        MenuProps={menuProps}
        renderValue={(v) =>
          v ? (
            <SelectedScenarioValue scenarioId={v as string} />
          ) : (
            "Choose a scenario"
          )
        }
      >
        {groups.flatMap(({ theme: themeKey, scenarios: group }) => [
          <ThemeSubheader key={`hdr-${themeKey}`} themeKey={themeKey} />,
          ...group.map((scenario) => (
            <MenuItem
              key={scenario.scenario_id}
              value={scenario.scenario_id}
              sx={{ py: 1 }}
            >
              <ScenarioOption scenarioId={scenario.scenario_id} />
            </MenuItem>
          )),
        ])}
      </Select>
    </FormControl>
  )
}

/**
 * Non-selectable theme group header for the Select dropdown.
 * Renders a ScenarioBadge, matching the sidebar accordion headers.
 */
function ThemeSubheader({ themeKey }: { themeKey: ScenarioTheme }) {
  const theme = useTheme()
  return (
    <ListSubheader
      sx={{
        display: "flex",
        alignItems: "center",
        pt: 1.5,
        pb: 0.5,
        px: 2,
        lineHeight: 1,
      }}
    >
      <ScenarioBadge
        label={THEME_LABEL_CONFIG[themeKey].label}
        backgroundColor={theme.palette.waterThemes[themeKey].background}
        color={theme.palette.waterThemes[themeKey].text}
      />
    </ListSubheader>
  )
}

// ── Shared Select styling (matches CompactSelect visual language) ─────────────

const SELECT_SX = {
  backgroundColor: "common.white",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "grey.300",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "grey.400",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "grey.500",
    borderWidth: "1px",
  },
}

// ── Page component ────────────────────────────────────────────────────────────

export default function DataPage() {
  const [selectedZipDataset, setSelectedZipDataset] = useState("")
  const [selectedCsvDataset, setSelectedCsvDataset] = useState("")
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const theme = useTheme()

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const data = await fetchScenariosForDownload()
        if (!alive) return

        const sorted = [...(data.scenarios ?? [])].sort((a, b) => {
          if (a.scenario_id === "s0020") return -1
          if (b.scenario_id === "s0020") return 1
          return a.scenario_id.localeCompare(b.scenario_id)
        })
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

  const zipGroups = useMemo(() => groupByTheme(zipScenarios), [zipScenarios])
  const csvGroups = useMemo(() => groupByTheme(csvScenarios), [csvScenarios])

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
          backgroundColor: theme.palette.brand.panelMedium,
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
            color: (theme) => theme.palette.common.white,
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
                  color: (theme) => theme.palette.common.white,
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
              <Typography variant="h4">Data & downloads</Typography>
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
                      <ScenarioSelect
                        id="zip-dataset-select"
                        value={selectedZipDataset}
                        onChange={handleZipDatasetChange}
                        groups={zipGroups}
                        disabled={zipScenarios.length === 0}
                      />

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
                      <ScenarioSelect
                        id="csv-dataset-select"
                        value={selectedCsvDataset}
                        onChange={handleCsvDatasetChange}
                        groups={csvGroups}
                        disabled={csvScenarios.length === 0}
                      />

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
                      color: (theme) => theme.palette.grey[300],
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
                    }}
                  >
                    Peer-reviewed publications and research papers related to
                    the COEQWAL project and CalSim3 modeling efforts.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: "italic",
                      color: (theme) => theme.palette.grey[300],
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
                    }}
                  >
                    REST API endpoints for programmatic access to scenario data,
                    model outputs, and COEQWAL resources.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: "italic",
                      color: (theme) => theme.palette.grey[300],
                    }}
                  >
                    Coming soon
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
        <ContactSection
          title="Get Involved"
          id="getInvolved"
          ariaLabel="get involved"
          text="Do you have questions or feedback about our project? 
                            Would you like to be involved in future phases of this work? Please email: "
          email="coeqwal@berkeley.edu"
        />
      </Box>
    </>
  )
}
