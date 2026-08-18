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
 *  - "live": the request mapping (didMapping) serves this VARIABLE from the
 *    production API; per-view or per-location exceptions (a monthly view or
 *    named basins still on sample data) are noted in `tech`. The fetch path
 *    derives liveness from the mapping and actual adoption, not this flag;
 *    a registry test keeps flag and mapping in agreement.
 *  - "mock": rendered from the deterministic sample-data engine and labeled
 *    "sample data" in the UI until the backend lands.
 * Variables whose scope is still under discussion (deck vs. outcomes sheet)
 * are flagged `provisional: true` and get a "provisional" chip in the UI.
 */

/** One selectable view of a variable's data. */
export type VariableView =
  | "dist" // annual distribution (exceedance curve or box plot)
  | "pct" // annual distribution as percent of capacity (reservoirs)
  | "level" // annual distribution of groundwater levels in feet
  | "monthly" // monthly pattern (median + band per water month)
  | "cv" // year-to-year variability (coefficient of variation)
  | "value" // single summary value per member

export const VIEW_LABELS: Record<VariableView, string> = {
  dist: "Annual distribution",
  pct: "% of capacity",
  level: "Level (ft)",
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
  /** Suffix appended to a location name in figure titles (e.g. "Reservoir"
   *  --> "Shasta Reservoir"); omitted for groups whose names already read
   *  as full titles (rivers, regions). */
  titleSuffix?: string
  items: LocationDef[]
}

