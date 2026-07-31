/**
 * figureTitle - the standardized figure-title builder for generated charts.
 *
 * Every figure the explorer produces (on screen and in snapshot exports)
 * titles itself the same way:
 *
 *   "<Variable> (<Location>), <Scenario context>, <Hydroclimate>, <Water years>"
 *
 * e.g. "April Reservoir Storage (Shasta Reservoir), Current Ops,
 * Historical Hydroclimate, All Water Years". Parts that do not apply
 * (no held location, no hydroclimate context) are omitted without leaving
 * dangling separators. Pure module, no React; tool-agnostic on purpose so
 * the other explorer tools can adopt the same format for their exports.
 */

/** Words kept lowercase inside a title unless they lead it. */
const MINOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "per",
  "the",
  "to",
  "vs",
])

/** Title-case a display label, keeping minor words and symbols intact. */
export function titleCaseLabel(label: string): string {
  return label
    .split(" ")
    .map((word, i) => {
      if (i > 0 && MINOR_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase()
      }
      const first = word.charAt(0)
      return first === first.toLowerCase()
        ? first.toUpperCase() + word.slice(1)
        : word
    })
    .join(" ")
}

/** Join labels as prose: "A", "A and B", "A, B and C". */
function joinAsProse(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? ""
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
}

export interface FigureTitleParts {
  /** Variable display name, e.g. "April reservoir storage" */
  variableName: string
  /** Held-location title, e.g. "Shasta Reservoir" (omit when the
   *  locations themselves are the compared members) */
  locationName?: string
  /** Scenario context: the held/only scenario label, or a count summary
   *  such as "3 scenarios" / "2 climate futures" */
  memberSummary: string
  /** Held hydroclimate label (omit on the climates axis, where the
   *  compared members are the climates) */
  hydroclimateName?: string
  /** Active water-year-type class labels; empty means all years */
  waterYearTypeLabels: readonly string[]
}

/** Build the standardized figure title from its parts. */
export function buildFigureTitle(parts: FigureTitleParts): string {
  const head = parts.locationName
    ? `${titleCaseLabel(parts.variableName)} (${titleCaseLabel(parts.locationName)})`
    : titleCaseLabel(parts.variableName)
  const waterYears =
    parts.waterYearTypeLabels.length === 0
      ? "All Water Years"
      : `${joinAsProse(parts.waterYearTypeLabels.map(titleCaseLabel))} Water Years`
  const segments = [
    head,
    titleCaseLabel(parts.memberSummary),
    parts.hydroclimateName ? titleCaseLabel(parts.hydroclimateName) : undefined,
    waterYears,
  ].filter((s): s is string => Boolean(s))
  return segments.join(", ")
}
