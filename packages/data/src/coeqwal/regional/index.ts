/**
 * Regional (NOD / SOD) tier means for the resilience heatmap.
 *
 * Source: water-data-dashboard `data/tier_df_synthetic.csv`, filtered to
 * the three hydroclimates the website currently ships (historical, cc50,
 * cc95). The ingestion script lives in this plan's implementation thread;
 * to refresh the dataset, re-run the Python transform documented in
 * `regionalTierMeans.json`'s sibling README.
 *
 * Dashboard -> website column mapping:
 *   NOD_GW_Mean        -> NOD_GW
 *   SOD_GW_Mean        -> SOD_GW
 *   NOD_Reservoir_Mean -> NOD_RES
 *   SOD_Reservoir_Mean -> SOD_RES
 *   NOD_Ag_Mean        -> NOD_AG
 *   SOD_Ag_Mean        -> SOD_AG
 *   NOD_DW_Mean        -> NOD_DW
 *   SOD_DW_Mean        -> SOD_DW
 *   NOD_Eflows_Mean    -> NOD_EFLOWS
 *   SOD_Eflows_Mean    -> SOD_EFLOWS
 *
 * The `strategy` column in the dashboard dataset is identical to the
 * website's sibling-group id, so no remapping is needed.
 */

import raw from "./regionalTierMeans.json"

export type RegionalHydroclimate = "historical" | "cc50" | "cc95"

export type RegionalOutcomeCode =
  | "NOD_GW"
  | "SOD_GW"
  | "NOD_RES"
  | "SOD_RES"
  | "NOD_AG"
  | "SOD_AG"
  | "NOD_DW"
  | "SOD_DW"
  | "NOD_EFLOWS"
  | "SOD_EFLOWS"

export type RegionalTierMeans = Record<
  string,
  Partial<Record<RegionalHydroclimate, Partial<Record<RegionalOutcomeCode, number>>>>
>

const data = raw as RegionalTierMeans

/**
 * Get the continuous regional tier mean for a (scenarioId, outcomeCode,
 * hydroclimate) triple, or null when no data is available.
 *
 * This mirrors the shape consumers previously fetched via the local
 * nod-sod-tiers.json, but now covers cc50 and cc95 in addition to
 * historical.
 */
export function getRegionalTierMean(
  scenarioId: string,
  outcomeCode: RegionalOutcomeCode,
  hydroclimate: RegionalHydroclimate,
): number | null {
  const v = data[scenarioId]?.[hydroclimate]?.[outcomeCode]
  return typeof v === "number" ? v : null
}

/** Does the dataset include any regional data at all for this scenario + HC? */
export function hasRegionalCoverage(
  scenarioId: string,
  hydroclimate: RegionalHydroclimate,
): boolean {
  const row = data[scenarioId]?.[hydroclimate]
  if (!row) return false
  for (const key of Object.keys(row)) {
    const v = row[key as RegionalOutcomeCode]
    if (typeof v === "number") return true
  }
  return false
}

/** Raw dataset (read-only); prefer the helpers above for all lookups. */
export function getRegionalTierMeansData(): RegionalTierMeans {
  return data
}
