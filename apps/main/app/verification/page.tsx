"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from "@repo/ui/mui"
import { ExpandMoreIcon } from "@repo/ui/mui"
import { Header } from "../components/Header"
import { DEFAULT_API_BASE } from "@repo/data/coeqwal/api"

interface CheckItem {
  metric: string
  section: string
  entity: string
  expected: number | null
  actual: number | null
  status: string
}

interface LayerSummary {
  total: number
  pass: number
  fail: number
  skip?: number
  no_db?: number
  mismatch?: number
}

interface ScenarioSummary {
  scenario_id: string
  layer2: LayerSummary | null
  layer2_timestamp: string | null
  layer2_db_connected: boolean | null
  layer3: LayerSummary | null
  layer3_timestamp: string | null
}

interface NotImplementedMetric {
  metric: string
  section: string
  description: string
  variable?: string
}

interface VerificationStatus {
  scenarios: ScenarioSummary[]
  not_implemented: NotImplementedMetric[]
  total_scenarios: number
}

interface ScenarioDetail {
  scenario_id: string
  layer2: {
    summary: LayerSummary
    checks: CheckItem[]
    timestamp: string
    db_connected: boolean
  } | null
  layer3: {
    summary: LayerSummary
    checks: CheckItem[]
    timestamp: string
  } | null
  sections: Record<string, CheckItem[]>
  not_implemented: NotImplementedMetric[]
}

function StatusChip({ status }: { status: string }) {
  const colorMap: Record<
    string,
    "success" | "error" | "warning" | "default" | "info"
  > = {
    pass: "success",
    fail: "error",
    skip: "default",
    no_db: "warning",
    mismatch: "error",
  }
  return (
    <Chip
      label={status.toUpperCase()}
      color={colorMap[status] || "default"}
      size="small"
      sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
    />
  )
}

function SummaryChips({ summary }: { summary: LayerSummary }) {
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {summary.pass > 0 && (
        <Chip
          label={`${summary.pass} pass`}
          color="success"
          size="small"
          variant="outlined"
          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
        />
      )}
      {summary.fail > 0 && (
        <Chip
          label={`${summary.fail} fail`}
          color="error"
          size="small"
          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
        />
      )}
      {(summary.skip ?? 0) > 0 && (
        <Chip
          label={`${summary.skip} skip`}
          size="small"
          variant="outlined"
          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
        />
      )}
      {(summary.no_db ?? 0) > 0 && (
        <Chip
          label={`${summary.no_db} no_db`}
          color="warning"
          size="small"
          variant="outlined"
          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
        />
      )}
    </Box>
  )
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "—"
  try {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ts
  }
}

function formatNumber(val: number | null): string {
  if (val === null || val === undefined) return "—"
  if (Math.abs(val) >= 1000) return val.toLocaleString("en-US", { maximumFractionDigits: 1 })
  if (Math.abs(val) >= 1) return val.toFixed(2)
  return val.toFixed(4)
}

export default function VerificationPage() {
  const theme = useTheme()
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [detail, setDetail] = useState<ScenarioDetail | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${DEFAULT_API_BASE}/verification/status`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setStatus)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedScenario) {
      setDetail(null)
      return
    }
    setDetailLoading(true)
    fetch(`${DEFAULT_API_BASE}/verification/status/${selectedScenario}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setDetailLoading(false))
  }, [selectedScenario])

  const overallPass =
    status?.scenarios.every(
      (s) => (s.layer2?.fail ?? 0) === 0 && (s.layer3?.fail ?? 0) === 0
    ) ?? false

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 6, mt: 8 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Data Verification Status
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Automated verification of data accuracy across the ETL pipeline.
          Each scenario is checked at multiple layers: extraction (Layer 1),
          statistics computation (Layer 2), and API serving (Layer 3).
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load verification status: {error}
          </Alert>
        )}

        {status && (
          <>
            <Box sx={{ mb: 4 }}>
              <Chip
                label={
                  overallPass
                    ? `All ${status.total_scenarios} scenarios passing`
                    : "Some checks failing"
                }
                color={overallPass ? "success" : "warning"}
                sx={{ fontSize: "0.9rem", py: 2, px: 1 }}
              />
            </Box>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ mb: 4 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: theme.palette.grey[50] }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>Scenario</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Layer 2 (ETL → DB)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Layer 3 (DB → API)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Checked</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {status.scenarios.map((s) => (
                    <TableRow
                      key={s.scenario_id}
                      hover
                      sx={{
                        cursor: "pointer",
                        bgcolor:
                          selectedScenario === s.scenario_id
                            ? theme.palette.action.selected
                            : undefined,
                      }}
                      onClick={() =>
                        setSelectedScenario(
                          selectedScenario === s.scenario_id
                            ? null
                            : s.scenario_id
                        )
                      }
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace", fontWeight: 600 }}
                        >
                          {s.scenario_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {s.layer2 ? (
                          <SummaryChips summary={s.layer2} />
                        ) : (
                          <Chip
                            label="not run"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {s.layer3 ? (
                          <SummaryChips summary={s.layer3} />
                        ) : (
                          <Chip
                            label="not run"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(
                            s.layer2_timestamp || s.layer3_timestamp
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Scenario Detail */}
            {selectedScenario && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedScenario} — Detailed Checks
                </Typography>

                {detailLoading && <CircularProgress size={24} />}

                {detail && detail.sections && (
                  <Box>
                    {Object.entries(detail.sections).map(
                      ([sectionName, checks]) => (
                        <Accordion key={sectionName} variant="outlined">
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                width: "100%",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontFamily: "monospace",
                                  minWidth: 180,
                                }}
                              >
                                {sectionName}
                              </Typography>
                              <Chip
                                label={`${checks.filter((c: CheckItem) => c.status === "pass").length}/${checks.length} pass`}
                                color={
                                  checks.every(
                                    (c: CheckItem) =>
                                      c.status === "pass" ||
                                      c.status === "skip"
                                  )
                                    ? "success"
                                    : "warning"
                                }
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Entity</TableCell>
                                    <TableCell>Metric</TableCell>
                                    <TableCell align="right">
                                      Expected
                                    </TableCell>
                                    <TableCell align="right">Actual</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {checks.map(
                                    (c: CheckItem, i: number) => (
                                      <TableRow key={i}>
                                        <TableCell
                                          sx={{ fontFamily: "monospace" }}
                                        >
                                          {c.entity}
                                        </TableCell>
                                        <TableCell
                                          sx={{ fontFamily: "monospace" }}
                                        >
                                          {c.metric}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{ fontFamily: "monospace" }}
                                        >
                                          {formatNumber(c.expected)}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{ fontFamily: "monospace" }}
                                        >
                                          {formatNumber(c.actual)}
                                        </TableCell>
                                        <TableCell>
                                          <StatusChip status={c.status} />
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </AccordionDetails>
                        </Accordion>
                      )
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Not Yet Implemented */}
            <Accordion variant="outlined" sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Typography variant="h6">
                    Not Yet Implemented
                  </Typography>
                  <Chip
                    label={`${status.not_implemented.length} metrics`}
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  These metrics are on the statistics list but do not yet
                  have ETL pipelines or API endpoints.
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Section</TableCell>
                        <TableCell>Metric</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>CalSim Variable</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {status.not_implemented.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {m.section}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {m.metric}
                          </TableCell>
                          <TableCell>{m.description}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {m.variable || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </Container>
    </Box>
  )
}
