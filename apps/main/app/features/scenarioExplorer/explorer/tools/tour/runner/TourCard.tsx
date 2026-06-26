"use client"

/**
 * TourCard. The popper card for a single tour step, used by both the
 * Popper and centered-fallback layouts in `ToolTour`. It owns the card
 * shell (the `role="dialog"` Paper and its accessible labelling) and
 * composes the smaller pieces:
 *
 *   TourCardHeader   eyebrow + step counter + close
 *   (title)          optional title row with optional pin / share icon
 *   (main block)     optional illustration + body copy
 *   TourStepDots     progress dots
 *   TourCardActions  Skip / Back / Next
 *
 * Receives navigation handlers, the illustration node, and the refs the
 * runner needs for focus management as props.
 */

import React, { type ReactNode } from "react"
import { Box, Paper, Typography, icons, useTheme } from "@repo/ui/mui"
import type { TourStep } from "../types"
import { TourBodyContent } from "./TourBodyContent"
import { TourCardHeader } from "./TourCardHeader"
import { TourStepDots } from "./TourStepDots"
import { TourCardActions } from "./TourCardActions"

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

  const hasTitle = Boolean(step.title.trim())
  const hasBody = Boolean((step.body?.trim() ?? "").length > 0)
  const hasMainBlock = hasBody || Boolean(illustration)

  return (
    <Paper
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={hasTitle ? titleId : eyebrowId}
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
      <TourCardHeader
        eyebrow={step.eyebrow ?? `Step ${tourStep + 1} of ${steps.length}`}
        eyebrowId={hasTitle ? undefined : eyebrowId}
        stepNumber={tourStep + 1}
        stepCount={steps.length}
        onSkip={onSkip}
      />

      {hasTitle ? (
        <Box
          id={titleId}
          component="h2"
          sx={{
            ...theme.typography.tooltipHeader,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            m: 0,
            color: theme.palette.text.primary,
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
              variant="dashboard"
              component="div"
              sx={{
                color: theme.palette.text.primary,
                whiteSpace: "pre-line",
              }}
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
        <TourStepDots
          stepIds={steps.map((s) => s.id)}
          activeIndex={tourStep}
        />
        <TourCardActions
          isFirst={isFirst}
          isLast={isLast}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
          nextBtnRef={nextBtnRef}
        />
      </Box>
    </Paper>
  )
}
