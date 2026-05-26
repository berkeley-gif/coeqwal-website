"use client"

/**
 * TourCard. Popper card for a single tour step. Used by
 * both the Popper and centered-fallback layouts in `ToolTour`.
 * Receives navigation handlers and
 * illustration nodes as props.
 */

import React, { type ReactNode } from "react"
import { Box, Button, Paper, Typography, icons, useTheme } from "@repo/ui/mui"
import type { TourStep } from "../types"
import { TourBodyContent } from "./TourBodyContent"

export interface TourCardProps {
  step: TourStep
  steps: TourStep[]
  tourStep: number
  isFirst: boolean
  isLast: boolean
  illustration: ReactNode
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  titleId?: string
  eyebrowId?: string
  bodyId?: string
  nextBtnRef: React.RefObject<HTMLButtonElement | null>
  cardRef: React.RefObject<HTMLDivElement | null>
}

export function TourCard({
  step,
  steps,
  tourStep,
  isFirst,
  isLast,
  illustration,
  onBack,
  onNext,
  onSkip,
  titleId,
  eyebrowId,
  bodyId,
  nextBtnRef,
  cardRef,
}: TourCardProps) {
  const theme = useTheme()

  const hasBody = Boolean((step.body?.trim() ?? "").length > 0)
  const hasMainBlock = Boolean(hasBody || Boolean(illustration))

  const tourActionShape = {
    textTransform: "none" as const,
    fontSize: "0.8125rem",
    minWidth: 88,
    flexShrink: 0,
    borderRadius: 1.5,
  }

  return (
    <Paper
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={step.title.trim() ? titleId : eyebrowId}
      aria-describedby={hasMainBlock ? bodyId : undefined}
      elevation={8}
      sx={{
        width: step.illustration
          ? "min(520px, calc(100vw - 32px))"
          : "min(440px, calc(100vw - 32px))",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        p: 2.25,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          id={step.title.trim() ? undefined : eyebrowId}
          variant="caption"
          sx={{
            color: theme.palette.text.primary,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
            fontSize: "0.6875rem",
          }}
        >
          {step.eyebrow ?? `Step ${tourStep + 1} of ${steps.length}`}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[700],
            fontSize: "0.6875rem",
            fontWeight: 500,
          }}
        >
          {tourStep + 1} / {steps.length}
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={onSkip}
          aria-label="Close tour"
          sx={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: theme.palette.grey[700],
            display: "inline-flex",
            alignItems: "center",
            p: 0.25,
            "&:hover": { color: theme.palette.text.primary },
          }}
        >
          <icons.Close sx={{ fontSize: "1.1rem" }} />
        </Box>
      </Box>

      {step.title.trim() ? (
        <Box
          id={titleId}
          component="h2"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            m: 0,
            fontWeight: 600,
            fontSize: "1rem",
            color: theme.palette.text.primary,
            lineHeight: 1.3,
          }}
        >
          {step.titleIcon === "pin" && (
            <icons.PushPin
              sx={{
                fontSize: "1.2rem",
                color: theme.palette.grey[600],
                flexShrink: 0,
                transform: "rotate(45deg)",
              }}
              aria-hidden
            />
          )}
          {step.titleIcon === "share" && (
            <icons.IosShare
              sx={{
                fontSize: "1.2rem",
                color: theme.palette.grey[600],
                flexShrink: 0,
              }}
              aria-hidden
            />
          )}
          <span>{step.title}</span>
        </Box>
      ) : null}
      {hasMainBlock ? (
        <Box
          id={bodyId}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
            minWidth: 0,
          }}
        >
          {illustration}
          {hasBody ? (
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: theme.palette.text.primary,
                lineHeight: 1.55,
                whiteSpace: "pre-line",
              }}
              component="div"
            >
              <TourBodyContent
                body={step.body ?? ""}
                infoIconColor={theme.palette.grey[700]}
              />
            </Typography>
          ) : null}
        </Box>
      ) : null}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          mt: hasMainBlock ? 0.5 : 0,
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box
          component="ol"
          aria-hidden
          sx={{
            m: 0,
            p: 0,
            listStyle: "none",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.5,
            minWidth: 0,
            rowGap: 0.5,
          }}
        >
          {steps.map((s, i) => (
            <Box
              key={s.id}
              component="li"
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                backgroundColor:
                  i === tourStep
                    ? theme.palette.blue.bright
                    : theme.palette.grey[300],
              }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.75,
            rowGap: 0.75,
            width: "100%",
            minWidth: 0,
          }}
        >
          <Button
            size="small"
            type="button"
            variant="outlined"
            onClick={onSkip}
            sx={{
              ...tourActionShape,
              color: theme.palette.grey[700],
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.background.paper,
              "&:hover": {
                borderColor: theme.palette.grey[400],
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Skip
          </Button>
          {!isFirst && (
            <Button
              size="small"
              type="button"
              variant="outlined"
              onClick={onBack}
              sx={{
                ...tourActionShape,
                color: theme.palette.grey[700],
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.background.paper,
                "&:hover": {
                  borderColor: theme.palette.grey[400],
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              Back
            </Button>
          )}
          <Button
            ref={nextBtnRef}
            size="small"
            type="button"
            variant="contained"
            onClick={onNext}
            sx={tourActionShape}
          >
            {isLast ? "Finish" : "Next"}
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
