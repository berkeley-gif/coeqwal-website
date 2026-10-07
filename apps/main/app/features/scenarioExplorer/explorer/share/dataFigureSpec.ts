/**
 * dataFigureSpec - maps a Data in Depth chart to the figure template: which
 * dimensions it holds (table rows) and which it compares (legend heading).
 * Pure module.
 *
 * Exports: DataFigureContext, dataFigureSpec, dataChartKindLabel.
 */

import { titleCaseLabel, waterYearsPhrase } from "./figureTitle"
import type { FigureRowKey, FigureTemplateSpec } from "./figureTemplate"

export interface DataFigureContext {
  /** Registry display name, e.g. "April reservoir storage" */
  variableName: string
  /** Verbatim head for variables whose title carries its own unit */
  figureTitleHead?: string
  /** Effective unit for the view ("TAF", "%", "" for CV) */
  unit: string
  /** "scenarios" | "climates" | "locations" */
  compareBy: string
  /** Held location as a title name; "" when locations are compared */
  locationName: string
  /** Held scenario label */
  scenarioName: string
  /** Held hydroclimate label, e.g. "Historical" */
  climateName: string
  /** Active water-year-type labels; empty = all years; null = not
   *  applicable (the row is omitted) */
  waterYearTypeLabels: readonly string[] | null
  /** From dataChartKindLabel */
  chartKindLabel: string
}

const COMPARED_ROW: Record<string, FigureRowKey> = {
  scenarios: "strategy",
  climates: "hydroclimate",
  locations: "location",
}

/** Views that offer the exceedance / box / stats toggle. */
const DIST_VIEWS = new Set(["dist", "pct", "pct_demand", "level"])

const DIST_KIND_LABELS: Record<string, string> = {
  exceedance: "Exceedance plot",
  box: "Box plot",
  stats: "Stats plot",
}

/** "Box plot", "Exceedance plot", "Stats plot", or the view label for
 *  views without the toggle (e.g. "Monthly"). A distribution view other
 *  than the plain one keeps its view label after the style ("Box plot, %
 *  of capacity"), since the variable row's unit alone does not say what
 *  the chart measures. Pure. */
export function dataChartKindLabel(
  view: string,
  distKind: string,
  viewLabel: string,
): string {
  if (!DIST_VIEWS.has(view)) return viewLabel
  const style = DIST_KIND_LABELS[distKind]
  if (!style) return viewLabel
  return view === "dist" ? style : `${style}, ${viewLabel}`
}

/** Template spec for one Data in Depth figure. Pure. */
export function dataFigureSpec(ctx: DataFigureContext): FigureTemplateSpec {
  const variable =
    ctx.figureTitleHead ??
    (ctx.unit
      ? `${titleCaseLabel(ctx.variableName)} (${ctx.unit})`
      : titleCaseLabel(ctx.variableName))
  return {
    toolLabel: "Data in depth",
    chartKindLabel: ctx.chartKindLabel,
    values: {
      variable,
      location: ctx.locationName ? titleCaseLabel(ctx.locationName) : undefined,
      strategy: ctx.scenarioName ? titleCaseLabel(ctx.scenarioName) : undefined,
      hydroclimate: ctx.climateName
        ? titleCaseLabel(ctx.climateName)
        : undefined,
      waterYears: waterYearsPhrase(ctx.waterYearTypeLabels),
    },
    compared: COMPARED_ROW[ctx.compareBy],
  }
}
