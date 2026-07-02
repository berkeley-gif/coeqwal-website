/**
 * Variable registry for the Data-in-Depth explorer ("by variable" mode).
 *
 * Pure config, no React. This file is the CONTENT MODEL of the explorer:
 * sectors, variables, location groups, view availability, tier cross-links,
 * and per-variable copy. It deliberately mirrors the team's Data-in-Depth
 * design prototype so that content rulings (adding/cutting a variable,
 * changing a unit, renaming a location group) are registry edits, never
 * component changes.
 *
 * Data status per variable:
 *  - "live": served by the production API today; wired through real hooks.
 *  - "mock": rendered from the deterministic sample-data engine and labeled
 *    "sample data" in the UI until the backend lands.
 * Variables whose scope is still under discussion (deck vs. outcomes sheet)
 * are flagged `provisional: true` and get a "provisional" chip in the UI.
 */

/** One selectable view of a variable's data. */
export type VariableView =
  | "dist" // annual distribution (exceedance curve or box plot)
  | "pct" // annual distribution as percent of capacity (reservoirs)
  | "monthly" // monthly pattern (median + band per water month)
  | "cv" // year-to-year variability (coefficient of variation)
  | "value" // single summary value per member

export const VIEW_LABELS: Record<VariableView, string> = {
  dist: "Annual distribution",
  pct: "% of capacity",
  monthly: "Monthly pattern",
  cv: "Year-to-year variability",
  value: "Summary value",
}

export interface LocationDef {
  id: string
  name: string
  region: "NOD" | "SOD" | "Delta" | "ALL"
  /** Reservoir capacity (TAF), for percent-of-capacity views */
  capacityTaf?: number
  /** True for aggregate rollups (e.g. all North-of-Delta reservoirs) */
  aggregate?: boolean
  /** Synthetic median magnitude for the sample-data engine */
  mockBase?: number
}

export interface LocationGroup {
  /** Control label, e.g. "Reservoir" */
  label: string
  items: LocationDef[]
}

export type LocationGroupId =
  | "reservoirs"
  | "basins"
  | "rivers"
  | "stations"
  | "delta"
  | "sysregions"
  | "agregions"
  | "cws"

export interface SectorDef {
  id: string
  name: string
  /** Variable ids in display order */
  variables: string[]
  /** Locked sectors render greyed out with the note (no variables yet) */
  locked?: boolean
  note?: string
}

export interface VariableDef {
  id: string
  name: string
  sectorId: string
  locationGroup: LocationGroupId
  unit: string
  /** Long unit label for axis titles, e.g. "thousand acre-feet" */
  unitLabel: string
  views: VariableView[]
  /** Plain-language explanation ("What is this metric?") */
  plain: string
  /** Technical note (source variables, caveats) */
  tech: string
  /** Key-outcome code this variable feeds on the tiers pathway (API code) */
  tierOutcome?: string
  /** Human name of that key outcome, for copy */
  tierOutcomeName?: string
  /** Data source status: live API today, or deterministic sample data */
  data: "live" | "mock"
  /** Scope still under discussion (deck vs outcomes sheet); shows a chip */
  provisional?: boolean
  /** Sample-data engine kind (shape/variability family) */
  mockKind: string
  /** Sample-data engine effect key (scenario response family) */
  mockEffect: string
}

/* ------------------------------------------------------------------ */
/* Location groups                                                     */
/* ------------------------------------------------------------------ */

