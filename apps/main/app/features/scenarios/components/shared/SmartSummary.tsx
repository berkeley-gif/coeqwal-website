"use client"

/**
 * SmartSummary - Display component for outcome analysis
 *
 * Renders tier breakdown, critical/at-risk locations, and generated insights.
 * Receives data from useOutcomeSummary hook - does NOT fetch its own data.
 *
 * Used by SummaryPanel (map overlay) and can be embedded in ScenarioCard/Row.
 */

import { Box, Typography, Chip, CircularProgress, useTheme } from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"
import {
  generateOutcomeInsight,
  type OutcomeSummary,
  type AtRiskLocation,
} from "../../../summary/summaryGenerator"
import { TIER_LABELS, TierLevel, getTierColorsFromTheme } from "../../../../content/tiers"

// =============================================================================
// Types
// =============================================================================

export interface SmartSummaryProps {
  /** The outcome being displayed (e.g., "Community deliveries") */
  outcome: string | null
  /** Summary data from useOutcomeSummary hook */
  summary: OutcomeSummary | null
  /** Whether data is loading */
  isLoading?: boolean
  /** Layout variant */
  variant?: "overlay" | "inline" | "compact"
  /** Called when a location chip is clicked (for map zoom) */
  onLocationClick?: (location: AtRiskLocation) => void
  /** Whether to show the outcome title */
  showTitle?: boolean
  /** Whether to show tier breakdown chips */
  showTierBreakdown?: boolean
  /** Whether to show location chips */
  showLocations?: boolean
  /** Maximum number of critical locations to show */
  maxCriticalLocations?: number
  /** Maximum number of at-risk locations to show */
  maxAtRiskLocations?: number
}

// =============================================================================
// Component
// =============================================================================

