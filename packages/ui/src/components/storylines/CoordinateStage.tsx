"use client"

import React, { createContext, useContext, type ReactNode } from "react"
import { Box } from "../../mui-components"
import type { SxProps, Theme } from "../../mui-components"

export type CoordinateStageFit = "cover" | "contain" | "stretch"
export type CoordinateValue = number | string

interface CoordinateContextValue {
  viewBoxWidth: number
  viewBoxHeight: number
}

const CoordinateContext = createContext<CoordinateContextValue | null>(null)

export interface CoordinateStageProps {
  /**
   * Width of the design coordinate system, usually matching the SVG viewBox width.
   *
   * @example
   * <CoordinateStage viewBoxWidth={1728} viewBoxHeight={1095} fit="stretch">
   *   <CoordinateSvg>
   *     <path d="..." />
   *   </CoordinateSvg>
   *
   *   <CoordinateBox x={400} y={300} width={980}>
   *     <Paragraph blocks={intro} />
   *   </CoordinateBox>
   *
   *   <CoordinateBox x="40%" y="56%" width="34rem">
   *     <Paragraph blocks={callout} />
   *   </CoordinateBox>
   * </CoordinateStage>
   */
  viewBoxWidth: number
  /** Height of the design coordinate system, usually matching the SVG viewBox height. */
  viewBoxHeight: number
  children: ReactNode
  backgroundColor?: string
  fit?: CoordinateStageFit
  zIndex?: number
  sx?: SxProps<Theme>
}

export interface CoordinateBoxProps {
  x: CoordinateValue
  y: CoordinateValue
  width: CoordinateValue
  height?: CoordinateValue
  children: ReactNode
  className?: string
  sx?: SxProps<Theme>
  zIndex?: number
  /**
   * Optional overrides for standalone use. In normal usage, CoordinateStage
   * provides these values through context.
   */
  viewBoxWidth?: number
  viewBoxHeight?: number
}

export interface CoordinateSvgProps {
  children: ReactNode
  viewBox?: string
  preserveAspectRatio?: string
  className?: string
  sx?: SxProps<Theme>
  zIndex?: number
}

export function CoordinateStage({
  viewBoxWidth,
  viewBoxHeight,
  children,
  backgroundColor,
  fit = "cover",
  zIndex,
  sx,
}: CoordinateStageProps) {
  const aspectRatio = viewBoxWidth / viewBoxHeight
  const stageSize =
    fit === "stretch"
      ? {
          width: "100%",
          height: "100%",
        }
      : fit === "contain"
        ? {
            width: `min(100%, calc(100vh * ${aspectRatio}))`,
            height: `min(100%, calc(100vw / ${aspectRatio}))`,
          }
        : {
            width: `max(100%, calc(100vh * ${aspectRatio}))`,
            height: `max(100%, calc(100vw / ${aspectRatio}))`,
          }

  return (
    <CoordinateContext.Provider value={{ viewBoxWidth, viewBoxHeight }}>
      <Box
        sx={[
          {
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            backgroundColor,
            zIndex,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            ...stageSize,
            transform: "translate(-50%, -50%)",
            transformOrigin: "center",
          }}
        >
          {children}
        </Box>
      </Box>
    </CoordinateContext.Provider>
  )
}

export function CoordinateBox({
  x,
  y,
  width,
  height,
  children,
  className,
  sx,
  zIndex = 1,
  viewBoxWidth,
  viewBoxHeight,
}: CoordinateBoxProps) {
  const context = useContext(CoordinateContext)
  const resolvedViewBoxWidth = viewBoxWidth ?? context?.viewBoxWidth
  const resolvedViewBoxHeight = viewBoxHeight ?? context?.viewBoxHeight

  return (
    <Box
      className={className}
      sx={[
        {
          position: "absolute",
          left: resolveCoordinateValue(x, resolvedViewBoxWidth),
          top: resolveCoordinateValue(y, resolvedViewBoxHeight),
          width: resolveCoordinateValue(width, resolvedViewBoxWidth),
          height:
            height === undefined
              ? undefined
              : resolveCoordinateValue(height, resolvedViewBoxHeight),
          boxSizing: "border-box",
          zIndex,
          pointerEvents: "auto",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  )
}

export function CoordinateSvg({
  children,
  viewBox,
  preserveAspectRatio = "none",
  className,
  sx,
  zIndex = 0,
}: CoordinateSvgProps) {
  const context = useContext(CoordinateContext)
  const resolvedViewBox =
    viewBox ??
    (context
      ? `0 0 ${context.viewBoxWidth} ${context.viewBoxHeight}`
      : undefined)

  return (
    <Box
      component="svg"
      viewBox={resolvedViewBox}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio={preserveAspectRatio}
      className={className}
      sx={[
        {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex,
          pointerEvents: "none",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  )
}

function resolveCoordinateValue(
  value: CoordinateValue,
  viewBoxSize?: number,
): string | number {
  if (typeof value === "string") return value
  if (viewBoxSize === undefined) return value

  return `${(value / viewBoxSize) * 100}%`
}