export const LOCATION_GROUPS: Record<LocationGroupId, LocationGroup> = {
  reservoirs: {
    label: "Reservoir",
    items: [
      { id: "SHSTA", name: "Shasta", region: "NOD", capacityTaf: 4552 },
      { id: "OROVL", name: "Oroville", region: "NOD", capacityTaf: 3425 },
      { id: "TRNTY", name: "Trinity", region: "NOD", capacityTaf: 2448 },
      { id: "FOLSM", name: "Folsom", region: "NOD", capacityTaf: 977 },
      { id: "MELON", name: "New Melones", region: "SOD", capacityTaf: 2400 },
      { id: "MLRTN", name: "Millerton", region: "SOD", capacityTaf: 520 },
      { id: "SLCVP", name: "San Luis (CVP)", region: "SOD", capacityTaf: 972 },
      { id: "SLSWP", name: "San Luis (SWP)", region: "SOD", capacityTaf: 1067 },
      {
        id: "AGG_NOD",
        name: "All North-of-Delta",
        region: "NOD",
        capacityTaf: 11402,
        aggregate: true,
      },
      {
        id: "AGG_SOD",
        name: "All South-of-Delta",
        region: "SOD",
        capacityTaf: 4959,
        aggregate: true,
      },
    ],
  },
  basins: {
    label: "Groundwater basin (WBA)",
    items: [
      { id: "COL", name: "Colusa", region: "NOD", mockBase: 21000 },
      { id: "SUT", name: "Sutter", region: "NOD", mockBase: 9500 },
      { id: "YOL", name: "Yolo", region: "NOD", mockBase: 8200 },
      { id: "AMR", name: "American Basin", region: "NOD", mockBase: 7400 },
      {
        id: "ESJ",
        name: "Eastern San Joaquin",
        region: "SOD",
        mockBase: 16500,
      },
      { id: "MOD", name: "Modesto", region: "SOD", mockBase: 6800 },
      { id: "TUR", name: "Turlock", region: "SOD", mockBase: 7900 },
      { id: "MER", name: "Merced", region: "SOD", mockBase: 9800 },
    ],
  },
  rivers: {
    label: "River location",
    items: [
      {
        id: "SAC049",
        name: "Sacramento R. at Freeport",
        region: "NOD",
        mockBase: 16000,
      },
      {
        id: "SAC000",
        name: "Sac-San Joaquin confluence",
        region: "NOD",
        mockBase: 18200,
      },
      {
        id: "FTR029",
        name: "Feather R. below Yuba",
        region: "NOD",
        mockBase: 4100,
      },
      { id: "AMR004", name: "American River", region: "NOD", mockBase: 2600 },
      { id: "YRS", name: "Yuba River", region: "NOD", mockBase: 2250 },
      {
        id: "SJR070",
        name: "San Joaquin River",
        region: "SOD",
        mockBase: 3400,
      },
      { id: "TLG", name: "Tuolumne River", region: "SOD", mockBase: 1750 },
      { id: "MRC", name: "Merced River", region: "SOD", mockBase: 960 },
      { id: "MKM", name: "Mokelumne River", region: "SOD", mockBase: 710 },
    ],
  },
  stations: {
    label: "Delta station",
    items: [
      { id: "EMM", name: "Emmaton", region: "Delta", mockBase: 1500 },
      { id: "JP", name: "Jersey Point", region: "Delta", mockBase: 900 },
      { id: "BANKS", name: "Banks", region: "Delta", mockBase: 450 },
      { id: "JONES", name: "Jones", region: "Delta", mockBase: 480 },
    ],
  },
  delta: {
    label: "Location",
    items: [
      {
        id: "DELTA",
        name: "Delta (NDO node)",
        region: "Delta",
        mockBase: 13000,
      },
    ],
  },
  sysregions: {
    label: "Region",
    items: [
      { id: "SYS", name: "System-wide", region: "ALL", mockBase: 1 },
      { id: "NOD", name: "North of Delta", region: "NOD", mockBase: 0.38 },
      { id: "SOD", name: "South of Delta", region: "SOD", mockBase: 0.62 },
    ],
  },
  agregions: {
    label: "Region (demand-unit group)",
    items: [
      {
        id: "AG_SAC",
        name: "Sacramento Valley DUs",
        region: "NOD",
        mockBase: 1,
      },
      {
        id: "AG_SJV",
        name: "San Joaquin Valley DUs",
        region: "SOD",
        mockBase: 1,
      },
      { id: "AG_TUL", name: "Tulare Basin DUs", region: "SOD", mockBase: 1 },
      {
        id: "AG_ALL",
        name: "All Central Valley DUs",
        region: "ALL",
        mockBase: 1,
        aggregate: true,
      },
    ],
  },
  cws: {
    label: "Community water system group",
    items: [
      {
        id: "CWS_SACU",
        name: "Sacramento-area systems",
        region: "NOD",
        mockBase: 380,
      },
      {
        id: "CWS_BAY",
        name: "Bay Area contractors",
        region: "Delta",
        mockBase: 520,
      },
      {
        id: "CWS_CVS",
        name: "Small Central Valley systems",
        region: "SOD",
        mockBase: 140,
      },
      {
        id: "CWS_SOC",
        name: "Southern California contractors",
        region: "SOD",
        mockBase: 1900,
      },
    ],
  },
}

/* ------------------------------------------------------------------ */
/* Sectors                                                             */
/* ------------------------------------------------------------------ */

