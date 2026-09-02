"use client"

import { Fragment, isValidElement } from "react"
import type { ReactNode } from "react"
import { Box, Typography, type SxProps, type Theme } from "../../mui-components"
import type {
  InlineLegend,
  MarkClassNames,
  MarkSx,
  RichText,
  TextBlock,
  TextSegment,
  UnderlineLegend,
} from "./types"

export interface TextProps {
  value: RichText
  markSx?: MarkSx
  markClassNames?: MarkClassNames
}

const defaultMarkSx: MarkSx = {
  strong: { fontWeight: "bold" },
}

const defaultMarkClassNames: MarkClassNames = {
  highlight: "highlight-text",
}

export function Text({ value, markSx, markClassNames }: TextProps) {
  if (typeof value === "string" || isValidElement(value)) {
    return <>{value}</>
  }

  if (Array.isArray(value)) {
    return <>{renderSegments(value, markSx, markClassNames)}</>
  }

  if (isTextBlock(value)) {
    if (value.segments) {
      return <>{renderSegments(value.segments, markSx, markClassNames)}</>
    }

    return <>{value.text}</>
  }

  return <>{value}</>
}

function renderSegments(
  segments: readonly TextSegment[],
  markSx?: MarkSx,
  markClassNames?: MarkClassNames,
) {
  return segments.map((segment, index) => {
    const content = renderSegmentContent(segment)
    const markedContent = segment.mark
      ? wrapMarkedContent(segment, content, index, markSx, markClassNames)
      : content

    if (segment.href) {
      return (
        <Typography
          key={index}
          component="a"
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: "inherit", textDecoration: "underline" }}
        >
          {markedContent}
        </Typography>
      )
    }

    return <Fragment key={index}>{markedContent}</Fragment>
  })
}

function renderSegmentContent(segment: TextSegment) {
  if (!segment.legend) {
    return segment.text
  }

  if (segment.legend.variant === "underline") {
    return (
      <UnderlineLegendText legend={segment.legend}>
        {segment.text}
      </UnderlineLegendText>
    )
  }

  return (
    <InlineLegendText legend={segment.legend}>{segment.text}</InlineLegendText>
  )
}

function InlineLegendText({
  legend,
  children,
}: {
  legend: InlineLegend
  children: ReactNode
}) {
  const shape = legend.shape ?? "circle"
  const legendMark = (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: shape === "line" ? "1.36em" : "0.75em",
        height: shape === "line" ? 2 : "0.75em",
        borderRadius: shape === "circle" ? "50%" : 0,
        backgroundColor: shape === "triangle" ? "transparent" : legend.color,
        border:
          shape !== "triangle" && legend.outlineColor
            ? `${legend.outlineWidth ?? 1}px solid ${legend.outlineColor}`
            : undefined,
        boxSizing: "border-box",
        ...(shape === "triangle"
          ? {
              width: 0,
              height: 0,
              borderLeft: "0.42em solid transparent",
              borderRight: "0.42em solid transparent",
              borderBottom: `0.75em solid ${legend.color}`,
            }
          : {}),
        display: "inline-block",
        flex: "0 0 auto",
      }}
    />
  )

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        whiteSpace: "nowrap",
      }}
    >
      {legend.position !== "after" ? legendMark : null}
      {children || legend.label}
      {legend.position === "after" ? legendMark : null}
    </Box>
  )
}

function UnderlineLegendText({
  legend,
  children,
}: {
  legend: UnderlineLegend
  children: ReactNode
}) {
  const height = legend.height ?? 10
  const gap = legend.gap ?? 2
  const labels = legend.labels ?? [0, 25, 50, 75, 100]
  const radius = height * 0.5

  return (
    <Box
      component="span"
      sx={{
        position: "relative",
        display: "inline-block",
        pb: `${gap + height + 5}px`,
      }}
    >
      {children}
      <Box
        component="span"
        aria-hidden
        sx={{
          position: "absolute",
          p: "1.5px",
          bottom: 0,
          left: 0,
          width: "100%",
          height,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {legend.colors.map((color, index) => {
          const strokeColor = getOpaqueColor(color)
          return (
            <Box
              key={`${color}-${index}`}
              component="span"
              sx={{
                flex: 1,
                bgcolor: color,
                border: `0.6px solid ${strokeColor}`,
                boxSizing: "border-box",
                borderTopRightRadius:
                  index === legend.colors.length - 1 ? radius : 0,
                borderBottomRightRadius:
                  index === legend.colors.length - 1 ? radius : 0,
                borderTopLeftRadius: index === 0 ? radius : 0,
                borderBottomLeftRadius: index === 0 ? radius : 0,
                pr: index < legend.colors.length - 1 ? "0.15px" : 0,
              }}
            />
          )
        })}
      </Box>
      <Box
        component="span"
        sx={{
          position: "absolute",
          bottom: -4,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
        }}
      >
        {labels.map((label, index) => {
          const percentage = index * (100 / (labels.length - 1))
          return (
            <Box
              key={`${label}-${index}`}
              component="span"
              sx={{
                position: "absolute",
                left: `${percentage}%`,
                transform: "translateX(-50%)",
                textAlign: "center",
              }}
            >
              <Typography variant="outcomeLabel">{label}</Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

function wrapMarkedContent(
  segment: TextSegment,
  content: ReactNode,
  key: number,
  markSx?: MarkSx,
  markClassNames?: MarkClassNames,
) {
  const mark = segment.mark
  if (!mark) {
    return content
  }

  const sx = resolveMarkSx(mark, markSx)
  const className = resolveMarkClassName(mark, markClassNames)

  return (
    <Box key={key} component="span" className={className} sx={sx}>
      {content}
    </Box>
  )
}

function resolveMarkSx(mark: string, markSx?: MarkSx): SxProps<Theme> {
  return markSx?.[mark] ?? defaultMarkSx[mark] ?? {}
}

function resolveMarkClassName(mark: string, markClassNames?: MarkClassNames) {
  return markClassNames?.[mark] ?? defaultMarkClassNames[mark]
}

function isTextBlock(value: unknown): value is TextBlock {
  return (
    typeof value === "object" &&
    value !== null &&
    ("text" in value || "segments" in value)
  )
}

function getOpaqueColor(color: string) {
  const rgbaMatch = color.match(
    /rgba?\(\s*([\d]+\s*,\s*[\d]+\s*,\s*[\d]+)\s*,\s*[\d.]+\s*\)/,
  )
  return rgbaMatch ? `rgb(${rgbaMatch[1]})` : color
}
