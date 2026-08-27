/**
 * lib.mjs - pure helpers for the Data in Depth entity-location generator.
 *
 * Turns the subjects served by the /api/data-in-depth/ag and /cws endpoints
 * into the `LocationDef` entries the explorer registry needs (id, display
 * name, region, sample-engine magnitude), and renders them as a TypeScript
 * module. Everything here is deterministic and side-effect free; fetching
 * and file writes live in generate.mjs.
 *
 * Exports: cleanServedLabel, entityDisplayName, compareEntityCodes,
 * buildLocationDefs, renderGeneratedModule, stripGeneratedHeader,
 * GENERATED_GROUPS.
 */

/** Emitted export names, in file order. */
export const GENERATED_GROUPS = [
  "AG_ENTITY_LOCATIONS",
  "CWS_DELIVERY_ENTITY_LOCATIONS",
  "CWS_SHORTAGE_ENTITY_LOCATIONS",
]

/**
 * Clean a served subject label of table-extraction artifacts. Deliberately
 * narrow, so nothing is guessed:
 *  - bare 5 to 7 digit tokens (public water system ids such as 4510001);
 *  - two footnote digits glued to a lowercase word end ("Napa16", "Creek25");
 *  - bullet markers ("•8");
 *  - then whitespace is collapsed and trimmed.
 * Codes such as "CSA2", short numbers ("Zone 1", "No. 2") and percentages
 * ("55%") are untouched. Input: the served label. Output: the cleaned label.
 */
export function cleanServedLabel(label) {
  return (
    String(label ?? "")
      .replace(/•\s*\d+/g, " ")
      // En and em dashes: with spaces they separate clauses (read as a
      // comma); bare, they join words (read as a hyphen). Keeps " - " as the
      // unique code separator in display names.
      .replace(/\s+[\u2013\u2014]\s+/g, ", ")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/(?<![\w.%])\d{5,7}(?![\w%])/g, " ")
      .replace(/(?<=[a-z])\d{2}(?![\w%])/g, "")
      .replace(/\s+/g, " ")
      .trim()
  )
}

/**
 * Display name for an entity: "<code> - <cleaned label>", the same shape the
 * groundwater basins use, so the code stays visible as the stable key. A
 * missing label, or one that merely repeats the code, yields the bare code.
 */
export function entityDisplayName(code, cleanedLabel) {
  const label = String(cleanedLabel ?? "").trim()
  if (!label || label === code) return code
  return `${code} - ${label}`
}

/** Longest label kept whole in a display name; longer ones are cut. */
export const NAME_LABEL_MAX = 50

/**
 * Cut `text` to at most `max` characters at a word boundary, appending an
 * ellipsis when anything was removed. A cut that would land inside a
 * parenthesized run moves before the opening parenthesis, so a name never
 * ends in a dangling "(Portion". Pure.
 */
export function truncateAtWordBoundary(text, max) {
  const s = String(text ?? "").trim()
  if (s.length <= max) return s
  let cut = s.lastIndexOf(" ", max)
  if (cut <= 0) cut = max
  let head = s.slice(0, cut)
  const open = head.lastIndexOf("(")
  if (open !== -1 && head.indexOf(")", open) === -1) {
    head = head.slice(0, open)
  }
  return `${head.replace(/[\s,;]+$/, "")}…`
}

/** Split a code into a natural-order key: [number, region letter, rest]. */
function codeKey(code) {
  const m = /^(\d+)([NS]?)_(.*)$/.exec(code)
  if (!m) return [Number.POSITIVE_INFINITY, "", code]
  return [Number(m[1]), m[2], m[3]]
}

/**
 * Natural ordering for demand-unit codes: numeric water-budget-area prefix
 * first (02 before 10 before 90), N before S within an area, then the rest of
 * the code; codes with no numeric prefix (MWD, ACFC) follow alphabetically.
 */
export function compareEntityCodes(a, b) {
  const [na, ra, sa] = codeKey(a)
  const [nb, rb, sb] = codeKey(b)
  if (na !== nb) return na < nb ? -1 : 1
  if (ra !== rb) return ra < rb ? -1 : 1
  return sa < sb ? -1 : sa > sb ? 1 : 0
}

