"use client"

/**
 * SmartSummary - Display component for outcome analysis
 *
 * Renders tier breakdown, critical/at-risk locations, and generated insights.
 * Receives data from useOutcomeSummary hook - does NOT fetch its own data.
 *
 * Used by SummaryPanel (map overlay) and can be embedded in ScenarioCard/Row.
 */

import { Box, Typography, CircularProgress, useTheme } from "@repo/ui/mui"
import { TierChip, LocationChip } from "@repo/ui"
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
        <Box sx={{ display: "flex", alignItems: "center", gap: theme.space.gap.sm, py: theme.space.component.sm }}>
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
        gap: theme.space.gap.xs,
        alignItems: "center",
        mb: isInline ? 0 : theme.space.component.md,
      }}
    >
      {Object.entries(summary.tierBreakdown).map(([tier, data]) => {
        const tierNum = parseInt(tier.replace("tier", "")) as TierLevel
        return (
          <TierChip
            key={tier}
            label={`${TIER_LABELS[tierNum]}: ${data.count}`}
            color={tierColors[tierNum]}
            compact={isCompact}
          />
        )
      })}
    </Box>
  )

  // Location chip helper
  const renderLocationChip = (
    loc: AtRiskLocation,
    variant: "default" | "muted" = "default",
    compact: boolean = false,
  ) => (
    <LocationChip
      key={loc.duId}
      label={loc.primaryName}
      onClick={onLocationClick ? () => onLocationClick(loc) : undefined}
      variant={variant}
      compact={compact}
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
            gap: theme.space.gap.xs,
            alignItems: "center",
          }}
        >
          <Typography
            variant="nav"
            component="span"
            sx={{
              color: tierColors[4],
              fontWeight: theme.typography.fontWeightSemiBold,
              mr: theme.space.component.xs,
            }}
          >
            Critical:
          </Typography>
          {visibleLocations.map((loc) => renderLocationChip(loc, "default", false))}
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
      <Box sx={{ mb: theme.space.component.md }}>
        <Typography
          variant={isCompact ? "compactMicro" : "nav"}
          sx={{
            color: tierColors[4],
            fontWeight: theme.typography.fontWeightSemiBold,
            display: "block",
            mb: theme.space.component.xs,
          }}
        >
          Critical locations:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: theme.space.gap.xs }}>
          {visibleLocations.map((loc) =>
            renderLocationChip(loc, "default", isCompact),
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
            gap: theme.space.gap.xs,
            alignItems: "center",
          }}
        >
          <Typography
            variant="nav"
            component="span"
            sx={{
              color: tierColors[3],
              fontWeight: theme.typography.fontWeightSemiBold,
              mr: theme.space.component.xs,
            }}
          >
            At-risk:
          </Typography>
          {visibleLocations.map((loc) => renderLocationChip(loc, "muted", false))}
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
            renderLocationChip(loc, "muted", isCompact),
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
                  : theme.typography.compactMicro.fontSize,
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
              fontSize: isCompact ? theme.typography.compactCaption.fontSize : undefined,
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
                gap: theme.space.gap.lg,
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