export function SmartSummary({
  outcome,
  summary,
  isLoading = false,
  variant = "overlay",
  onLocationClick,
  showTitle = true,
  showTierBreakdown = true,
  showLocations = true,
  maxCriticalLocations,
  maxAtRiskLocations,
}: SmartSummaryProps) {
  const theme = useTheme()
  const tierColors = getTierColorsFromTheme(theme)

  const isInline = variant === "inline"
  const isCompact = variant === "compact"

  // Default max locations based on variant
  const maxCritical = maxCriticalLocations ?? (isInline ? 6 : isCompact ? 3 : 8)
  const maxAtRisk = maxAtRiskLocations ?? (isInline ? 4 : isCompact ? 2 : 5)

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
          <CircularProgress
            size={14}
            sx={{ color: theme.palette.blue.bright }}
          />
          <Typography
            variant="compactCaption"
            sx={{ color: theme.palette.grey[500] }}
          >
            Analyzing {outcome}...
          </Typography>
        </Box>
      </motion.div>
    )
  }

  // No data state
  if (!summary || !outcome) {
    return null
  }

  // Tier breakdown chips
  const renderTierChips = () => (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
        alignItems: "center",
        mb: isInline ? 0 : 1.5,
      }}
    >
      {Object.entries(summary.tierBreakdown).map(([tier, data]) => {
        const tierNum = parseInt(tier.replace("tier", "")) as TierLevel
        return (
          <Chip
            key={tier}
            size="small"
            label={`${TIER_LABELS[tierNum]}: ${data.count}`}
            sx={{
              ...theme.typography.compact.micro,
              backgroundColor: `${tierColors[tierNum]}15`,
              color: tierColors[tierNum],
              borderColor: `${tierColors[tierNum]}40`,
              border: "1px solid",
              fontWeight: theme.typography.fontWeightMedium,
              height: isCompact ? 18 : 22,
              "& .MuiChip-label": { px: isCompact ? 0.5 : 1 },
            }}
          />
        )
      })}
    </Box>
  )

  // Location chip
  const renderLocationChip = (
    loc: AtRiskLocation,
    height: number,
    textColor: string,
  ) => (
    <Chip
      key={loc.duId}
      size="small"
      label={loc.primaryName}
      onClick={onLocationClick ? () => onLocationClick(loc) : undefined}
      sx={{
        ...theme.typography.compact.micro,
        cursor: onLocationClick ? "pointer" : "default",
        backgroundColor: "transparent",
        color: textColor,
        border: theme.border.medium,
        height,
        "&:hover": onLocationClick
          ? {
              backgroundColor: theme.palette.blue.bright,
              color: theme.palette.common.white,
              borderColor: theme.palette.blue.bright,
            }
          : undefined,
        "& .MuiChip-label": { px: isCompact ? 0.5 : 0.75 },
      }}
    />
  )

  // Critical locations section
  const renderCriticalLocations = () => {
    if (!showLocations || summary.criticalLocations.length === 0) return null

    const visibleLocations = summary.criticalLocations.slice(0, maxCritical)
    const remainingCount = summary.criticalLocations.length - maxCritical

    if (isInline) {
      return (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            alignItems: "center",
          }}
        >
          <Typography
            variant="nav"
            component="span"
            sx={{
              color: tierColors[4],
              fontWeight: theme.typography.fontWeightSemiBold,
              mr: 0.5,
            }}
          >
            Critical:
          </Typography>
          {visibleLocations.map((loc) =>
            renderLocationChip(loc, 22, theme.palette.grey[700]),
          )}
          {remainingCount > 0 && (
            <Typography
              variant="compactMicro"
              sx={{ color: theme.palette.grey[500] }}
            >
              +{remainingCount} more
            </Typography>
          )}
        </Box>
      )
    }

    return (
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant={isCompact ? "compactMicro" : "nav"}
          sx={{
            color: tierColors[4],
            fontWeight: theme.typography.fontWeightSemiBold,
            display: "block",
            mb: 0.5,
          }}
        >
          Critical locations:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {visibleLocations.map((loc) =>
            renderLocationChip(loc, isCompact ? 20 : 24, theme.palette.grey[700]),
          )}
          {remainingCount > 0 && (
            <Typography
              variant={isCompact ? "compactMicro" : "nav"}
              sx={{ color: theme.palette.grey[500], alignSelf: "center" }}
            >
              +{remainingCount} more
            </Typography>
          )}
        </Box>
      </Box>
    )
  }

  // At-risk locations section
  const renderAtRiskLocations = () => {
    if (!showLocations || summary.atRiskLocations.length === 0) return null

    const visibleLocations = summary.atRiskLocations.slice(0, maxAtRisk)
    const remainingCount = summary.atRiskLocations.length - maxAtRisk

    if (isInline) {
      return (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            alignItems: "center",
          }}
        >
          <Typography
            variant="nav"
            component="span"
            sx={{
              color: tierColors[3],
              fontWeight: theme.typography.fontWeightSemiBold,
              mr: 0.5,
            }}
          >
            At-risk:
          </Typography>
          {visibleLocations.map((loc) =>
            renderLocationChip(loc, 18, theme.palette.grey[600]),
          )}
          {remainingCount > 0 && (
            <Typography
              variant="compactMicro"
              sx={{ color: theme.palette.grey[500] }}
            >
              +{remainingCount} more
            </Typography>
          )}
        </Box>
      )
    }

    return (
      <Box>
        <Typography
          variant="compactMicro"
          sx={{
            color: tierColors[3],
            fontWeight: theme.typography.fontWeightSemiBold,
            display: "block",
            mb: 0.5,
          }}
        >
          At-risk locations ({summary.atRiskLocations.length}):
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {visibleLocations.map((loc) =>
            renderLocationChip(loc, isCompact ? 16 : 18, theme.palette.grey[600]),
          )}
          {remainingCount > 0 && (
            <Typography
              variant="compactMicro"
              sx={{ color: theme.palette.grey[500], alignSelf: "center" }}
            >
              +{remainingCount} more
            </Typography>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={outcome}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
      >
        <Box>
          {/* Outcome name header */}
          {showTitle && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.blue.medium,
                fontWeight: theme.typography.fontWeightSemiBold,
                fontSize: isInline
                  ? theme.typography.body2.fontSize
                  : isCompact
                    ? theme.typography.compact.micro.fontSize
                    : "0.7rem",
                letterSpacing: "0.5px",
                display: "block",
                mb: isInline ? 0.5 : isCompact ? 0.25 : 1,
              }}
            >
              {outcome}
            </Typography>
          )}

          {/* Generated insight */}
          <Typography
            variant="dashboard"
            sx={{
              fontSize: isCompact ? theme.typography.compact.caption.fontSize : undefined,
              lineHeight: isCompact ? 1.3 : undefined, // dashboard default is 1.5
              color: theme.palette.grey[700],
              mb: isCompact ? 0.75 : 1.5,
            }}
          >
            {generateOutcomeInsight(outcome, summary)}
          </Typography>

          {/* Inline layout */}
          {isInline ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "flex-start",
              }}
            >
              {showTierBreakdown && renderTierChips()}
              {renderCriticalLocations()}
              {renderAtRiskLocations()}
            </Box>
          ) : (
            /* Overlay/compact layout */
            <>
              {showTierBreakdown && renderTierChips()}
              {renderCriticalLocations()}
              {renderAtRiskLocations()}
            </>
          )}
        </Box>
      </motion.div>
    </AnimatePresence>
  )
}

export default SmartSummary