export const SECTORS: SectorDef[] = [
  { id: "res", name: "Reservoir storage", variables: ["res_apr", "res_sep"] },
  { id: "gw", name: "Groundwater storage", variables: ["gw_vol", "gw_trend"] },
  {
    id: "salin",
    name: "Delta salinity",
    variables: ["x2_apr", "x2_sep", "station_ec"],
  },
  {
    id: "sysdel",
    name: "System deliveries",
    variables: ["cvp_del", "swp_del", "tot_exp"],
  },
  { id: "outflow", name: "Delta outflows", variables: ["ndo", "ndo_uif"] },
  {
    id: "eflows",
    name: "Environmental flows",
    variables: ["riv_flow", "riv_uif"],
  },
  {
    id: "ag",
    name: "Agricultural water",
    variables: ["ag_del", "ag_pump", "ag_short", "ag_shortpct", "ag_rev"],
  },
  {
    id: "cwsS",
    name: "Community water systems",
    variables: ["cws_del", "cws_short"],
  },
  {
    id: "salmonS",
    name: "Winter-run salmon",
    variables: [],
    locked: true,
    note: "Population metrics in development",
  },
]

/* ------------------------------------------------------------------ */
/* Variables                                                           */
/* ------------------------------------------------------------------ */

const TAF = "thousand acre-feet"

