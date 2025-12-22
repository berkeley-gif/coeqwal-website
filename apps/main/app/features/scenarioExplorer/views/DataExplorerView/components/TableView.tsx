"use client"

import React from "react"
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  Button,
} from "@repo/ui/mui"
import { SearchIcon } from "@repo/ui/mui"
import { StyledTextInput } from "@repo/ui"
import { useScenarioExplorerStore } from "../../../store"
import {
  outcomeMetrics,
  outcomeCategories,
  type OutcomeMetric,
  type SpatialType,
} from "../outcomeDefinitions"
import {
  exportTableAsCSV,
  exportAsJSON,
  getTimestampedFilename,
} from "../utils/exportUtils"

/**
 * TableView: Filterable table showing all metrics
 */
export default function TableView() {
  const theme = useTheme()
  const { selectedScenarios, setActiveView } = useScenarioExplorerStore()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [spatialFilter, setSpatialFilter] = React.useState<string>("all")
  const [showTiersOnly, setShowTiersOnly] = React.useState(false)
  const [showMapOnly, setShowMapOnly] = React.useState(false)

  // Get unique spatial types
  const spatialTypes = React.useMemo(() => {
    const types = new Set<SpatialType>()
    outcomeMetrics.forEach((m) => types.add(m.spatialType))
    return Array.from(types).sort()
  }, [])

  // Filter metrics
  const filteredMetrics = React.useMemo(() => {
    return outcomeMetrics.filter((metric) => {
      // Search filter
      if (
        searchQuery &&
        !metric.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !metric.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Category filter
      if (categoryFilter !== "all" && metric.category !== categoryFilter) {
        return false
      }

      // Spatial filter
      if (spatialFilter !== "all" && metric.spatialType !== spatialFilter) {
        return false
      }

      // Tier filter
      if (showTiersOnly && !metric.isTier) {
        return false
      }

      // Map filter
      if (showMapOnly && !metric.showOnMap) {
        return false
      }

      return true
    })
  }, [searchQuery, categoryFilter, spatialFilter, showTiersOnly, showMapOnly])

  // Empty state when no scenarios selected
  if (selectedScenarios.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: theme.spacing(theme.cards.spacing.standard),
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.grey[600],
            mb: theme.spacing(2),
          }}
        >
          No scenarios selected
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.grey[500],
            mb: theme.spacing(3),
            maxWidth: "400px",
          }}
        >
          Select scenarios in List View to view detailed metrics and export
          data.
        </Typography>
        <Button
          variant="contained"
          onClick={() => setActiveView("list")}
          sx={{
            backgroundColor: theme.palette.blue.darkest,
            color: theme.palette.common.white,
            textTransform: "none",
            "&:hover": {
              backgroundColor: theme.palette.blue.bright,
            },
          }}
        >
          Go to list view
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Filter Bar */}
      <Box
        sx={{
          p: theme.spacing(2),
          backgroundColor: theme.palette.common.white,
          borderBottom: theme.border.medium,
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing(2),
        }}
      >
        {/* Search */}
        <Box sx={{ minWidth: theme.spacing(35) }}>
          <StyledTextInput
            placeholder="Search metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            startIcon={<SearchIcon />}
            showClearButton={!!searchQuery}
            onClear={() => setSearchQuery("")}
          />
        </Box>

        {/* Category Filter */}
        <FormControl size="small" sx={{ minWidth: theme.spacing(25) }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {outcomeCategories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Spatial Type Filter */}
        <FormControl size="small" sx={{ minWidth: theme.spacing(25) }}>
          <InputLabel>Location type</InputLabel>
          <Select
            value={spatialFilter}
            label="Location type"
            onChange={(e) => setSpatialFilter(e.target.value)}
          >
            <MenuItem value="all">All locations</MenuItem>
            {spatialTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Quick Filters */}
        <Box
          sx={{ display: "flex", gap: theme.spacing(1), alignItems: "center" }}
        >
          <Chip
            label="Outcomes only"
            onClick={() => setShowTiersOnly(!showTiersOnly)}
            color={showTiersOnly ? "primary" : "default"}
            variant={showTiersOnly ? "filled" : "outlined"}
            sx={{ cursor: "pointer" }}
          />
          <Chip
            label="Map only"
            onClick={() => setShowMapOnly(!showMapOnly)}
            color={showMapOnly ? "primary" : "default"}
            variant={showMapOnly ? "filled" : "outlined"}
            sx={{ cursor: "pointer" }}
          />
        </Box>

        {/* Export Buttons and Results Count */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: theme.spacing(1),
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              exportTableAsCSV(
                filteredMetrics,
                getTimestampedFilename("coeqwal-metrics", "csv"),
              )
            }
            sx={{ textTransform: "none" }}
          >
            Export as CSV
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              exportAsJSON(
                filteredMetrics,
                getTimestampedFilename("coeqwal-metrics", "json"),
              )
            }
            sx={{ textTransform: "none" }}
          >
            Export as JSON
          </Button>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.grey[600], ml: theme.spacing(2) }}
          >
            Showing {filteredMetrics.length} of {outcomeMetrics.length} metrics
          </Typography>
        </Box>
      </Box>

      {/* Table */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: theme.spacing(2),
        }}
      >
        {filteredMetrics.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: theme.palette.grey[500],
            }}
          >
            <Typography>No metrics match your filters</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing(1.5),
            }}
          >
            {filteredMetrics.map((metric) => (
              <MetricRow
                key={metric.id}
                metric={metric}
                scenarios={selectedScenarios}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

/**
 * MetricRow: Compact row display for table view
 */
function MetricRow({
  metric,
  scenarios,
}: {
  metric: OutcomeMetric
  scenarios: string[]
}) {
  const theme = useTheme()
  const category = outcomeCategories.find((c) => c.id === metric.category)

  return (
    <Box
      sx={{
        p: theme.spacing(2),
        backgroundColor: theme.palette.common.white,
        borderRadius: theme.borderRadius.md,
        border: theme.border.light,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: theme.palette.grey[50],
          border: category ? `1px solid ${category.color}` : theme.border.medium,
          boxShadow: theme.boxShadows.subtle,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: theme.spacing(2),
          alignItems: "flex-start",
        }}
      >
        {/* Left: Category Icon */}
        <Box
          sx={{
            width: theme.spacing(5),
            height: theme.spacing(5),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: category
              ? category.color
              : theme.palette.grey[300],
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.h6.fontSize,
            flexShrink: 0,
          }}
        >
          {category?.icon || "📊"}
        </Box>

        {/* Middle: Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Name and Unit */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing(1),
              mb: theme.spacing(0.5),
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: theme.typography.fontWeightMedium,
                color: theme.palette.text.primary,
              }}
            >
              {metric.name}
            </Typography>
            <Chip
              label={metric.unit}
              size="small"
              sx={{
                fontSize: theme.typography.compact.caption.fontSize,
                height: theme.spacing(2.5),
              }}
            />
            {metric.isTier && (
              <Chip
                label="TIER"
                size="small"
                sx={{
                  backgroundColor: theme.palette.accent.orange,
                  color: theme.palette.common.white,
                  fontSize: theme.typography.compact.caption.fontSize,
                  height: theme.spacing(2.5),
                }}
              />
            )}
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.grey[600],
              mb: theme.spacing(1),
              fontSize: theme.typography.compact.subtitle.fontSize,
            }}
          >
            {metric.description}
          </Typography>

          {/* Metadata Tags */}
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: theme.spacing(0.5) }}
          >
            <Chip
              label={category?.name || "Unknown"}
              size="small"
              variant="outlined"
              sx={{ fontSize: theme.typography.compact.caption.fontSize }}
            />
            <Chip
              label={metric.spatialType}
              size="small"
              variant="outlined"
              sx={{ fontSize: theme.typography.compact.caption.fontSize }}
            />
            {metric.temporal.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                variant="outlined"
                sx={{ fontSize: theme.typography.compact.caption.fontSize }}
              />
            ))}
            {metric.showOnMap && (
              <Chip
                label="📍"
                size="small"
                sx={{
                  backgroundColor: theme.palette.nature.earth,
                  color: theme.palette.common.white,
                  fontSize: theme.typography.compact.caption.fontSize,
                  minWidth: "auto",
                  width: theme.spacing(3),
                }}
              />
            )}
          </Box>
        </Box>

        {/* Right: Scenario count indicator */}
        {scenarios.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: theme.spacing(10),
              p: theme.spacing(1),
              backgroundColor: theme.palette.grey[100],
              borderRadius: theme.borderRadius.md,
              flexShrink: 0,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: theme.typography.compact.subtitle.fontSize,
                color: theme.palette.grey[600],
              }}
            >
              {scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
