"use client"

/**
 * Data page: Data downloads and API access
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
  CircularProgress,
  SelectChangeEvent,
  Alert,
  useTheme,
  icons,
} from "@repo/ui/mui"
import { CircularArrowButton, ScenarioBadge } from "@repo/ui"
import DownloadButton from "../components/DownloadButton"
import { CenteredTextSection } from "../components/CenteredTextSection"
import type { Scenario } from "../types/scenarioDownloads"
import {
  getFileDownloadUrl,
  fetchScenariosForDownload,
} from "../lib/api/fileDownloadApi"
import { type ScenarioTheme } from "../content/scenarios"
import { useScenarioList } from "../features/scenarios/hooks"
import { THEME_LABEL_CONFIG } from "../content/themes"
import {
  STRATEGY_DOCUMENTS,
  getStrategyDocumentUrl,
} from "../content/waterManagementStrategies"
import {
  OUTCOME_LEVEL_DOCUMENTS,
  getOutcomeLevelDocumentUrl,
} from "../content/outcomeLevelMethodology"
import {
  BACKGROUND_BRIEF_DOCUMENTS,
  getBackgroundBriefDocumentUrl,
} from "../content/backgroundBriefs"

const { OpenInNew: OpenInNewIcon } = icons

const THEME_ORDER: ScenarioTheme[] = [
  "baseline",
  "cws",
  "ag_gw",
  "eco",
  "delta",
  "unthemed",
]

function ScenarioOption({ scenarioId }: { scenarioId: string }) {
  const theme = useTheme()
  const { getDisplayName } = useScenarioList()

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
        {getDisplayName(scenarioId)}
      </Typography>
    </Box>
  )
}

function SelectedScenarioValue({ scenarioId }: { scenarioId: string }) {
  const theme = useTheme()
  const { getDisplayName } = useScenarioList()

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
        {getDisplayName(scenarioId)}
      </Typography>
    </Box>
  )
}

/**
 * Grouped scenario Select. Encapsulates all styling and rendering logic.
 * Callers supply id, value, onChange, the grouped data, and disabled state.
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

/**
 * Flat (non-grouped) Select for the water management strategy documents.
 * Options are just {id, label} pairs — no theme grouping needed since these
 * PDFs aren't scenario-resolved.
 */
function StrategyDocumentSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (event: SelectChangeEvent<string>) => void
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
      },
    },
  }

  return (
    <FormControl fullWidth sx={{ mb: (t) => t.space.section.sm }}>
      <Select
        id={id}
        value={value}
        onChange={onChange}
        displayEmpty
        sx={SELECT_SX}
        MenuProps={menuProps}
        renderValue={(v) => {
          const doc = STRATEGY_DOCUMENTS.find((d) => d.id === v)
          return doc ? doc.label : "Choose a strategy"
        }}
      >
        {STRATEGY_DOCUMENTS.map((doc) => (
          <MenuItem key={doc.id} value={doc.id} sx={{ py: 1 }}>
            {doc.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

/**
 * Flat (non-grouped) Select for the outcome level methodology documents.
 * Options are just {id, label} pairs — no theme grouping needed since these
 * PDFs aren't scenario-resolved.
 */
function OutcomeLevelDocumentSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (event: SelectChangeEvent<string>) => void
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
      },
    },
  }

  return (
    <FormControl fullWidth sx={{ mb: (t) => t.space.section.sm }}>
      <Select
        id={id}
        value={value}
        onChange={onChange}
        displayEmpty
        sx={SELECT_SX}
        MenuProps={menuProps}
        renderValue={(v) => {
          const doc = OUTCOME_LEVEL_DOCUMENTS.find((d) => d.id === v)
          return doc ? doc.label : "Choose an outcome level brief"
        }}
      >
        {OUTCOME_LEVEL_DOCUMENTS.map((doc) => (
          <MenuItem key={doc.id} value={doc.id} sx={{ py: 1 }}>
            {doc.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

/**
 * Flat (non-grouped) Select for the background brief documents.
 * Options are just {id, label} pairs — no theme grouping needed since these
 * PDFs aren't scenario-resolved.
 */
function BackgroundBriefDocumentSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (event: SelectChangeEvent<string>) => void
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
      },
    },
  }

  return (
    <FormControl fullWidth sx={{ mb: (t) => t.space.section.sm }}>
      <Select
        id={id}
        value={value}
        onChange={onChange}
        displayEmpty
        sx={SELECT_SX}
        MenuProps={menuProps}
        renderValue={(v) => {
          const doc = BACKGROUND_BRIEF_DOCUMENTS.find((d) => d.id === v)
          return doc ? doc.label : "Choose a background brief"
        }}
      >
        {BACKGROUND_BRIEF_DOCUMENTS.map((doc) => (
          <MenuItem key={doc.id} value={doc.id} sx={{ py: 1 }}>
            {doc.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

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

export default function DataPage() {
  const [selectedZipDataset, setSelectedZipDataset] = useState("")
  const [selectedCsvDataset, setSelectedCsvDataset] = useState("")
  const [selectedStrategyDoc, setSelectedStrategyDoc] = useState("")
  const [selectedOutcomeLevelDoc, setSelectedOutcomeLevelDoc] = useState("")
  const [selectedBackgroundBriefDoc, setSelectedBackgroundBriefDoc] =
    useState("")
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const theme = useTheme()
  const { getThemeForScenario } = useScenarioList()

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

  const handleStrategyDocChange = (event: SelectChangeEvent<string>) => {
    setSelectedStrategyDoc(event.target.value)
  }

  const handleOutcomeLevelDocChange = (event: SelectChangeEvent<string>) => {
    setSelectedOutcomeLevelDoc(event.target.value)
  }

  const handleBackgroundBriefDocChange = (event: SelectChangeEvent<string>) => {
    setSelectedBackgroundBriefDoc(event.target.value)
  }

  // Filter scenarios that have zip files
  const zipScenarios = scenarios.filter((scenario) => scenario.files.zip)

  // Filter scenarios that have CSV files (either output_csv or sv_csv)
  const csvScenarios = scenarios.filter(
    (scenario) => scenario.files.output_csv || scenario.files.sv_csv,
  )

  const zipGroups = useMemo(() => {
    const buckets = new Map<ScenarioTheme, typeof zipScenarios>()
    THEME_ORDER.forEach((t) => buckets.set(t, []))
    zipScenarios.forEach((s) => {
      const t = getThemeForScenario(s.scenario_id)
      buckets.get(t)?.push(s)
    })
    return THEME_ORDER.map((t) => ({
      theme: t,
      scenarios: buckets.get(t) ?? [],
    })).filter(({ scenarios: g }) => g.length > 0)
  }, [zipScenarios, getThemeForScenario])

  const csvGroups = useMemo(() => {
    const buckets = new Map<ScenarioTheme, typeof csvScenarios>()
    THEME_ORDER.forEach((t) => buckets.set(t, []))
    csvScenarios.forEach((s) => {
      const t = getThemeForScenario(s.scenario_id)
      buckets.get(t)?.push(s)
    })
    return THEME_ORDER.map((t) => ({
      theme: t,
      scenarios: buckets.get(t) ?? [],
    })).filter(({ scenarios: g }) => g.length > 0)
  }, [csvScenarios, getThemeForScenario])

  // Get selected scenario data
  const selectedZipScenario = scenarios.find(
    (s) => s.scenario_id === selectedZipDataset,
  )
  const selectedCsvScenario = scenarios.find(
    (s) => s.scenario_id === selectedCsvDataset,
  )
  const selectedStrategyDocument = STRATEGY_DOCUMENTS.find(
    (d) => d.id === selectedStrategyDoc,
  )
  const selectedOutcomeLevelDocument = OUTCOME_LEVEL_DOCUMENTS.find(
    (d) => d.id === selectedOutcomeLevelDoc,
  )
  const selectedBackgroundBriefDocument = BACKGROUND_BRIEF_DOCUMENTS.find(
    (d) => d.id === selectedBackgroundBriefDoc,
  )

  return (
    <>
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
              <CircularArrowButton
                onClick={() => {
                  if (typeof window !== "undefined") window.history.back()
                }}
                size={40}
                rotation="90deg"
                color={theme.palette.common.white}
                ariaLabel="Go back"
                sx={{
                  position: "absolute",
                  left: -56,
                  top: 4,
                }}
              />
              <Typography variant="h4">Data & Documentation</Typography>
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
              rowSpacing={8}
              sx={{
                mt: (theme) => theme.space.section.xs,
                pointerEvents: "auto",
              }}
            >
              {/* Data column */}

              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <Typography
                  variant="h4"
                  sx={{ mb: (theme) => theme.space.section.md }}
                >
                  Data
                </Typography>

                {/* Full run data Section */}
                <Box sx={{ mb: (theme) => theme.space.section.lg }}>
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

                {/* Scenario data section */}
                <Box sx={{ mb: (theme) => theme.space.section.lg }}>
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

                {/* API access section */}
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
                      mb: (theme) => theme.space.section.sm,
                    }}
                  >
                    REST API endpoints for programmatic access to scenario data,
                    model outputs, and COEQWAL resources.
                  </Typography>

                  <DownloadButton
                    fileId="api-docs"
                    filename="api-docs"
                    downloadUrl="https://api.coeqwal.org/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<OpenInNewIcon />}
                  >
                    COEQWAL API
                  </DownloadButton>
                </Box>
              </Grid>

              {/* Documentation column */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                <Typography
                  variant="h4"
                  sx={{ mb: (theme) => theme.space.section.md }}
                >
                  Documentation
                </Typography>

                {/* Background briefs section */}
                <Box sx={{ mb: (theme) => theme.space.section.lg }}>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    Background briefs
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.section.sm,
                    }}
                  >
                    Various project background documents.
                  </Typography>

                  <BackgroundBriefDocumentSelect
                    id="background-brief-doc-select"
                    value={selectedBackgroundBriefDoc}
                    onChange={handleBackgroundBriefDocChange}
                  />

                  {selectedBackgroundBriefDocument && (
                    <Box sx={{ mb: (theme) => theme.space.section.xs }}>
                      <DownloadButton
                        fileId={selectedBackgroundBriefDocument.id}
                        filename={selectedBackgroundBriefDocument.file}
                        downloadUrl={getBackgroundBriefDocumentUrl(
                          selectedBackgroundBriefDocument.file,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={<OpenInNewIcon />}
                      >
                        View {selectedBackgroundBriefDocument.label}
                      </DownloadButton>
                    </Box>
                  )}
                </Box>

                {/* Water management strategies section */}
                <Box sx={{ mb: (theme) => theme.space.section.lg }}>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    Water management strategies
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.section.sm,
                    }}
                  >
                    Documentation of COEQWAL&apos;s water management strategies
                    and CalSim3 model specifications.
                  </Typography>

                  <StrategyDocumentSelect
                    id="strategy-doc-select"
                    value={selectedStrategyDoc}
                    onChange={handleStrategyDocChange}
                  />

                  {selectedStrategyDocument && (
                    <Box sx={{ mb: (theme) => theme.space.section.xs }}>
                      <DownloadButton
                        fileId={selectedStrategyDocument.id}
                        filename={selectedStrategyDocument.file}
                        downloadUrl={getStrategyDocumentUrl(
                          selectedStrategyDocument.file,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={<OpenInNewIcon />}
                      >
                        View {selectedStrategyDocument.label}
                      </DownloadButton>
                    </Box>
                  )}
                </Box>

                {/* Outcome level methodology section */}
                <Box sx={{ mb: (theme) => theme.space.section.lg }}>
                  <Typography
                    variant="h5"
                    sx={{ mb: (theme) => theme.space.component.lg }}
                  >
                    Outcome level methodology
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: (theme) => theme.space.section.sm,
                    }}
                  >
                    Documentation of methodology used to calculate outcome
                    levels.
                  </Typography>

                  <OutcomeLevelDocumentSelect
                    id="outcome-level-doc-select"
                    value={selectedOutcomeLevelDoc}
                    onChange={handleOutcomeLevelDocChange}
                  />

                  {selectedOutcomeLevelDocument && (
                    <Box sx={{ mb: (theme) => theme.space.section.xs }}>
                      <DownloadButton
                        fileId={selectedOutcomeLevelDocument.id}
                        filename={selectedOutcomeLevelDocument.file}
                        downloadUrl={getOutcomeLevelDocumentUrl(
                          selectedOutcomeLevelDocument.file,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={<OpenInNewIcon />}
                      >
                        View {selectedOutcomeLevelDocument.label}
                      </DownloadButton>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
        <CenteredTextSection
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
