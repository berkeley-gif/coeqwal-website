import type { ReactNode } from "react"
import type { SxProps, Theme } from "../../mui-components"

export type LegendShape = "circle" | "square" | "line" | "triangle"

export interface InlineLegend {
  variant?: "inline"
  color: string
  shape?: LegendShape
  position?: "before" | "after"
  label?: string
  outlineColor?: string
  outlineWidth?: number
}

export interface UnderlineLegend {
  variant: "underline"
  colors: readonly string[]
  labels?: readonly (string | number)[]
  height?: number
  gap?: number
}

export type Legend = InlineLegend | UnderlineLegend

export interface TextSegment {
  text: string
  mark?: string
  href?: string
  legend?: Legend
}

export interface TextBlock {
  text?: string
  segments?: readonly TextSegment[]
}

export type RichText = string | readonly TextSegment[] | TextBlock | ReactNode

export type MarkSx = Record<string, SxProps<Theme>>
export type MarkClassNames = Record<string, string>

export interface Source {
  label: string
  url: string
  prefix?: string
  suffix?: string
}
