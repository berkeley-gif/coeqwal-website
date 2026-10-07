/**
 * figureTemplate - the standardized layout of an exported figure (the Share
 * and figure-export format): a tool eyebrow, a chart-kind label, a table of
 * the dimensions the figure holds fixed, the chart, a legend headed by the
 * dimension the figure compares, and a source footer. Pure module, no React;
 * cards/ShareFigureCard.tsx and the map caption render its output.
 *
 * Exports: FigureRowKey, FIGURE_ROW_ORDER, FIGURE_ROW_LABELS,
 * FigureTemplateSpec, FigureTemplateRow, FigureTemplate, buildFigureTemplate.
 */

export type FigureRowKey =
  | "variable"
  | "outcome"
  | "location"
  | "strategy"
  | "hydroclimate"
  | "waterYears"

/** Row order in every template table. */
export const FIGURE_ROW_ORDER: readonly FigureRowKey[] = [
  "variable",
  "outcome",
  "location",
  "strategy",
  "hydroclimate",
  "waterYears",
]

/** Row labels as stored; the card upper-cases them with CSS. */
export const FIGURE_ROW_LABELS: Record<FigureRowKey, string> = {
  variable: "Variable",
  outcome: "Outcome",
  location: "Location",
  strategy: "Strategy",
  hydroclimate: "Hydroclimate",
  waterYears: "Water years",
}

/** What a caller knows about one figure. JSON-serializable, so a share
 *  item can persist it. */
export interface FigureTemplateSpec {
  /** Eyebrow, e.g. "Data in depth" or "Map" */
  toolLabel: string
  /** Chart kind shown at the top right, e.g. "Box plot" */
  chartKindLabel: string
  /** Display value per row; blank or missing values are dropped */
  values: Partial<Record<FigureRowKey, string>>
  /** The dimension the figure compares: left out of the table, heads the
   *  legend */
  compared?: FigureRowKey
  /** Legend heading override, e.g. "Tier" for maps */
  legendHeading?: string
}

export interface FigureTemplateRow {
  key: FigureRowKey
  label: string
  value: string
}

export interface FigureTemplate {
  toolLabel: string
  chartKindLabel: string
  rows: FigureTemplateRow[]
  legendHeading: string | null
}

/** Resolve a spec into the rows and headings a card renders. Pure. */
export function buildFigureTemplate(spec: FigureTemplateSpec): FigureTemplate {
  const rows = FIGURE_ROW_ORDER.flatMap((key): FigureTemplateRow[] => {
    if (key === spec.compared) return []
    const value = spec.values[key]?.trim()
    return value ? [{ key, label: FIGURE_ROW_LABELS[key], value }] : []
  })
  const legendHeading =
    spec.legendHeading ??
    (spec.compared ? FIGURE_ROW_LABELS[spec.compared] : null)
  return {
    toolLabel: spec.toolLabel,
    chartKindLabel: spec.chartKindLabel,
    rows,
    legendHeading,
  }
}