function median(values) {
  const sorted = values
    .filter((v) => typeof v === "number" && Number.isFinite(v))
    .sort((x, y) => x - y)
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Round to three significant figures for a readable sample magnitude. */
function roundBase(value) {
  if (value <= 0) return 0.1
  const digits = Math.max(0, 2 - Math.floor(Math.log10(value)))
  return Number(value.toFixed(digits))
}

/**
 * Build ordered LocationDef entries from a served subject list.
 *
 * Inputs: `subjects` (the `scenarios[0].subjects` array of one data-in-depth
 * response, with `include=values`), `regions` (code -> "NOD" | "SOD" for
 * every entity in this measure family), `primaryMeasure` (the measure whose
 * presence defines membership and whose median seeds `mockBase`).
 *
 * Output: entities only (aggregates are authored by hand in the registry),
 * NOD block then SOD block, each in natural code order. Throws when a served
 * entity has no region, or when the region map names a code the API does not
 * serve for this measure, so drift between the API and the map is never
 * silent.
 */
export function buildLocationDefs({ subjects, regions, primaryMeasure }) {
  const served = subjects.filter(
    (s) => s.kind === "entity" && s.periods?.annual?.[primaryMeasure]?.values,
  )
  const servedCodes = new Set(served.map((s) => s.subject))
  const unmapped = served
    .map((s) => s.subject)
    .filter((code) => regions[code] !== "NOD" && regions[code] !== "SOD")
  if (unmapped.length > 0) {
    throw new Error(
      `no region for served ${primaryMeasure} entities: ${unmapped.join(", ")}`,
    )
  }
  const ghosts = Object.keys(regions).filter((code) => !servedCodes.has(code))
  if (ghosts.length > 0) {
    throw new Error(
      `region map names codes not served for ${primaryMeasure}: ${ghosts.join(", ")}`,
    )
  }
  const defs = served.map((s) => {
    const cleaned = cleanServedLabel(s.label)
    const short = truncateAtWordBoundary(cleaned, NAME_LABEL_MAX)
    const values = s.periods.annual[primaryMeasure].values.map((p) => p.value)
    return {
      id: s.subject,
      name: entityDisplayName(s.subject, short),
      ...(short !== cleaned ? { longName: cleaned } : {}),
      apiLabel: String(s.label ?? ""),
      region: regions[s.subject],
      mockBase: roundBase(median(values)),
    }
  })
  const byRegion = (region) =>
    defs
      .filter((d) => d.region === region)
      .sort((a, b) => compareEntityCodes(a.id, b.id))
  return [...byRegion("NOD"), ...byRegion("SOD")]
}

const HEADER_END = "// --- end of generated header ---"

function tsString(value) {
  return JSON.stringify(value)
}

function renderDef(def) {
  return [
    "  {",
    `    id: ${tsString(def.id)},`,
    `    name: ${tsString(def.name)},`,
    ...(def.longName ? [`    longName: ${tsString(def.longName)},`] : []),
    `    apiLabel: ${tsString(def.apiLabel)},`,
    `    region: ${tsString(def.region)},`,
    `    mockBase: ${def.mockBase},`,
    "  },",
  ].join("\n")
}

/**
 * Render the generated TypeScript module. `groups` maps each name in
 * GENERATED_GROUPS to its LocationDef list. The header (everything above the
 * end-of-header marker) carries the provenance and timestamp; the body is a
 * pure function of the data, which is what `--check` compares.
 */
export function renderGeneratedModule({
  apiBase,
  scenario,
  generatedAt,
  groups,
}) {
  const counts = GENERATED_GROUPS.map(
    (name) => `${name}: ${(groups[name] ?? []).length}`,
  ).join(", ")
  const header = [
    "/**",
    " * entityLocations.generated.ts",
    " *",
    " * Generated by scripts/did-entity-locations/generate.mjs. Do not edit by",
    " * hand; re-run `pnpm --filter main did:entities` and commit the result, or",
    " * run `did:entities:check` to compare this file against the live API.",
    " *",
    ` * Source: ${apiBase}/api/data-in-depth/{ag,cws}?scenarios=${scenario}`,
    ` * Generated: ${generatedAt}`,
    ` * Counts: ${counts}`,
    " *",
    " * Regions (NOD/SOD) come from scripts/did-entity-locations/regions.json,",
    " * a copy of the data platform ETL aggregation maps; display names are",
    " * the served labels with extraction artifacts removed, cut at a word",
    " * boundary past 50 characters, and prefixed with the subject code.",
    " * `longName` carries the uncut label when a name was cut; `apiLabel`",
    " * keeps the served label verbatim.",
    " */",
    HEADER_END,
  ].join("\n")
  const body = [
    'import type { LocationDef } from "./variableRegistry"',
    "",
    ...GENERATED_GROUPS.flatMap((name) => {
      const defs = groups[name] ?? []
      const idsName = name.replace("_LOCATIONS", "_IDS")
      return [
        `export const ${name}: readonly LocationDef[] = [`,
        ...defs.map(renderDef),
        "]",
        "",
        `export const ${idsName}: ReadonlySet<string> = new Set(`,
        `  ${name}.map((l) => l.id),`,
        ")",
        "",
      ]
    }),
  ].join("\n")
  return `${header}\n${body}`
}

/** The module body with the provenance header removed, for drift checks. */
export function stripGeneratedHeader(source) {
  const idx = source.indexOf(HEADER_END)
  return idx === -1 ? source : source.slice(idx + HEADER_END.length)
}
