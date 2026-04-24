"use client"

import React from "react"
import { Box, Typography, alpha, useTheme } from "@repo/ui/mui"
import { InfoOverlay, LinedList, LeadingMarkerText } from "@repo/ui"

type HeroPoint = {
  label: string
  description?: string
  opacity?: number
}

type Callout = {
  number: string
  title: string
  body: React.ReactNode
  top?: number
  right?: number
  bottom?: number
  left?: number
  maxWidth?: string
}

export function StoryHero({
  eyebrow,
  title,
  deck,
  points = [],
  visual,
  accentColor,
}: {
  eyebrow: string
  title: string
  deck: React.ReactNode
  points?: HeroPoint[]
  visual: React.ReactNode
  accentColor?: string
}) {
  const theme = useTheme()
  const accent = accentColor ?? theme.palette.blue.bright
  const ink = theme.palette.tabPanels.exploreDeep
  const white60 = alpha(theme.palette.common.white, 0.64)
  const white78 = alpha(theme.palette.common.white, 0.78)

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: theme.borderRadius.md,
        background: `linear-gradient(135deg, ${alpha(accent, 0.2)} 0%, ${alpha(
          ink,
          0.92,
        )} 46%, ${ink} 100%)`,
        color: theme.palette.common.white,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
          },
          gap: theme.space.section.md,
          px: { xs: theme.space.section.sm, md: theme.space.section.md },
          py: { xs: theme.space.section.sm, md: theme.space.section.md },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mb: theme.space.component.md,
              color: white60,
              letterSpacing: "0.14em",
            }}
          >
            {eyebrow}
          </Typography>
          <Box sx={{ color: theme.palette.common.white }}>
            <LeadingMarkerText
              title={title}
              headlineVariant="h3"
              bodySpansFull
              circleColor={accent}
            >
              <Typography
                variant="storyBody"
                component="p"
                sx={{
                  m: 0,
                  maxWidth: 520,
                  color: white78,
                }}
              >
                {deck}
              </Typography>
              {points.length ? (
                <LinedList
                  items={points}
                  arrows={false}
                  color={theme.palette.common.white}
                  labelVariant="body1"
                  descriptionVariant="body2"
                  labelWeight={500}
                  sx={{
                    mt: theme.space.component.md,
                    maxWidth: 540,
                    "& .MuiTypography-root:last-child": {
                      color: white78,
                    },
                  }}
                />
              ) : null}
            </LeadingMarkerText>
          </Box>
        </Box>

        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              width: "100%",
              minHeight: { xs: 280, md: 340 },
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
              backgroundColor: alpha(theme.palette.common.white, 0.06),
              boxShadow: theme.shadow.subtle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: theme.space.component.lg,
              py: theme.space.component.lg,
              backdropFilter: "blur(10px)",
            }}
          >
            {visual}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function CalloutNote({
  number,
  title,
  body,
  accentColor,
}: {
  number: string
  title: string
  body: React.ReactNode
  accentColor: string
}) {
  const theme = useTheme()
  return (
    <Box component="span" sx={{ display: "inline-grid", gap: 0.75 }}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: theme.borderRadius.circle,
          backgroundColor: accentColor,
          color: theme.palette.common.white,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {number}
      </Box>
      <Box
        component="span"
        sx={{
          display: "block",
          color: theme.palette.text.primary,
          fontWeight: 600,
          lineHeight: 1.35,
        }}
      >
        {title}
      </Box>
      <Box
        component="span"
        sx={{
          display: "block",
          color: theme.palette.text.primary,
          fontSize: theme.typography.body2.fontSize,
          lineHeight: 1.45,
        }}
      >
        {body}
      </Box>
    </Box>
  )
}