export const VARIABLES: Record<string, VariableDef> = {
  res_apr: {
    id: "res_apr",
    name: "April reservoir storage",
    sectorId: "res",
    locationGroup: "reservoirs",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "pct", "cv"],
    plain:
      "How full each major reservoir is at the start of April - the end of the wet season, when storage is normally near its peak.",
    tech: "Annual series of end-of-April storage (CalSim3 S_* variables), summarized as percentiles across the simulation period. Also available as percent of capacity.",
    tierOutcome: "RES_STOR",
    tierOutcomeName: "Reservoir storage",
    data: "live",
    mockKind: "storage",
    mockEffect: "storage",
  },
  res_sep: {
    id: "res_sep",
    name: "September reservoir storage",
    sectorId: "res",
    locationGroup: "reservoirs",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "pct", "cv"],
    plain:
      "How much water is left in each reservoir at the end of the dry season (carryover storage) - a key buffer against the next year being dry.",
    tech: "Annual series of end-of-September storage, summarized as percentiles. Carryover-targeted scenarios act mainly on this variable.",
    tierOutcome: "RES_STOR",
    tierOutcomeName: "Reservoir storage",
    data: "live",
    mockKind: "storage",
    mockEffect: "storage",
  },
  gw_vol: {
    id: "gw_vol",
    name: "Groundwater storage volume",
    sectorId: "gw",
    locationGroup: "basins",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "cv"],
    plain:
      "The total amount of water stored underground in each groundwater basin.",
    tech: "Annual groundwater storage percentiles per water budget area (WBA), from CalSim3 groundwater module output.",
    tierOutcome: "GW_STOR",
    tierOutcomeName: "Groundwater storage",
    data: "mock",
    mockKind: "gwstor",
    mockEffect: "gwStor",
  },
  gw_trend: {
    id: "gw_trend",
    name: "Groundwater level trend",
    sectorId: "gw",
    locationGroup: "basins",
    unit: "ft/yr",
    unitLabel: "feet per year",
    views: ["value"],
    plain:
      "Whether groundwater levels are rising or falling over the long run. Negative numbers mean declining aquifers.",
    tech: "Long-term linear trend of simulated groundwater levels (ft/yr) per WBA. The outcomes sheet lists overall percent change (feet/month); shown annualized here pending a units ruling.",
    tierOutcome: "GW_STOR",
    tierOutcomeName: "Groundwater storage",
    data: "mock",
    provisional: true,
    mockKind: "gwstor",
    mockEffect: "gwTrend",
  },
  x2_apr: {
    id: "x2_apr",
    name: "April X2 position",
    sectorId: "salin",
    locationGroup: "delta",
    unit: "km",
    unitLabel: "km from the Golden Gate",
    views: ["dist", "cv"],
    plain:
      "How far upstream salty water reaches into the Delta in April. X2 is the distance (km from the Golden Gate) where salinity hits 2 ppt - smaller is fresher.",
    tech: "Annual April X2 percentiles. X2 responds to Delta outflow; spring position matters for estuarine habitat.",
    tierOutcome: "FW_DELTA_USES",
    tierOutcomeName: "Freshwater for in-Delta uses",
    data: "mock",
    mockKind: "x2",
    mockEffect: "sal",
  },
  x2_sep: {
    id: "x2_sep",
    name: "September X2 position",
    sectorId: "salin",
    locationGroup: "delta",
    unit: "km",
    unitLabel: "km from the Golden Gate",
    views: ["dist", "cv"],
    plain:
      "How far upstream salty water reaches in September, at the end of the dry season, when the Delta is at its saltiest.",
    tech: "Annual September X2 percentiles. The fall X2 standard is the subject of the salinity-standards scenario.",
    tierOutcome: "FW_DELTA_USES",
    tierOutcomeName: "Freshwater for in-Delta uses",
    data: "mock",
    mockKind: "x2",
    mockEffect: "sal",
  },
  station_ec: {
    id: "station_ec",
    name: "Station salinity (EC)",
    sectorId: "salin",
    locationGroup: "stations",
    unit: "µS/cm",
    unitLabel: "microsiemens per cm",
    views: ["monthly", "dist", "cv"],
    plain:
      "How salty the water is at key Delta locations, month by month. Higher electrical conductivity (EC) = saltier water, which limits drinking and irrigation use.",
    tech: "Monthly EC percentiles at Emmaton, Jersey Point, Banks and Jones (CalSim3 ANN-estimated). Annual distribution uses the annual mean EC.",
    tierOutcome: "FW_DELTA_USES",
    tierOutcomeName: "Freshwater for in-Delta uses",
    data: "mock",
    mockKind: "sal",
    mockEffect: "sal",
  },
  cvp_del: {
    id: "cvp_del",
    name: "Central Valley Project deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "cv"],
    plain:
      "How much water the federal Central Valley Project delivers to its contractors each year.",
    tech: "Annual CVP delivery percentiles (DEL_CVP_* variables), split North / South of Delta.",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "mock",
    mockKind: "exports",
    mockEffect: "exports",
  },
  swp_del: {
    id: "swp_del",
    name: "State Water Project deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "cv"],
    plain:
      "How much water the State Water Project delivers to its contractors each year.",
    tech: "Annual SWP delivery percentiles (SWP_*_TOTAL variables), split North / South of Delta.",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "mock",
    mockKind: "exports",
    mockEffect: "exports",
  },
  tot_exp: {
    id: "tot_exp",
    name: "Total Delta exports",
    sectorId: "sysdel",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly", "cv"],
    plain:
      "The combined volume of water pumped out of the Delta at the Banks and Jones pumping plants for use elsewhere.",
    tech: "Annual and monthly percentiles of TOTAL_EXP. This is the supply side of the Delta outflow / export trade-off.",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "mock",
    mockKind: "exports",
    mockEffect: "exports",
  },
  ndo: {
    id: "ndo",
    name: "Delta outflow volume",
    sectorId: "outflow",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly", "cv"],
    plain:
      "How much fresh water flows out of the Delta toward San Francisco Bay. Outflow keeps the estuary fresh and supports fish and wildlife.",
    tech: "Net Delta Outflow (NDO), monthly and annual percentiles.",
    tierOutcome: "DELTA_ECO",
    tierOutcomeName: "Delta estuary ecology",
    data: "mock",
    mockKind: "outflow",
    mockEffect: "outflow",
  },
  ndo_uif: {
    id: "ndo_uif",
    name: "Outflow as % of unimpaired flow",
    sectorId: "outflow",
    locationGroup: "delta",
    unit: "%",
    unitLabel: "percent of unimpaired flow",
    views: ["dist"],
    plain:
      "What share of the river water that would naturally reach the Delta actually flows out of it, after storage and diversions.",
    tech: "Annual Delta outflow divided by unimpaired outflow estimate; flagged as provisional in the outcomes spec.",
    tierOutcome: "DELTA_ECO",
    tierOutcomeName: "Delta estuary ecology",
    data: "mock",
    provisional: true,
    mockKind: "pctuif",
    mockEffect: "pctUIF",
  },
  riv_flow: {
    id: "riv_flow",
    name: "River flows",
    sectorId: "eflows",
    locationGroup: "rivers",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly", "cv"],
    plain:
      "How much water flows down each major river over the year, and in which months - the basis for healthy river ecosystems.",
    tech: "Annual and monthly flow percentiles at river locations (CalSim3 C_* channel variables).",
    tierOutcome: "ENV_FLOWS",
    tierOutcomeName: "Environmental flows",
    data: "mock",
    mockKind: "flow",
    mockEffect: "flows",
  },
  riv_uif: {
    id: "riv_uif",
    name: "Flow as % of unimpaired",
    sectorId: "eflows",
    locationGroup: "rivers",
    unit: "%",
    unitLabel: "percent of unimpaired flow",
    views: ["dist"],
    plain:
      "What share of the river's natural flow remains in the channel after dams and diversions.",
    tech: "Annual percent-of-unimpaired-flow percentiles per river location (flagged as provisional in the outcomes spec).",
    tierOutcome: "ENV_FLOWS",
    tierOutcomeName: "Environmental flows",
    data: "mock",
    provisional: true,
    mockKind: "pctuif",
    mockEffect: "pctUIF",
  },
  ag_del: {
    id: "ag_del",
    name: "Surface water deliveries",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly", "cv"],
    plain: "How much river and project water is delivered to farms each year.",
    tech: "Annual agricultural surface delivery percentiles per demand-unit group.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "mock",
    mockKind: "agdel",
    mockEffect: "agDel",
  },
  ag_pump: {
    id: "ag_pump",
    name: "Groundwater pumping",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "cv"],
    plain:
      "How much groundwater farms pump to make up for surface water they don't receive. Pumping rises in dry years.",
    tech: "Annual agricultural groundwater pumping percentiles. Pumping-limit scenarios constrain this directly.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "mock",
    mockKind: "pump",
    mockEffect: "pump",
  },
  ag_short: {
    id: "ag_short",
    name: "Total water shortage",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "cv"],
    plain:
      "How much water farms wanted but did not get, from any source. Zero in wet years; can spike in droughts.",
    tech: "Annual shortage volume percentiles (demand minus deliveries minus pumping), post-processed from CalSim3. Deck-only metric pending scope confirmation.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "mock",
    provisional: true,
    mockKind: "short",
    mockEffect: "short",
  },
  ag_shortpct: {
    id: "ag_shortpct",
    name: "Shortage as % of demand",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "%",
    unitLabel: "percent of demand",
    views: ["dist"],
    plain:
      "Shortage expressed as a share of what farms needed - easier to compare across regions of different size.",
    tech: "Annual shortage-percent percentiles per demand-unit group. Deck-only metric pending scope confirmation.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "mock",
    provisional: true,
    mockKind: "shortpct",
    mockEffect: "short",
  },
  ag_rev: {
    id: "ag_rev",
    name: "Gross crop revenues",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "$B",
    unitLabel: "billion dollars per year",
    views: ["dist", "value"],
    plain:
      "The total value of crops produced, given the water available. Water shortages translate into fallowed land and lost revenue.",
    tech: "Annual gross revenue percentiles from the external agricultural economics model, driven by CalSim3 deliveries and pumping. External-source metric pending scope confirmation.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "mock",
    provisional: true,
    mockKind: "rev",
    mockEffect: "rev",
  },
  cws_del: {
    id: "cws_del",
    name: "Surface water deliveries",
    sectorId: "cwsS",
    locationGroup: "cws",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "cv"],
    plain: "How much water community drinking-water systems receive each year.",
    tech: "Annual CWS surface delivery percentiles per system group (system groups are illustrative until the location list is finalized).",
    tierOutcome: "CWS_DEL",
    tierOutcomeName: "Community deliveries",
    data: "mock",
    mockKind: "cwsdel",
    mockEffect: "cws",
  },
  cws_short: {
    id: "cws_short",
    name: "Delivery shortages",
    sectorId: "cwsS",
    locationGroup: "cws",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "cv"],
    plain:
      "How much water community systems were short of their needs - the gap the tiers pathway scores against human-health thresholds.",
    tech: "Annual CWS shortage percentiles (external post-processing). Pairs with the Community deliveries tier definition.",
    tierOutcome: "CWS_DEL",
    tierOutcomeName: "Community deliveries",
    data: "mock",
    provisional: true,
    mockKind: "short",
    mockEffect: "cwsShort",
  },
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function getVariable(id: string): VariableDef | undefined {
  return VARIABLES[id]
}

export function getSector(id: string): SectorDef | undefined {
  return SECTORS.find((s) => s.id === id)
}

export function getLocationGroup(id: LocationGroupId): LocationGroup {
  return LOCATION_GROUPS[id]
}

export function getLocation(
  groupId: LocationGroupId,
  locationId: string,
): LocationDef | undefined {
  return LOCATION_GROUPS[groupId].items.find((l) => l.id === locationId)
}

/** Default (first) location id per group, used to seed pinned locations. */
export function defaultLocationSelection(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [groupId, group] of Object.entries(LOCATION_GROUPS)) {
    const first = group.items[0]
    if (first) out[groupId] = first.id
  }
  return out
}

export const DEFAULT_VARIABLE_ID = "res_apr"