export type LocationGroupId =
  | "reservoirs"
  | "basins"
  | "rivers"
  | "delta"
  | "sysregions"
  | "syswide"
  | "ssjv"
  | "agregions"
  | "cws"
  | "salmon"

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
  /** Y-axis label override for the chart; defaults to the short unit. Use
   *  when the unit alone underspecifies the quantity (e.g. the salmon
   *  percent axis reads "Percent of spawning habitat occupied", not "%"). */
  axisLabel?: string
  /** Detailed reading of the metric, rendered as the chart-card footer
   *  (the axis and title stay short; the precise definition lives here). */
  footnote?: string
  /** Per-variable overrides of the default VIEW_LABELS button text, so a
   *  view can be labeled by the quantity it shows (e.g. "Volume (TAF)"). */
  viewLabels?: Partial<Record<VariableView, string>>
  /** Per-view unit overrides for views whose quantity differs from the
   *  variable's base unit (e.g. groundwater level in feet). */
  viewUnits?: Partial<Record<VariableView, { unit: string; unitLabel: string }>>
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
  /** False when the metric does not decompose by water-year type (salmon
   *  population metrics, welfare loss): the WYT chips render disabled with a
   *  not-applicable note, live requests omit `wyt=`, mock series skip
   *  filtering, and figure titles and export provenance drop the
   *  water-years clause. The stored selection stays inert, not cleared.
   *  Absent means WYT applies. */
  wytApplicable?: boolean
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
    titleSuffix: "Reservoir",
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
    // The list mixes the two NOD/SOD summary locations with the 42 basins,
    // so the control label says "location", not "basin". The title suffix
    // stays "Basin": right for 42 of 44 entries; the aggregates' "...Basin"
    // titles predate this list and read acceptably.
    label: "Groundwater location",
    titleSuffix: "Basin",
    // The 42 served basins (41 WBA technical-area codes plus the
    // Delta-Eastside Water entity) after the NOD/SOD totals, in natural
    // code order. Codes are the labels until richer basin names are
    // confirmed; DETAW keeps the label the endpoint serves. Regions are
    // INFERRED from the WBA numbering (Sacramento Valley codes 2-26
    // north of the Delta, 50-90 south) and only flavor the sample-data
    // engine. mockBase values are synthetic sample magnitudes.
    items: [
      {
        id: "AGG_GW_NOD",
        name: "All North of Delta",
        region: "NOD",
        aggregate: true,
        mockBase: 46000,
      },
      {
        id: "AGG_GW_SOD",
        name: "All South of Delta",
        region: "SOD",
        aggregate: true,
        mockBase: 51000,
      },
      {
        id: "DETAW",
        name: "Delta-Eastside Water",
        region: "Delta",
        mockBase: 6400,
      },
      { id: "WBA2", name: "WBA2", region: "NOD", mockBase: 4000 },
      { id: "WBA3", name: "WBA3", region: "NOD", mockBase: 4300 },
      { id: "WBA4", name: "WBA4", region: "NOD", mockBase: 4600 },
      { id: "WBA5", name: "WBA5", region: "NOD", mockBase: 4900 },
      { id: "WBA6", name: "WBA6", region: "NOD", mockBase: 5200 },
      { id: "WBA7N", name: "WBA7N", region: "NOD", mockBase: 5500 },
      { id: "WBA7S", name: "WBA7S", region: "NOD", mockBase: 5800 },
      { id: "WBA8N", name: "WBA8N", region: "NOD", mockBase: 6100 },
      { id: "WBA8S", name: "WBA8S", region: "NOD", mockBase: 6400 },
      { id: "WBA9", name: "WBA9", region: "NOD", mockBase: 6700 },
      { id: "WBA10", name: "WBA10", region: "NOD", mockBase: 7000 },
      { id: "WBA11", name: "WBA11", region: "NOD", mockBase: 7300 },
      { id: "WBA12", name: "WBA12", region: "NOD", mockBase: 7600 },
      { id: "WBA13", name: "WBA13", region: "NOD", mockBase: 7900 },
      { id: "WBA14", name: "WBA14", region: "NOD", mockBase: 8200 },
      { id: "WBA15N", name: "WBA15N", region: "NOD", mockBase: 8500 },
      { id: "WBA15S", name: "WBA15S", region: "NOD", mockBase: 8800 },
      { id: "WBA16", name: "WBA16", region: "NOD", mockBase: 9100 },
      { id: "WBA17N", name: "WBA17N", region: "NOD", mockBase: 9400 },
      { id: "WBA17S", name: "WBA17S", region: "NOD", mockBase: 9700 },
      { id: "WBA18", name: "WBA18", region: "NOD", mockBase: 10000 },
      { id: "WBA19", name: "WBA19", region: "NOD", mockBase: 10300 },
      { id: "WBA20", name: "WBA20", region: "NOD", mockBase: 10600 },
      { id: "WBA21", name: "WBA21", region: "NOD", mockBase: 10900 },
      { id: "WBA22", name: "WBA22", region: "NOD", mockBase: 11200 },
      { id: "WBA23", name: "WBA23", region: "NOD", mockBase: 11500 },
      { id: "WBA24", name: "WBA24", region: "NOD", mockBase: 11800 },
      { id: "WBA25", name: "WBA25", region: "NOD", mockBase: 12100 },
      { id: "WBA26N", name: "WBA26N", region: "NOD", mockBase: 12400 },
      { id: "WBA26S", name: "WBA26S", region: "NOD", mockBase: 12700 },
      { id: "WBA50", name: "WBA50", region: "SOD", mockBase: 13000 },
      { id: "WBA60N", name: "WBA60N", region: "SOD", mockBase: 13300 },
      { id: "WBA60S", name: "WBA60S", region: "SOD", mockBase: 13600 },
      { id: "WBA61", name: "WBA61", region: "SOD", mockBase: 13900 },
      { id: "WBA62", name: "WBA62", region: "SOD", mockBase: 14200 },
      { id: "WBA63", name: "WBA63", region: "SOD", mockBase: 14500 },
      { id: "WBA64", name: "WBA64", region: "SOD", mockBase: 14800 },
      { id: "WBA71", name: "WBA71", region: "SOD", mockBase: 15100 },
      { id: "WBA72", name: "WBA72", region: "SOD", mockBase: 15400 },
      { id: "WBA73", name: "WBA73", region: "SOD", mockBase: 15700 },
      { id: "WBA90", name: "WBA90", region: "SOD", mockBase: 16000 },
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
  syswide: {
    // Single-location group for metrics served as a system total only
    // (e.g. CVP wildlife-refuge deliveries): honest scope instead of a
    // regional picker whose splits would render sample data.
    label: "Region",
    items: [{ id: "SYS", name: "System-wide", region: "ALL", mockBase: 1 }],
  },
  ssjv: {
    label: "Export route",
    items: [
      { id: "CVC", name: "Cross Valley Canal", region: "SOD", mockBase: 130 },
      { id: "FRIANT", name: "Friant Division", region: "SOD", mockBase: 1100 },
      {
        id: "KERN",
        name: "Kern County Water Agency",
        region: "SOD",
        mockBase: 700,
      },
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
  salmon: {
    label: "Population",
    items: [
      {
        id: "WRLCM",
        name: "Sacramento winter-run Chinook",
        region: "NOD",
        mockBase: 1,
      },
    ],
  },
}

/* ------------------------------------------------------------------ */
/* Sectors                                                             */
/* ------------------------------------------------------------------ */

export const SECTORS: SectorDef[] = [
  { id: "res", name: "Reservoir storage", variables: ["res_apr", "res_sep"] },
  { id: "gw", name: "Groundwater storage", variables: ["gw_stor"] },
  {
    id: "salin",
    name: "Delta salinity",
    variables: ["x2_apr", "x2_sep"],
  },
  {
    id: "sysdel",
    name: "System deliveries",
    variables: [
      "cvp_del",
      "cvp_ag",
      "cvp_mi",
      "cvp_refuges",
      "swp_del",
      "swp_ag",
      "swp_mi",
      "tot_exp",
      "cvp_exp",
      "swp_exp",
      "ssjv_exp",
    ],
  },
  { id: "outflow", name: "Delta outflows", variables: ["ndo", "ndo_uif"] },
  {
    id: "eflows",
    name: "Environmental flows",
    variables: ["riv_flow"],
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
    variables: ["salmon_abund"],
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
    views: ["dist", "pct"],
    viewLabels: { dist: "Volume (TAF)" },
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
    views: ["dist", "pct"],
    viewLabels: { dist: "Volume (TAF)" },
    plain:
      "How much water is left in each reservoir at the end of the dry season (carryover storage) - a key buffer against the next year being dry.",
    tech: "Annual series of end-of-September storage, summarized as percentiles. Carryover-targeted scenarios act mainly on this variable.",
    tierOutcome: "RES_STOR",
    tierOutcomeName: "Reservoir storage",
    data: "live",
    mockKind: "storage",
    mockEffect: "storage",
  },
  gw_stor: {
    id: "gw_stor",
    name: "Groundwater storage",
    sectorId: "gw",
    locationGroup: "basins",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "level"],
    viewLabels: { dist: "Volume (TAF)", level: "Level (ft)" },
    viewUnits: { level: { unit: "ft", unitLabel: "feet" } },
    plain:
      "How much water is stored underground in each groundwater basin, as a total volume or as the groundwater level in feet.",
    tech: "North/South-of-Delta aggregate storage (NOD_GroundwaterStorage / SOD_GroundwaterStorage) and all 42 served basins are live: the 41 WBA basins labeled by technical-area code until richer names are confirmed, DETAW by its served name (Delta-Eastside Water). Basin entities serve level and volume, so the Level view is live per basin; the aggregates serve volume only and their level view stays sample.",
    tierOutcome: "GW_STOR",
    tierOutcomeName: "Groundwater storage",
    data: "live",
    mockKind: "gwstor",
    mockEffect: "gwStor",
  },
  x2_apr: {
    id: "x2_apr",
    name: "April X2 position",
    sectorId: "salin",
    locationGroup: "delta",
    unit: "km",
    unitLabel: "km from the Golden Gate",
    views: ["dist"],
    plain:
      "How far upstream salty water reaches into the Delta in April. X2 is the distance (km from the Golden Gate) where salinity hits 2 ppt - smaller is fresher.",
    tech: "Annual April X2 percentiles. X2 responds to Delta outflow; spring position matters for estuarine habitat.",
    tierOutcome: "FW_DELTA_USES",
    tierOutcomeName: "Freshwater for in-Delta uses",
    data: "live",
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
    views: ["dist"],
    plain:
      "How far upstream salty water reaches in September, at the end of the dry season, when the Delta is at its saltiest.",
    tech: "Annual September X2 percentiles. The fall X2 standard is the subject of the salinity-standards scenario.",
    tierOutcome: "FW_DELTA_USES",
    tierOutcomeName: "Freshwater for in-Delta uses",
    data: "live",
    mockKind: "x2",
    mockEffect: "sal",
  },
  cvp_del: {
    id: "cvp_del",
    name: "Central Valley Project deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much water the federal Central Valley Project delivers to its contractors each year.",
    tech: "Annual CVP deliveries, AG + M&I + wildlife refuges per the API subject labels (DEL_CVP_TOTAL; DEL_CVP_TOT_N_WAMER / DEL_CVP_TOT_S_WLOSS regional splits sum exactly to the total). The _WAMER/_WLOSS variants are the complete regional totals per the data team: the plain CalSim north total omits the American River and the plain south total omits losses.",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "live",
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
    views: ["dist"],
    plain:
      "How much water the State Water Project delivers to its contractors each year.",
    tech: "Annual SWP deliveries, AG + M&I per the API subject labels (DEL_SWP_TOTAL; DEL_SWP_TOT_N / DEL_SWP_TOT_S regional splits sum exactly to the total).",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "live",
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
    views: ["dist", "monthly"],
    plain:
      "The combined volume of water pumped out of the Delta at the Banks and Jones pumping plants for use elsewhere.",
    tech: "Annual combined Banks + Jones pumping (C_CVPSWP_TOTAL_EXPORTS). This is the supply side of the Delta outflow / export trade-off. The monthly view renders sample data.",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  cvp_ag: {
    id: "cvp_ag",
    name: "CVP agricultural deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much Central Valley Project water is delivered to farms each year.",
    tech: "Annual CVP agricultural deliveries per the API subject labels (DEL_CVP_PAG_TOTAL; regional splits DEL_CVP_PAG_NOD / DEL_CVP_PAG_SOD). Sector breakdown of the CVP deliveries total.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  cvp_mi: {
    id: "cvp_mi",
    name: "CVP M&I deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much Central Valley Project water is delivered to cities and industry (municipal and industrial use) each year.",
    tech: "Annual CVP municipal and industrial deliveries per the API subject labels (DEL_CVP_PMI_TOTAL; regional splits DEL_CVP_PMI_N_WAMER / DEL_CVP_PMI_S; the north split carries the _WAMER qualifier, paralleling the CVP totals; see cvp_del for what that qualifier denotes there).",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  cvp_refuges: {
    id: "cvp_refuges",
    name: "CVP wildlife refuge deliveries",
    sectorId: "sysdel",
    locationGroup: "syswide",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much Central Valley Project water is delivered to wildlife refuges each year.",
    tech: "Annual CVP wildlife-refuge deliveries (DEL_CVP_PRF_TOTAL). Served as a system total only; the endpoint has no regional refuge subjects, so this variable uses the single system-wide location.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  swp_ag: {
    id: "swp_ag",
    name: "SWP agricultural deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much State Water Project water is delivered to farms each year.",
    tech: "Annual SWP agricultural deliveries per the API subject labels (DEL_SWP_PAG_TOTAL; regional splits DEL_SWP_PAG_NOD / DEL_SWP_PAG_S).",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  swp_mi: {
    id: "swp_mi",
    name: "SWP M&I deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much State Water Project water is delivered to cities and industry (municipal and industrial use) each year.",
    tech: "Annual SWP municipal and industrial deliveries per the API subject labels (DEL_SWP_PMI; regional splits DEL_SWP_PMI_N / DEL_SWP_PMI_S).",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  cvp_exp: {
    id: "cvp_exp",
    name: "CVP Delta exports",
    sectorId: "sysdel",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "The Central Valley Project's share of the water pumped out of the Delta for use elsewhere.",
    tech: 'Annual CVP Delta exports per the API subject label (C_CVP_TOTAL_EXPORTS, "Central Valley Project Delta Exports"). Component of the combined Total Delta exports.',
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  swp_exp: {
    id: "swp_exp",
    name: "SWP Delta exports",
    sectorId: "sysdel",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "The State Water Project's share of the water pumped out of the Delta for use elsewhere.",
    tech: 'Annual SWP Delta exports per the API subject label (C_CAA003_SWP, "State Water Project Delta Exports"). Component of the combined Total Delta exports.',
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  ssjv_exp: {
    id: "ssjv_exp",
    name: "Southern San Joaquin Valley exports",
    sectorId: "sysdel",
    locationGroup: "ssjv",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "Water exported to the Southern San Joaquin Valley, shown by delivery route.",
    tech: "Three served route subjects, no combined total on the endpoint: D_CAA238_CVPCV (Cross Valley Canal), D_MLRTN_FRK000 (Friant Division), SWP_TA_KERNAG (Kern County Water Agency). Shown per route; no client-side summing of served data. The three-route presentation is pending confirmation (Provisional).",
    data: "live",
    provisional: true,
    mockKind: "exports",
    mockEffect: "exports",
  },
  salmon_abund: {
    id: "salmon_abund",
    name: "Winter-run abundance",
    sectorId: "salmonS",
    locationGroup: "salmon",
    unit: "%",
    unitLabel: "percent of spawning habitat occupied",
    axisLabel: "Percent of spawning habitat occupied",
    footnote:
      "Percent of suitable spawning habitat occupied by returning winter-run Chinook spawners, averaged over three years. Values above 100% would suggest returning spawners exceed the capacity of available habitat.",
    views: ["dist"],
    viewLabels: { dist: "Abundance (3-yr avg)" },
    plain:
      "How the Sacramento winter-run Chinook salmon population is doing relative to what the habitat can support, averaged over three years.",
    tech: "WRLCM 3-year-average winter-run abundance (WRLCM_ADULT_FEMALES, NOF_3YR_AVG), served as a habitat-occupancy ratio and displayed as percent (adopted live series scale by 100, see didLiveScaleForVariable). Interpretation and percent labeling confirmed by the project team; the data pointing is still under science review, so the Provisional chip stays. Water-year-type filtering does not apply to a 3-year population average.",
    data: "live",
    provisional: true,
    wytApplicable: false,
    mockKind: "flow",
    mockEffect: "eco",
  },
  ndo: {
    id: "ndo",
    name: "Delta outflow volume",
    sectorId: "outflow",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly"],
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
    views: ["dist", "monthly"],
    plain:
      "How much water flows down each major river over the year, and in which months - the basis for healthy river ecosystems.",
    tech: "Annual and monthly flow percentiles at river locations (CalSim3 C_* channel variables). The annual distribution is live; the monthly view renders sample data.",
    tierOutcome: "ENV_FLOWS",
    tierOutcomeName: "Environmental flows",
    data: "live",
    mockKind: "flow",
    mockEffect: "flows",
  },
  ag_del: {
    id: "ag_del",
    name: "Surface water deliveries",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly"],
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
    views: ["dist"],
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
    views: ["dist"],
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
    views: ["dist"],
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
    views: ["dist"],
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

/** Location display name for figure titles, with the group's title suffix
 *  applied (e.g. "Shasta Reservoir", "WBA10 Basin", "Yuba River"). Aggregate
 *  rollups already read as full titles ("All North of Delta"), so they never
 *  take the suffix. */
export function getLocationTitle(
  groupId: LocationGroupId,
  locationId: string,
): string {
  const group = LOCATION_GROUPS[groupId]
  const location = group.items.find((l) => l.id === locationId)
  const name = location?.name ?? ""
  if (!name) return ""
  return group.titleSuffix && !location?.aggregate
    ? `${name} ${group.titleSuffix}`
    : name
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