export function AnnotatedStage({
  eyebrow,
  title,
  deck,
  visual,
  callouts = [],
  accentColor,
  tone = "light",
  minHeight = 360,
  calloutLayout = "auto",
}: {
  eyebrow?: string
  title: string
  deck?: React.ReactNode
  visual: React.ReactNode
  callouts?: Callout[]
  accentColor?: string
  tone?: "light" | "dark"
  minHeight?: number
  calloutLayout?: "auto" | "stacked" | "overlay"
}) {
  const theme = useTheme()
  const accent = accentColor ?? theme.palette.blue.bright
  const dark = tone === "dark"
  const usesStackedCallouts = calloutLayout === "stacked"
  const usesOverlayCallouts = calloutLayout === "overlay"

  return (
    <Box
      sx={{
        overflow: "hidden",
        borderRadius: theme.borderRadius.md,
        border: dark ? "none" : theme.border.light,
        background: dark
          ? `linear-gradient(180deg, ${alpha(theme.palette.blue.dark, 0.96)} 0%, ${theme.palette.tabPanels.exploreDeep} 100%)`
          : `linear-gradient(180deg, ${theme.palette.grey[50]} 0%, ${theme.palette.common.white} 100%)`,
      }}
    >
      <Box
        sx={{
          px: { xs: theme.space.section.sm, md: theme.space.section.md },
          pt: { xs: theme.space.section.sm, md: theme.space.section.md },
        }}
      >
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mb: theme.space.component.xs,
              color: dark
                ? alpha(theme.palette.common.white, 0.64)
                : theme.palette.grey[700],
              letterSpacing: "0.14em",
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          variant="h5"
          sx={{
            maxWidth: 560,
            color: dark
              ? theme.palette.common.white
              : theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
        {deck ? (
          <Typography
            variant="storyBody"
            component="p"
            sx={{
              m: 0,
              mt: theme.space.component.sm,
              maxWidth: 640,
              color: dark
                ? alpha(theme.palette.common.white, 0.76)
                : theme.palette.text.primary,
            }}
          >
            {deck}
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          position: "relative",
          minHeight,
          px: { xs: theme.space.component.lg, md: theme.space.section.md },
          py: { xs: theme.space.component.lg, md: theme.space.section.md },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: callouts.length
            ? usesOverlayCallouts
              ? 0
              : usesStackedCallouts
                ? theme.space.component.md
                : { xs: theme.space.component.md, xl: 0 }
            : 0,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {visual}
        </Box>

        {callouts.length ? (
          <Box
            sx={{
              width: "100%",
              display: usesOverlayCallouts
                ? "contents"
                : usesStackedCallouts
                  ? "grid"
                  : { xs: "grid", xl: "contents" },
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: theme.space.component.sm,
            }}
          >
            {callouts.map((callout) => (
              <InfoOverlay
                key={`${callout.number}-${callout.title}`}
                top={callout.top}
                right={callout.right}
                bottom={callout.bottom}
                left={callout.left}
                maxWidth={callout.maxWidth ?? "240px"}
                sx={{
                  position: usesOverlayCallouts
                    ? "absolute"
                    : usesStackedCallouts
                      ? "static"
                      : { xs: "static", xl: "absolute" },
                  width: usesOverlayCallouts
                    ? "auto"
                    : usesStackedCallouts
                      ? "100%"
                      : { xs: "100%", xl: "auto" },
                  maxWidth: usesOverlayCallouts
                    ? (callout.maxWidth ?? "240px")
                    : usesStackedCallouts
                      ? "none"
                      : { xs: "none", xl: callout.maxWidth ?? "240px" },
                  p: theme.space.component.md,
                  backgroundColor: theme.background.whiteOverlay[95],
                  border: `1px solid ${alpha(accent, 0.16)}`,
                }}
              >
                <CalloutNote
                  number={callout.number}
                  title={callout.title}
                  body={callout.body}
                  accentColor={accent}
                />
              </InfoOverlay>
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

export function JourneyStrip({
  eyebrow,
  title,
  steps,
}: {
  eyebrow?: string
  title: string
  steps: Array<{
    number: string
    label: string
    description: string
    state?: "current" | "next" | "comingSoon"
  }>
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: theme.space.section.sm,
      }}
    >
      {eyebrow ? (
        <Typography
          variant="overline"
          sx={{
            display: "block",
            mb: theme.space.component.xs,
            color: theme.palette.grey[700],
            letterSpacing: "0.14em",
          }}
        >
          {eyebrow}
        </Typography>
      ) : null}
      <Typography variant="h5" sx={{ mb: theme.space.section.sm }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: `repeat(${steps.length}, minmax(0, 1fr))`,
          },
          gap: theme.space.component.sm,
        }}
      >
        {steps.map((step) => {
          const state = step.state ?? "next"
          return (
            <Box
              key={step.number}
              sx={{
                p: theme.space.component.lg,
                borderRadius: theme.borderRadius.sm,
                border: theme.border.light,
                backgroundColor:
                  state === "current"
                    ? theme.palette.grey[50]
                    : state === "comingSoon"
                      ? alpha(theme.palette.grey[300], 0.18)
                      : theme.palette.common.white,
                opacity: state === "comingSoon" ? 0.78 : 1,
              }}
            >
              <Typography
                variant="smallSectionLabel"
                sx={{
                  display: "block",
                  mb: theme.space.component.sm,
                  color: theme.palette.grey[700],
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {step.number}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ mb: theme.space.component.xs }}
              >
                {step.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.primary }}
              >
                {step.description}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
