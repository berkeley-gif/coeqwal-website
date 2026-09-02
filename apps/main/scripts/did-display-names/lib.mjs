/**
 * lib.mjs - pure helpers for importing the shared display-name sheet.
 * Exports: parseCsv, buildDisplayNames.
 */

/** Minimal RFC 4180 parser: header row, quoted fields, doubled quotes. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ""
  let quoted = false
  const src = String(text ?? "").replace(/\r\n?/g, "\n")
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 1
        } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") {
      row.push(field)
      field = ""
    } else if (ch === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else field += ch
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  const [header, ...body] = rows
  if (!header) return []
  return body
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])))
}

const SCENARIO_KEY = "site_scenario_id_do_not_edit"
const SCENARIO_NAME = "data_in_depth_prose_name_TED_EDITS"
const LOCATION_KEY = "code_do_not_edit"
const LOCATION_NAME = "display_name_TED_EDITS"

function collect(rows, keyCol, nameCol, what) {
  const out = {}
  for (const r of rows) {
    const key = String(r[keyCol] ?? "").trim()
    const name = String(r[nameCol] ?? "").trim()
    if (!key || !name) continue
    if (out[key] !== undefined && out[key] !== name) {
      throw new Error(
        `${what} ${key} has two different names: "${out[key]}" and "${name}"`,
      )
    }
    out[key] = name
  }
  return out
}

/**
 * The override tables from the two sheet exports: only rows with an edited
 * name count, keys are trimmed, and a code that appears twice must carry
 * the same name. Pure.
 */
export function buildDisplayNames(scenarioRows, locationRows) {
  return {
    scenarios: collect(scenarioRows, SCENARIO_KEY, SCENARIO_NAME, "scenario"),
    locations: collect(locationRows, LOCATION_KEY, LOCATION_NAME, "location"),
  }
}

/**
 * Read the object literal out of the table module this tool writes. Prettier
 * leaves valid identifiers unquoted and adds trailing commas, so the literal
 * is not JSON; quote bare keys and drop trailing commas, then parse. Pure.
 */
export function parseTableLiteral(source) {
  const start = source.indexOf("= {")
  if (start === -1) throw new Error("table module has no object literal")
  const literal = source
    .slice(start + 2)
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, "$1")
    .trim()
  return JSON.parse(literal)
}
