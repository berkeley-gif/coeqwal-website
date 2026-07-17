/**
 * Filename helpers for share-system downloads
 *
 * The share variant handlers compose download filenames from
 * scenario short labels, hydroclimate slugs, and view-mode tokens.
 * Centralising the slug rules here keeps every variant on the same
 * casing / separator scheme and makes it easy to evolve (e.g. add a
 * new hydroclimate) without combing through handlers.
 */

/**
 * Lowercase, ASCII-only, hyphen-separated slug suitable for a file
 * basename. Strips diacritics so "São Joaquín" -> "sao-joaquin", and
 * collapses runs of non-alphanum characters into a single dash.
 */
export function slugifyForFilename(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Append an extension to an already-built basename. */
export function withExt(label: string, ext: string): string {
  return `${label}.${ext}`
}

/**
 * Make an extension-less base label unique within a set, appending
 * -2, -3, and so on when it collides. The export ZIP builders call
 * this so two cards that resolve to the same label do not overwrite
 * each other in the archive. The caller adds the extension afterward,
 * which keeps the .png and .svg for one card on the same base.
 */
export function dedupeLabel(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  let n = 2
  while (used.has(`${base}-${n}`)) n++
  const out = `${base}-${n}`
  used.add(out)
  return out
}

/**
 * Compact hydroclimate token used in filenames. Keeps the explicit
 * map small so additions (e.g. cc25) are intentional, and falls back
 * to a generic slug for anything we forgot to wire up.
 */
const HC_SLUG: Record<string, string> = {
  historical: "hist",
  cc50: "cc50",
  cc95: "cc95",
}

export function hydroclimateSlug(hc: string | undefined | null): string {
  if (!hc) return ""
  return HC_SLUG[hc] ?? slugifyForFilename(hc)
}

/**
 * Join scenario ids as `slug-vs-slug-vs-...`, deduping consecutive
 * identical slugs. Scenario short labels are not guaranteed unique
 * across the library, so this prevents `current-ops-vs-current-ops`
 * shapes when two ids happen to share a label.
 */
export function joinScenarioSlugs(
  ids: string[],
  shortLabelLookup: (id: string) => string,
): string {
  const slugs = ids.map((id) => slugifyForFilename(shortLabelLookup(id)))
  const out: string[] = []
  for (const s of slugs) {
    if (s && s !== out[out.length - 1]) out.push(s)
  }
  return out.join("-vs-")
}
