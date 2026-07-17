/**
 * Shared CSV formatting
 */

export function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export function csvQuote(val: string): string {
  return `"${val.replace(/"/g, '""')}"`
}

/**
 * Shared input for the CSV header block emitted at the top of every
 * share-item CSV section. Variant builders populate this from the
 * share item. The helper renders a uniform key,value so
 * single-card downloads and multi-section bulk exports have the same
 * shape.
 */
export interface CsvHeaderInput {
  /**
   * Human-readable variant name shown in the first row, e.g.
   * "Distribution", "Radar", "Bar chart", "Resilience heatmap".
   */
  variantTitle: string
  /**
   * One scenario for single-scenario variants (bar chart, equity,
   * single-tile resilience), many for radar / aggregate resilience.
   * Labels are emitted joined with `; ` so the row stays a single
   * CSV cell.
   */
  scenarios?: { id: string; label: string }[]
  /** Shown as a `Hydroclimate,<hc>` row when present. */
  hydroclimate?: string
  /** Emits `Compared to baseline,yes|no` when present. */
  compareToBaseline?: boolean
  /**
   * When true, appends the canonical tier legend row. Variants whose
   * data table contains any tier column should set this. Bar chart's
   * pivoted layout also sets it because the column headers ARE the
   * tier labels. The legend is harmless and reinforces the convention.
   */
  includeTierScale?: boolean
  /**
   * Variant-specific key,value rows inserted between the standard
   * fields and the tier scale. Resilience uses this for `Subject`,
   * `View`, and `Encoding`. Bar chart uses it for `View`.
   */
  extra?: Array<[string, string]>
}

/**
 * Canonical tier scale string. Mirrors `TIER_LABELS` in
 * `app/content/tiers.ts`. Inlined here rather than imported so this
 * util stays free of app-content dependencies.
 */
const TIER_SCALE_TEXT =
  "1 = Optimal | 2 = Acceptable | 3 = At-risk | 4 = Critical"

/**
 * Render the standard CSV header preamble. Returns the rows WITHOUT
 * a trailing blank line so the caller can decide what comes next
 * (data table immediately, or a section banner first).
 *
 * Layout:
 *
 *   Coeqwal export,<variantTitle>
 *   Scenario,<label>                          (or Scenarios,<a>; <b>; <c>)
 *   Hydroclimate,<hc>                         (when present)
 *   Compared to baseline,yes|no               (when present)
 *   <extra key,value rows...>
 *   Tier scale,1 = Optimal | 2 = Acceptable | 3 = At-risk | 4 = Critical   (when includeTierScale)
 */
export function buildCsvHeaderBlock(input: CsvHeaderInput): string[] {
  const rows: string[] = []
  rows.push(`Coeqwal export,${csvEscape(input.variantTitle)}`)

  if (input.scenarios && input.scenarios.length > 0) {
    const labels = input.scenarios.map((s) => s.label).join("; ")
    const key = input.scenarios.length === 1 ? "Scenario" : "Scenarios"
    rows.push(`${key},${csvEscape(labels)}`)
  }

  if (input.hydroclimate) {
    rows.push(`Hydroclimate,${csvEscape(input.hydroclimate)}`)
  }

  if (input.compareToBaseline != null) {
    rows.push(`Compared to baseline,${input.compareToBaseline ? "yes" : "no"}`)
  }

  if (input.extra) {
    for (const [k, v] of input.extra) {
      if (v == null || v === "") continue
      rows.push(`${csvEscape(k)},${csvEscape(v)}`)
    }
  }

  if (input.includeTierScale) {
    rows.push(`Tier scale,${csvEscape(TIER_SCALE_TEXT)}`)
  }

  return rows
}
