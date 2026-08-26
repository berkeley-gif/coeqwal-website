/**
 * displayNames.table.ts - the display-name override table, WRITTEN by
 * `pnpm --filter main did:names` from the shared sheet's CSV exports. Do not
 * edit by hand; re-import and commit. Keys are the site's own ids.
 */

export const DISPLAY_NAME_TABLE: {
  scenarios: Record<string, string>
  locations: Record<string, string>
} = {
  scenarios: {},
  locations: {},
}
