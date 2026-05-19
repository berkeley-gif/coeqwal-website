"use client"

import React, { useEffect, useState } from "react"
import {
  Box,
  IconButton,
  Tooltip,
  icons,
  useTheme,
} from "@repo/ui/mui"
import { useWorkspaceSlice } from "../../../../store"
import type { OutcomeDisplayMode } from "../../../../store"

export function InlineRowActions({
  scenarioId,
  scenarioLabel,
  displayMode,
  isPinned = false,
  accentColor,
  onShare,
  togglePinnedScenario,
  shareIconNudgeTop,
  dense,
  pinTourRef,
  shareTourRef,
  shareDisabled = false,
  shareDisabledTooltip,
}: {
  scenarioId: string
  scenarioLabel: string
  displayMode: OutcomeDisplayMode
  /** List-only: whether this scenario is pinned to the sticky comparison block */
  isPinned?: boolean
  accentColor: string
  onShare: () => void
  /** List-only: when omitted, the pin control is hidden */
  togglePinnedScenario?: (id: string) => void
  /** Optional visual offset for the share control (e.g. sidebar alignment) */
  shareIconNudgeTop?: string
  /** Tighter padding and gaps (e.g. radar axis detail foreignObject row) */
  dense?: boolean
  /**
   * List tour: the pin step anchors to this wrapper so the popper and highlight
   * target the pin control, not the whole row.
   */
  pinTourRef?: React.RefCallback<HTMLElement | null>
  shareTourRef?: React.RefCallback<HTMLElement | null>
  /**
   * Disables the share icon (pin stays active). The tooltip swaps to
   * `shareDisabledTooltip` so callers can explain the gate.
   */
  shareDisabled?: boolean
  shareDisabledTooltip?: React.ReactNode
}) {
  const theme = useTheme()
  const shareItems = useWorkspaceSlice((s) => s.shareItems)
  const isShared = shareItems.some(
    (s) =>
      s.type === "barChart" &&
      s.scenarioId === scenarioId &&
      s.viewMode === displayMode,
  )
  const [justShared, setJustShared] = useState(false)

  useEffect(() => {
    if (!justShared) return
    const timer = setTimeout(() => setJustShared(false), 3000)
    return () => clearTimeout(timer)
  }, [justShared])

  const viewLabel =
    displayMode === "average"
      ? "Key outcomes average"
      : displayMode === "distribution"
        ? "Key outcomes distribution"
        : "Key outcomes bar chart"

  const shareTooltip = justShared ? (
    <span>
      Saved <strong>{scenarioLabel}</strong> scenario
      <br />
      {viewLabel}
    </span>
  ) : isShared ? (
    <span>
      Already shared: <strong>{scenarioLabel}</strong> scenario
      <br />
      {viewLabel}
    </span>
  ) : (
    <span>
      Share <strong>{scenarioLabel}</strong> scenario
      <br />
      {viewLabel}
    </span>
  )

  const pinTooltip = isPinned ? (
    <span>
      Unpin <strong>{scenarioLabel}</strong> scenario
    </span>
  ) : (
    <span>
      Pin <strong>{scenarioLabel}</strong> scenario
    </span>
  )

  const iconPad = dense ? 0.125 : 0.375
  const iconSize = dense ? "0.8125rem" : "1rem"
  const iconButtonTight = dense
    ? { width: 24, height: 24, minWidth: 24, p: 0.125 }
    : undefined

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: dense ? 0 : 0.25,
        ml: dense ? 0 : 0.25,
      }}
    >
      {togglePinnedScenario != null && (
        <Box
          component="span"
          ref={pinTourRef}
          sx={{ display: "inline-flex", alignItems: "center" }}
        >
          <Tooltip
            title={pinTooltip}
            arrow
            placement="top-start"
            slotProps={{
              popper: {
                modifiers: [
                  { name: "flip", enabled: true },
                  {
                    name: "preventOverflow",
                    enabled: true,
                    options: { boundary: "viewport", padding: 8 },
                  },
                ],
              },
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                togglePinnedScenario(scenarioId)
              }}
              sx={{
                p: iconPad,
                ...iconButtonTight,
                color: isPinned ? accentColor : theme.palette.grey[500],
                "&:hover": {
                  color: isPinned ? accentColor : theme.palette.grey[700],
                },
              }}
            >
              <icons.PushPin
                sx={{
                  fontSize: iconSize,
                  transform: isPinned ? "none" : "rotate(45deg)",
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Box
        component="span"
        ref={shareTourRef}
        sx={{ display: "inline-flex", alignItems: "center" }}
      >
        <Tooltip
          title={
            shareDisabled
              ? (shareDisabledTooltip ?? shareTooltip)
              : shareTooltip
          }
          arrow
          placement="top-start"
          slotProps={{
            popper: {
              modifiers: [
                { name: "flip", enabled: true },
                {
                  name: "preventOverflow",
                  enabled: true,
                  options: { boundary: "viewport", padding: 8 },
                },
              ],
            },
          }}
        >
          {/* span wrapper keeps the tooltip working when the button
              is disabled; MUI suppresses pointer events on a
              disabled button, which would otherwise swallow hover. */}
          <span style={{ display: "inline-flex" }}>
            <IconButton
              size="small"
              disabled={shareDisabled}
              onClick={(e) => {
                e.stopPropagation()
                onShare()
                setJustShared(true)
              }}
              sx={{
                p: iconPad,
                ...iconButtonTight,
                ...(shareIconNudgeTop != null && {
                  position: "relative",
                  top: shareIconNudgeTop,
                }),
                color: isShared
                  ? theme.palette.blue.bright
                  : theme.palette.grey[500],
                "&:hover": {
                  color: isShared
                    ? theme.palette.blue.bright
                    : theme.palette.grey[700],
                },
                "&.Mui-disabled": {
                  color: theme.palette.grey[400],
                  opacity: 0.5,
                },
              }}
            >
              <icons.IosShare sx={{ fontSize: iconSize }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  )
}
