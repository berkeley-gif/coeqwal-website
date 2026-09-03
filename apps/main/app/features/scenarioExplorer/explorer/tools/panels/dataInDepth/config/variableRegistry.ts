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
import {
  AG_ENTITY_LOCATIONS,
  CWS_DELIVERY_ENTITY_LOCATIONS,
  CWS_SHORTAGE_ENTITY_LOCATIONS,
} from "./entityLocations.generated"

export type VariableView =
  | "dist" // annual distribution (exceedance curve or box plot)
  | "pct" // annual distribution as percent of capacity (reservoirs)
  | "pct_demand" // annual distribution of shortage as percent of demand
  | "level" // annual distribution of groundwater levels in feet
  | "monthly" // monthly pattern (median + band per water month)
  | "cv" // year-to-year variability (coefficient of variation)
  | "value" // single summary value per member

export const VIEW_LABELS: Record<VariableView, string> = {
  dist: "Annual distribution",
  pct: "% of capacity",
  pct_demand: "% of demand",
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
  /** False when the location cannot show the groundwater Level view: a
   *  water-table elevation is reported per basin and cannot be summed, so
   *  the North and South of Delta totals carry volume only. Pickers disable
   *  the location on that view and the view bar disables the view for it. */
  levelView?: false
  /** Synthetic median magnitude for the sample-data engine */
  mockBase?: number
  /** Uncut display label, present only when `name` was cut at a word
   *  boundary to stay legible in chips, legends and titles (generated
   *  entity locations). Shown in tooltips. */
  longName?: string
  /** The label the API serves for this subject, verbatim, when the display
   *  name was derived from it (generated entity locations). Kept so a
   *  display-name review can see what the data team called the entity. */
  apiLabel?: string
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
  | "cwsShortage"
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
  /** How the variable reads inside a sentence after "mean", "median" or
   *  "the annual variation in": keeps proper nouns and acronyms cased
   *  ("April X2 position", "CVP M&I deliveries") where the display name
   *  cannot simply be lowercased. */
  proseName: string
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
  /** Plain-language explanation ("What is this variable?") */
  plain: string
  /** Technical note (source variables, caveats) */
  tech: string
  /** Key-outcome code this variable feeds on the tiers pathway (API code) */
  tierOutcome?: string
  /** Human name of that key outcome, for copy */
  tierOutcomeName?: string
  /** Key-outcome chip override. "not-used" renders "not used in calculation
   *  of key outcome" whatever `tierOutcome` says (the tier metadata is kept
   *  for the pathway; the chip is copy). Absent: the chip reads "used in
   *  calculation of key outcome: <tierOutcomeName>" when a name exists, and
   *  nothing renders otherwise. */
  keyOutcomeChip?: "not-used"
  /** Verbatim head for the standardized figure title, replacing the default
   *  "<Variable> (<Location>)" head, e.g. "April X2 Position (in km)". Set
   *  only where the location parenthetical adds nothing (the X2 titles). */
  figureTitleHead?: string
  /** Data source status: live API today, or deterministic sample data */
  data: "live" | "mock"
  /** Scope still under discussion (deck vs outcomes sheet); shows a chip */
  provisional?: boolean
  /** False when the water-year-type filter cannot apply to the metric,
   *  either because it does not decompose by water year (salmon population
   *  metrics, welfare loss) or because it is aggregated on a different
   *  calendar upstream (the CWS series aggregate by calendar year). The WYT
   *  chips render disabled with a not-applicable note, live requests omit
   *  `wyt=`, mock series skip filtering, and figure titles and export
   *  provenance drop the water-years clause. The stored selection stays
   *  inert, not cleared. Absent means WYT applies. */
  wytApplicable?: boolean
  /** Year basis of the served series. Absent means water years (October to
   *  September), the CalSim3 convention. "calendar" marks series aggregated
   *  upstream by calendar year (the CWS delivery family), which changes the
   *  year-axis label in exports and provenance. */
  yearBasis?: "water" | "calendar"
  /** Inclusive range of served years the site adopts. Points outside it are
   *  dropped before any statistic is computed. Set where the endpoint serves
   *  partial stub years at the ends of the model run (the CWS delivery
   *  family: a three-month 1921 and a nine-month 2021), so a stub never
   *  becomes the minimum, the exceedance tail or a term of the mean and CV. */
  servedYearRange?: { min: number; max: number }
  /** Shown when a scenario the user selected is not modeled for this
   *  variable, so the endpoint serves no data for it. Explains WHY rather
   *  than leaving a blank series: an absence with a reason reads as a fact
   *  about the model, an absence without one reads as a broken chart.
   *  Falls back to a generic sentence when unset. */
  noLiveDataExplanation?: string
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
        name: "All North of Delta",
        region: "NOD",
        capacityTaf: 11402,
        aggregate: true,
      },
      {
        id: "AGG_SOD",
        name: "All South of Delta",
        region: "SOD",
        capacityTaf: 4959,
        aggregate: true,
      },
    ],
  },
  basins: {
    // The list mixes the two NOD/SOD summary locations with the 42 basins,
    // so the control label says "location", not "basin". No title suffix:
    // with descriptive names, titles read "... (WBA10 - Chico; Durham)"
    // and appending "Basin" would dangle after the place names.
    label: "Groundwater location",
    // The 42 served basins (41 WBA technical-area codes plus the
    // Delta-Eastside Water entity) after the NOD/SOD totals, in natural
    // code order. Each WBA labels as "CODE - description" with the CalSim3
    // hydrology-report description the endpoint serves (verified against
    // /api/data-in-depth/groundwater-storage subject labels): the code
    // leads so the dropdown keeps code order and stays cross-referenceable
    // with the other explore tools, which show bare codes. DETAW keeps its
    // more specific local name (the endpoint labels it just "Delta").
    // Regions are INFERRED from the WBA numbering (Sacramento Valley codes
    // 2-26 north of the Delta, 50-90 south) and only flavor the
    // sample-data engine. mockBase values are synthetic sample magnitudes.
    items: [
      {
        id: "AGG_GW_NOD",
        name: "All North of Delta",
        region: "NOD",
        aggregate: true,
        levelView: false,
        mockBase: 46000,
      },
      {
        id: "AGG_GW_SOD",
        name: "All South of Delta",
        region: "SOD",
        aggregate: true,
        levelView: false,
        mockBase: 51000,
      },
      {
        id: "DETAW",
        name: "Delta-Eastside Water",
        region: "Delta",
        mockBase: 6400,
      },
      {
        id: "WBA2",
        name: "WBA2 - West Redding",
        region: "NOD",
        mockBase: 4000,
      },
      {
        id: "WBA3",
        name: "WBA3 - East Redding",
        region: "NOD",
        mockBase: 4300,
      },
      {
        id: "WBA4",
        name: "WBA4 - West Red Bluff",
        region: "NOD",
        mockBase: 4600,
      },
      {
        id: "WBA5",
        name: "WBA5 - East Red Bluff; Los Molinos",
        region: "NOD",
        mockBase: 4900,
      },
      { id: "WBA6", name: "WBA6 - Orland", region: "NOD", mockBase: 5200 },
      {
        id: "WBA7N",
        name: "WBA7N - Willows; North Tehama-Colusa",
        region: "NOD",
        mockBase: 5500,
      },
      {
        id: "WBA7S",
        name: "WBA7S - Arbuckle; South Tehama-Colusa",
        region: "NOD",
        mockBase: 5800,
      },
      {
        id: "WBA8N",
        name: "WBA8N - Hamilton City; North Glenn-Colusa",
        region: "NOD",
        mockBase: 6100,
      },
      {
        id: "WBA8S",
        name: "WBA8S - Williams; South Glenn-Colusa",
        region: "NOD",
        mockBase: 6400,
      },
      { id: "WBA9", name: "WBA9 - Butte City", region: "NOD", mockBase: 6700 },
      {
        id: "WBA10",
        name: "WBA10 - Chico; Durham",
        region: "NOD",
        mockBase: 7000,
      },
      {
        id: "WBA11",
        name: "WBA11 - Gridley; Live Oaks",
        region: "NOD",
        mockBase: 7300,
      },
      {
        id: "WBA12",
        name: "WBA12 - South Oroville; Honcut Valley",
        region: "NOD",
        mockBase: 7600,
      },
      {
        id: "WBA13",
        name: "WBA13 - Palermo; Honcut Foothills",
        region: "NOD",
        mockBase: 7900,
      },
      {
        id: "WBA14",
        name: "WBA14 - Browns Valley; Yuba Foothills",
        region: "NOD",
        mockBase: 8200,
      },
      {
        id: "WBA15N",
        name: "WBA15N - Marysville; North Yuba",
        region: "NOD",
        mockBase: 8500,
      },
      {
        id: "WBA15S",
        name: "WBA15S - Wheatland; South Yuba",
        region: "NOD",
        mockBase: 8800,
      },
      { id: "WBA16", name: "WBA16 - Yuba City", region: "NOD", mockBase: 9100 },
      {
        id: "WBA17N",
        name: "WBA17N - North Sutter Buttes; Butte Sink",
        region: "NOD",
        mockBase: 9400,
      },
      {
        id: "WBA17S",
        name: "WBA17S - South Sutter Buttes; Sutter Bypass",
        region: "NOD",
        mockBase: 9700,
      },
      { id: "WBA18", name: "WBA18 - Meridian", region: "NOD", mockBase: 10000 },
      { id: "WBA19", name: "WBA19 - Robbins", region: "NOD", mockBase: 10300 },
      {
        id: "WBA20",
        name: "WBA20 - Davis; Woodland",
        region: "NOD",
        mockBase: 10600,
      },
      {
        id: "WBA21",
        name: "WBA21 - Fremont Landing; Yolo Bypass",
        region: "NOD",
        mockBase: 10900,
      },
      {
        id: "WBA22",
        name: "WBA22 - Natomas; Pleasant Grove",
        region: "NOD",
        mockBase: 11200,
      },
      {
        id: "WBA23",
        name: "WBA23 - Camp Far West; Sutter",
        region: "NOD",
        mockBase: 11500,
      },
      {
        id: "WBA24",
        name: "WBA24 - Lincoln; West Placer",
        region: "NOD",
        mockBase: 11800,
      },
      {
        id: "WBA25",
        name: "WBA25 - Dixon; Vacaville",
        region: "NOD",
        mockBase: 12100,
      },
      {
        id: "WBA26N",
        name: "WBA26N - North Sacramento",
        region: "NOD",
        mockBase: 12400,
      },
      {
        id: "WBA26S",
        name: "WBA26S - South Sacramento",
        region: "NOD",
        mockBase: 12700,
      },
      {
        id: "WBA50",
        name: "WBA50 - Byron-Bethany; Banta-Carbona; Tracy",
        region: "SOD",
        mockBase: 13000,
      },
      {
        id: "WBA60N",
        name: "WBA60N - Elk Grove; Lodi",
        region: "SOD",
        mockBase: 13300,
      },
      {
        id: "WBA60S",
        name: "WBA60S - Stockton; Jenny Lind; Bachelor Valley",
        region: "SOD",
        mockBase: 13600,
      },
      {
        id: "WBA61",
        name: "WBA61 - Modesto; Oakdale; South San Joaquin",
        region: "SOD",
        mockBase: 13900,
      },
      { id: "WBA62", name: "WBA62 - Turlock", region: "SOD", mockBase: 14200 },
      {
        id: "WBA63",
        name: "WBA63 - Merced; El Nido; Stevenson",
        region: "SOD",
        mockBase: 14500,
      },
      {
        id: "WBA64",
        name: "WBA64 - Madera; Chowchilla; Gravelly Ford; Adobe",
        region: "SOD",
        mockBase: 14800,
      },
      {
        id: "WBA71",
        name: "WBA71 - Upper Delta-Mendota Canal",
        region: "SOD",
        mockBase: 15100,
      },
      {
        id: "WBA72",
        name: "WBA72 - Grasslands Ecological Area; Westside Exchange Contractors",
        region: "SOD",
        mockBase: 15400,
      },
      {
        id: "WBA73",
        name: "WBA73 - Lower Delta-Mendota Canal; Joint Reach of the California Aqueduct",
        region: "SOD",
        mockBase: 15700,
      },
      {
        id: "WBA90",
        name: "WBA90 - Westlands Water District",
        region: "SOD",
        mockBase: 16000,
      },
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
    label: "Delivery route",
    items: [
      // Synthetic total, summed client-side from the three served route
      // series (fail-closed; see didMapping.sumAlignedSeriesPoints). Sample
      // magnitude = the sum of the route sample magnitudes.
      {
        id: "ALL_ROUTES",
        name: "All routes (total)",
        region: "SOD",
        aggregate: true,
        mockBase: 1930,
      },
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
    // The two served aggregates (subjects NOD_Agriculture/SOD_Agriculture)
    // followed by every demand unit the ag endpoint serves (132 as of
    // 2026-08-24), generated from the live API by
    // scripts/did-entity-locations. Names lead with the served code because
    // the served labels repeat ("Non-district" appears 22 times). The
    // aggregate mockBase values are scale factors read by AG_BASE in the
    // sample engine; entity mockBase values are served medians.
    label: "Demand unit",
    items: [
      {
        id: "AGG_AG_NOD",
        name: "All North of Delta",
        region: "NOD",
        aggregate: true,
        mockBase: 1,
      },
      {
        id: "AGG_AG_SOD",
        name: "All South of Delta",
        region: "SOD",
        aggregate: true,
        mockBase: 1,
      },
      ...AG_ENTITY_LOCATIONS,
    ],
  },
  cws: {
    // Community water systems with served DELIVERIES: the two aggregates
    // (subjects NOD_CWS/SOD_CWS) followed by the 74 systems the cws endpoint
    // serves the delivery measure for, generated from the live API. The
    // shortage and welfare measures cover a different, overlapping set of
    // systems, which is the separate `cwsShortage` group below. Aggregate
    // mockBase values approximate the served median deliveries.
    label: "Community water system",
    items: [
      {
        id: "AGG_CWS_NOD",
        name: "All North of Delta",
        region: "NOD",
        aggregate: true,
        mockBase: 597,
      },
      {
        id: "AGG_CWS_SOD",
        name: "All South of Delta",
        region: "SOD",
        aggregate: true,
        mockBase: 2220,
      },
      ...CWS_DELIVERY_ENTITY_LOCATIONS,
    ],
  },
  cwsShortage: {
    // Community water systems with served SHORTAGE and WELFARE outcomes: the
    // same two aggregates (the endpoint serves all five measures on them)
    // followed by the 63 systems modeled in the welfare-outcomes source. The
    // data team treats this set as separate from the delivery set (34
    // systems are in both); binding each variable to its own group means the
    // site never requests a subject the endpoint lacks for that measure.
    // mockBase here is the median shortage in TAF.
    label: "Community water system",
    items: [
      {
        id: "AGG_CWS_NOD",
        name: "All North of Delta",
        region: "NOD",
        aggregate: true,
        mockBase: 2.6,
      },
      {
        id: "AGG_CWS_SOD",
        name: "All South of Delta",
        region: "SOD",
        aggregate: true,
        mockBase: 3.5,
      },
      ...CWS_SHORTAGE_ENTITY_LOCATIONS,
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
  { id: "outflow", name: "Delta outflows", variables: ["ndo"] },
  {
    id: "eflows",
    name: "Environmental flows",
    variables: ["riv_flow"],
  },
  {
    id: "ag",
    name: "Agricultural water",
    variables: ["ag_del", "ag_pump", "ag_short", "ag_rev"],
  },
  {
    id: "cwsS",
    name: "Community water systems",
    variables: ["cws_del", "cws_del_short", "cws_short", "cws_welfare"],
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
    proseName: "April reservoir storage",
    name: "April reservoir storage",
    sectorId: "res",
    locationGroup: "reservoirs",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "pct"],
    viewLabels: { dist: "Volume (TAF)" },
    plain:
      "How full each major reservoir is at the start of April, the end of the wet season and before major releases for summer irrigation deliveries, when storage is normally near its peak.",
    tech: "April water storage volumes at selected reservoirs (CalSim3 S_* variables) drawn from the monthly time series produced by 100-year CalSim3 simulations. Data are summarized to illustrate variability and central tendency of storage values for each scenario. Results are also available as percent of total reservoir capacity.",
    tierOutcome: "RES_STOR",
    tierOutcomeName: "Reservoir storage",
    data: "live",
    mockKind: "storage",
    mockEffect: "storage",
  },
  res_sep: {
    id: "res_sep",
    proseName: "September reservoir storage",
    name: "September reservoir storage",
    sectorId: "res",
    locationGroup: "reservoirs",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "pct"],
    viewLabels: { dist: "Volume (TAF)" },
    plain:
      "How much water is left in each reservoir at the end of September, which is the end of the dry season. Often referred to as carry-over storage, September reservoir storage is an important reference point for managing winter flows and buffering water supply for the next year.",
    tech: "September water storage volumes at selected reservoirs (CalSim3 S_* variables) drawn from the monthly time series produced by 100-year CalSim3 simulations. Data are summarized to illustrate variability and central tendency of storage values for each scenario. Results are also available as percent of total reservoir capacity.",
    tierOutcome: "RES_STOR",
    tierOutcomeName: "Reservoir storage",
    data: "live",
    mockKind: "storage",
    mockEffect: "storage",
  },
  gw_stor: {
    id: "gw_stor",
    proseName: "groundwater storage",
    name: "Groundwater storage",
    sectorId: "gw",
    locationGroup: "basins",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "level"],
    viewLabels: { dist: "Volume (TAF)", level: "Level (ft)" },
    viewUnits: { level: { unit: "ft", unitLabel: "feet" } },
    plain:
      "How much water is stored underground in each modeled groundwater subregion across all aquifer levels, as total volume or as an equivalent depth, in feet.",
    tech: "Groundwater storage data are extracted from CalSim3 groundwater output files for each of the 42 subregions (corresponding to Water Budget Areas, WBAs) simulated in each scenario. Aggregate values are also provided for the North and South of Delta regions. Level values are calculated by dividing the groundwater storage volume by the surface area of the subregion; the North and South of Delta aggregates report volume only.",
    tierOutcome: "GW_STOR",
    tierOutcomeName: "Groundwater storage",
    data: "live",
    mockKind: "gwstor",
    mockEffect: "gwStor",
  },
  x2_apr: {
    id: "x2_apr",
    proseName: "April X2 position",
    name: "April X2 position",
    sectorId: "salin",
    locationGroup: "delta",
    unit: "km",
    unitLabel: "km from the Golden Gate",
    views: ["dist"],
    axisLabel: "distance of X2 from Golden Gate (km)",
    figureTitleHead: "April X2 Position (in km)",
    keyOutcomeChip: "not-used",
    plain:
      "A measure of how far upstream salty ocean water reaches into the Delta in April. In any month, X2 is the distance (measured in kilometers from the Golden Gate) where salinity hits 2 parts per thousand (ppt). A smaller value means fresher water in the Delta.",
    tech: "CalSim3 estimates salinity and X2 values in the Delta for each month of a 100-year simulation period. The figures above display X2 values drawn from the CalSim3 output files for each April in the 100-year simulation period for each selected scenario. Salinity and X2 in the Delta respond to inflows, outflows, export pumping, and sea level conditions. April X2 values tend to be the lowest of the year, reflecting higher spring outflows that flush saline water towards the San Francisco Bay.",
    tierOutcome: "FW_DELTA_USES",
    tierOutcomeName: "Freshwater for in-Delta uses",
    data: "live",
    mockKind: "x2",
    mockEffect: "sal",
  },
  x2_sep: {
    id: "x2_sep",
    proseName: "September X2 position",
    name: "September X2 position",
    sectorId: "salin",
    locationGroup: "delta",
    unit: "km",
    unitLabel: "km from the Golden Gate",
    views: ["dist"],
    axisLabel: "distance of X2 from Golden Gate (km)",
    figureTitleHead: "September X2 Position (in km)",
    keyOutcomeChip: "not-used",
    plain:
      "A measure of how far upstream salty ocean water reaches into the Delta in September, at the end of the dry season, when the Delta tends to be near its saltiest. In any month, X2 is the distance (measured in kilometers from the Golden Gate) where salinity hits 2 parts per thousand (ppt). A smaller value means fresher water in the Delta.",
    tech: "CalSim3 estimates salinity and X2 values in the Delta for each month of a simulation. The figures above display X2 values drawn from the CalSim3 output files for each September in the 100-year simulation period for each selected scenario. Salinity and X2 in the Delta respond to inflows, outflows, export pumping, and sea level conditions.",
    tierOutcome: "FW_DELTA_USES",
    tierOutcomeName: "Freshwater for in-Delta uses",
    data: "live",
    mockKind: "x2",
    mockEffect: "sal",
  },
  cvp_del: {
    id: "cvp_del",
    proseName: "Central Valley Project deliveries",
    name: "Central Valley Project deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much total water the federal Central Valley Project delivers to its agricultural, municipal and industrial, and refuge contractors each year. This total value includes Settlement and Exchange contractor deliveries in combination with project agricultural contractors. Annual delivery volumes are provided for the entire system as well as subtotals for North of Delta and South of Delta regions.",
    tech: "Total annual CVP deliveries are aggregated from monthly CVP delivery time series available in CalSim3 output files for each scenario. Delivery amounts are summed across project agricultural, Settlement, Exchange, municipal and industrial (M&I), American River Water Forum, and refuge contract categories, as well as south-of-Delta conveyance losses. The regional subtotals (North and South of Delta) sum to the systemwide total. Annual totals are aggregated on a water year (October-September) basis.",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  swp_del: {
    id: "swp_del",
    proseName: "State Water Project deliveries",
    name: "State Water Project deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much water the State Water Project delivers to its agricultural and municipal and industrial (M&I) contractors each year. Annual combined delivery volumes are provided for the entire system as well as subtotals for North of Delta and South of Delta regions.",
    tech: "Total annual SWP deliveries to M&I and agricultural contractors are aggregated from monthly SWP delivery time series variables available in CalSim3 output files for each scenario. Total systemwide delivery amounts (DEL_SWP_TOTAL) are calculated as the sum of DEL_SWP_TOT_N and DEL_SWP_TOT_S variables that are, in turn, calculated as the sum of regional agricultural and M&I delivery variables. These summary variables do not include carryover or interruptible supplies, only Table A amounts. The regional subtotals (North and South of Delta) sum to the systemwide total. Annual totals are aggregated on a water year (October-September) basis.",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  tot_exp: {
    id: "tot_exp",
    proseName: "Delta exports",
    name: "Total Delta exports",
    sectorId: "sysdel",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly"],
    plain:
      "The combined volume of water pumped out of the Delta at the Banks (State Water Project) and Jones (federal Central Valley Project) pumping plants for conveyance, storage, and delivery elsewhere.",
    tech: "Total annual export volumes are aggregated from monthly export time series variables for each pumping location available in CalSim3 output files for each scenario. Annual volumes combine the pumped amount at the Jones pumping plant (CVP) and Banks pumping plant (SWP + any CVP shared capacity) in a new post-processed variable C_CVPSWP_TOTAL_EXPORTS. This export total does not include pumping by Contra Costa Water District or other smaller Delta pumping amounts. Annual totals are aggregated on a water year (October-September) basis.",
    tierOutcome: "FW_EXP",
    tierOutcomeName: "Delta freshwater exports",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  cvp_ag: {
    id: "cvp_ag",
    proseName: "CVP agricultural deliveries",
    name: "CVP agricultural deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much Central Valley Project (CVP) water is delivered to farms each year under project, Settlement, and Exchange contract types. Annual delivery volumes are provided for the entire system as well as subtotals for North of Delta and South of Delta regions.",
    tech: "Total annual CVP deliveries to agricultural uses are aggregated from monthly CVP delivery time series available in CalSim3 output files for each scenario. Delivery amounts are summed across project agricultural, Settlement, and Exchange contractor types using a custom post-processed variable DEL_CVP_PAG_TOTAL. The regional subtotals (North and South of Delta) sum to the systemwide total. Annual totals are aggregated on a water year (October-September) basis.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  cvp_mi: {
    id: "cvp_mi",
    proseName: "CVP M&I deliveries",
    name: "CVP M&I deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much Central Valley Project water is delivered to cities and industry (municipal and industrial use) each year. Annual delivery volumes are provided for the entire system as well as subtotals for North of Delta and South of Delta regions.",
    tech: "Total annual CVP deliveries to municipal and industrial (M&I) uses are aggregated from monthly CVP delivery time series variables available in CalSim3 output files for each scenario. North-of-Delta and systemwide totals include CVP deliveries to American River Water Forum users. Total systemwide delivery amounts (DEL_CVP_PMI_TOTAL) sum together the DEL_CVP_PMI_S and DEL_CVP_PMI_N_WAMER variables. The regional subtotals (North and South of Delta) sum to the systemwide total. Annual totals are aggregated on a water year (October-September) basis.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  cvp_refuges: {
    id: "cvp_refuges",
    proseName: "CVP wildlife refuge deliveries",
    name: "CVP wildlife refuge deliveries",
    sectorId: "sysdel",
    locationGroup: "syswide",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much Central Valley Project water is delivered to federally managed wildlife refuges each year. Annual volumes are provided for total systemwide deliveries.",
    tech: "Total annual CVP deliveries to federally managed refuges are aggregated from monthly CVP delivery time series variables available in CalSim3 output files for each scenario. Total systemwide delivery amounts (DEL_CVP_PRF_TOTAL) sum together the DEL_CVP_PRF_S and DEL_CVP_PRF_N variables. Annual totals are aggregated on a water year (October-September) basis.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  swp_ag: {
    id: "swp_ag",
    proseName: "SWP agricultural deliveries",
    name: "SWP agricultural deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much State Water Project water is delivered to agricultural contractors each year. Annual combined delivery volumes are provided for the entire system as well as subtotals for North of Delta and South of Delta regions. This variable includes deliveries to Feather River Settlement contractors.",
    tech: "Total annual SWP deliveries to agricultural contractors are aggregated from monthly SWP delivery time series variables available in CalSim3 output files for each scenario. Total systemwide delivery amounts (DEL_SWP_PAG_TOTAL) are calculated as the sum of DEL_SWP_PAG_NOD and DEL_SWP_PAG_S variables. These summary variables do not include carryover or interruptible supplies, only Table A amounts. The regional subtotals (North and South of Delta) sum to the systemwide total. Annual totals are aggregated on a water year (October-September) basis.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  swp_mi: {
    id: "swp_mi",
    proseName: "M&I deliveries of the State Water Project",
    name: "SWP M&I deliveries",
    sectorId: "sysdel",
    locationGroup: "sysregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    keyOutcomeChip: "not-used",
    plain:
      "How much State Water Project water is delivered to municipal and industrial (M&I) contractors each year. Annual combined delivery volumes are provided for the entire system as well as subtotals for North of Delta and South of Delta regions.",
    tech: "Total annual SWP deliveries to municipal and industrial (M&I) contractors are aggregated from monthly SWP delivery time series variables available in CalSim3 output files for each scenario. Total systemwide delivery amounts come from the DEL_SWP_PMI variable while regional subtotals come from DEL_SWP_PMI_N (North of Delta) and DEL_SWP_PMI_S (South of Delta, including Southern California). These summary variables do not include carryover or interruptible supplies, only Table A amounts. The regional subtotals (North and South of Delta) sum to the systemwide total. Annual totals are aggregated on a water year (October-September) basis.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  cvp_exp: {
    id: "cvp_exp",
    proseName: "CVP Delta exports",
    name: "CVP Delta exports",
    sectorId: "sysdel",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "The federal Central Valley Project's (CVP) share of the water pumped out of the Delta for conveyance, storage, or delivery elsewhere. Includes pumping at the Jones pumping plant as well as any shared capacity at the Banks pumping plant.",
    tech: "Total annual export volumes are aggregated from monthly export time series variables for each pumping location available in CalSim3 output files for each scenario. Annual volumes combine the pumped amount at the Jones pumping plant (CVP) and Banks pumping plant (any CVP shared capacity) in a new post-processed variable C_CVP_TOTAL_EXPORTS. This export total does not include pumping by Contra Costa Water District. Annual totals are aggregated on a water year (October-September) basis.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  swp_exp: {
    id: "swp_exp",
    proseName: "SWP Delta exports",
    name: "SWP Delta exports",
    sectorId: "sysdel",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "The State Water Project's (SWP) share of the water pumped out of the Delta for conveyance, storage, or delivery elsewhere. For the Delta Conveyance scenarios, this includes any water diverted through the North Delta Diversion and routed to the Banks pumping plant.",
    tech: "Total annual export volumes are aggregated from monthly time series for the SWP portion of Banks pumping provided in output files for each scenario (variable name C_CAA003_SWP). Annual volumes include any water diverted via North Delta Diversions in the Delta Conveyance scenarios. Annual totals are aggregated on a water year (October-September) basis.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  ssjv_exp: {
    id: "ssjv_exp",
    proseName: "southern San Joaquin Valley deliveries",
    name: "Southern San Joaquin Valley deliveries",
    sectorId: "sysdel",
    locationGroup: "ssjv",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "Water exported from the Delta that is delivered to the selected water user groups in the Southern San Joaquin Valley and Tulare Basin. Annual delivery volumes are shown as a combined total as well as subset by delivery group or route.",
    tech: "CalSim3 represents the delivery and conveyance system of the southern San Joaquin Valley and Tulare Basin in less detail than the rest of the Central Valley. The delivery routes shown here (Friant Division [D_MLRTN_FRK000], Cross Valley Canal [D_CAA238_CVPCV], and Kern County Water Agency [SWP_TA_KERNAG]) highlight three important water user groups in the region at the level of detail of their representation in the model. These deliveries support agricultural and municipal water uses. The 'All routes (total)' option sums the values across all routes. Annual totals are aggregated on a water year (October-September) basis.",
    data: "live",
    mockKind: "exports",
    mockEffect: "exports",
  },
  salmon_abund: {
    id: "salmon_abund",
    proseName: "winter-run abundance",
    name: "Winter-run abundance",
    sectorId: "salmonS",
    locationGroup: "salmon",
    unit: "proportion",
    unitLabel: "proportion of spawning habitat occupied",
    axisLabel: "Proportion of spawning habitat occupied",
    footnote:
      "Proportion of total spawning habitat occupied by returning natural-origin female winter-run Chinook spawners, averaged over three years. The data shown represent the lower 20th percentile of model simulations.",
    views: ["dist"],
    viewLabels: { dist: "Abundance (3-yr avg)" },
    plain:
      "A measure of how close the Sacramento River winter-run female spawner population is to reaching full spawning habitat capacity, tracked as a three-year average. Values range from 0.0 to 1.0, where 1.0 means 100% of available spawning habitat is occupied.",
    tech: "The proportion of spawning habitat capacity occupied by the 3-year rolling average of natural-origin female winter-run Chinook salmon spawners, evaluated using the lower 20th percentile across 1,000 model simulations. Maximum available spawning habitat capacity is held constant across years and scenarios. Winter-run salmon variables are constrained to the 1934-2016 period to focus on scenario performance following the severe, extended drought conditions of the 1920s-1930s (the Dust Bowl era) and to exclude cohorts after 2016 with incomplete adult returns. Note that water-year-type filtering does not apply to a 3-year population average. See the Winter run salmon outcome level brief on the Data page for more information.",
    data: "live",
    wytApplicable: false,
    noLiveDataExplanation:
      "Winter-run salmon data are not available for the Delta Conveyance Project scenario.",
    mockKind: "flow",
    mockEffect: "eco",
  },
  ndo: {
    id: "ndo",
    proseName: "Delta outflow volume",
    name: "Delta outflow volume",
    sectorId: "outflow",
    locationGroup: "delta",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly"],
    plain:
      "How much fresh water flows out of the Delta toward San Francisco Bay each year. Delta outflow volume depends on upstream hydrology, reservoir releases, diversions, Delta pumping, and other water uses. Outflow determines the balance of salinity in the Delta and is an important part of Delta ecology.",
    tech: "Flows from the Delta into the San Francisco Bay are affected by tides and ocean conditions at hourly and daily scales. Because CalSim3 is a monthly time step model, Delta outflow is approximated as a net flow - the balance of tidal inflow and freshwater outflow that occurs over a month as estimated by mass balance in the Delta. This mass balance is calculated in two ways in CalSim3 - one via a set of inflows and outflows designated by D1641, and one according to the propagation of flows on the arc-node network of Delta channels. The former is defined in CalSim3 as NDO or NDOI variables while the latter is defined by C_SAC000. While both approaches generally yield very similar results, there can be differences. The results presented above reflect the network mass balance drawn from the monthly C_SAC000 variable. Annual totals are aggregated on a water year (October-September) basis.",
    tierOutcome: "DELTA_ECO",
    tierOutcomeName: "Delta estuary ecology",
    data: "live",
    mockKind: "outflow",
    mockEffect: "outflow",
  },
  riv_flow: {
    id: "riv_flow",
    proseName: "river flows",
    name: "River flows",
    sectorId: "eflows",
    locationGroup: "rivers",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly"],
    plain:
      "How much water flows down each major river in the Central Valley over the year. These river flows contribute to Delta flows.",
    tech: "Annual river flow volumes are aggregated from channel flow variables (C_*) for selected river locations, generally at a downstream location. Annual aggregation is done on a water year (October-September) basis.",
    tierOutcome: "ENV_FLOWS",
    tierOutcomeName: "Environmental flows",
    data: "live",
    mockKind: "flow",
    mockEffect: "flows",
  },
  ag_del: {
    id: "ag_del",
    proseName: "agricultural surface water deliveries",
    name: "Surface water deliveries",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "monthly"],
    plain:
      "How much surface water is delivered to agricultural locations of interest each year. This water may come from reservoir releases or other unmanaged flows. Irrigation demands may be met with a combination of these surface water deliveries and groundwater pumping.",
    tech: "Annual delivery volumes are aggregated from monthly time series generated via CalSim3 simulations for net surface water delivery variables (DN_*). These variables are spatially aggregated to yield two regional totals - one for the North of Delta region and one for the South of Delta region - and are also provided for each individual demand unit. Annual aggregation is performed on a water year (October-September) basis.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "live",
    mockKind: "agdel",
    mockEffect: "agDel",
  },
  ag_pump: {
    id: "ag_pump",
    proseName: "agricultural groundwater pumping",
    name: "Groundwater pumping",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much groundwater farms pump to meet the portion of irrigation demand not met by surface water deliveries. Groundwater pumping volume is summarized over two Central Valley regions.",
    tech: "Annual groundwater pumping volumes are aggregated from monthly groundwater pumping variables provided as part of each CalSim3 scenario simulation. Regional totals are aggregated for all demand units (locations of interest) in the North of Delta and South of Delta regions, respectively. Annual totals are summed on a water year (October-September) basis. In general, groundwater pumping is used to meet any demands not met by surface water deliveries. Scenarios that set limits on groundwater pumping directly will not conform to this assumption, however. Many demand units have a minimum pumping level that will occur regardless of surface water delivery amounts.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "live",
    mockKind: "pump",
    mockEffect: "pump",
  },
  ag_short: {
    id: "ag_short",
    proseName: "agricultural water shortage",
    name: "Water shortage",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "pct_demand"],
    viewLabels: { dist: "Shortage (TAF)", pct_demand: "% of demand" },
    viewUnits: { pct_demand: { unit: "%", unitLabel: "percent of demand" } },
    plain:
      "How much water farms needed but did not get, accounting for surface water deliveries and groundwater sources. Shortages are generally zero in wet years but can spike in droughts. Water shortage is expressed as a volume of unmet demand (annual TAF) and as a percent of unmet demand (%) for all agricultural locations of interest.",
    tech: "Served live from the ag data-in-depth endpoint's shortage measure (annual TAF) on the NOD_Agriculture/SOD_Agriculture aggregates and on every served demand unit. The percent-of-demand view is derived on the site as shortage / (net diversion + shortage) x 100, because the endpoint serves no percent measure; demand is approximated as delivered water plus shortage.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "live",
    mockKind: "short",
    mockEffect: "short",
  },
  ag_rev: {
    id: "ag_rev",
    proseName: "gross crop revenues",
    name: "Gross crop revenues",
    sectorId: "ag",
    locationGroup: "agregions",
    unit: "$M",
    unitLabel: "million dollars per year",
    views: ["dist"],
    plain:
      "The total value of crops produced, given the water available. Water shortages translate into fallowed land and lost revenue.",
    tech: "Annual gross revenue percentiles from the external agricultural economics model, driven by CalSim3 deliveries and pumping.",
    tierOutcome: "AG_REV",
    tierOutcomeName: "Agricultural revenue",
    data: "live",
    mockKind: "rev",
    mockEffect: "rev",
  },
  cws_del: {
    id: "cws_del",
    proseName: "community water system deliveries",
    name: "Surface water deliveries",
    sectorId: "cwsS",
    locationGroup: "cws",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist"],
    plain:
      "How much surface water community water systems receive each year from Central Valley and major project sources. This does not include deliveries from sources external to (e.g., Colorado River) or not represented (e.g., rivers in Tulare Basin) in CalSim3. Data are provided for individual locations of interest and aggregated to two major regions - North of Delta and South of Delta. The South of Delta aggregate includes deliveries to Central Coast and Southern California community water systems.",
    tech: "Served live from the cws data-in-depth endpoint's delivery measure (annual TAF) on the NOD_CWS/SOD_CWS aggregates and on the 74 community water systems with modeled deliveries. The served series is aggregated by calendar year over a model run from October 1921 to September 2021, so its first and last years are stubs; the site keeps 1922 to 2020. Water-year-type filtering does not apply: the CWS team aggregated these series by calendar year, not water year.",
    tierOutcome: "CWS_DEL",
    tierOutcomeName: "Community surface water",
    data: "live",
    wytApplicable: false,
    yearBasis: "calendar",
    servedYearRange: { min: 1922, max: 2020 },
    mockKind: "cwsdel",
    mockEffect: "cws",
  },
  cws_del_short: {
    id: "cws_del_short",
    proseName: "surface water delivery shortage",
    name: "Surface water delivery shortages",
    sectorId: "cwsS",
    locationGroup: "cws",
    unit: "%",
    unitLabel: "percent of demand not delivered",
    axisLabel: "Delivery shortage (% of demand)",
    views: ["dist"],
    plain:
      "How much, if any, community water system deliveries are short of their estimated recent potable demands for those sources.",
    tech: "For each location of interest, the shortfall between estimated recent potable demand (based on SAFER Clearinghouse data) and surface water deliveries (modeled via CalSim3), expressed as a percent of demand: the site derives it as 100 minus the served percent of demand met (demand-weighted at the NOD_CWS/SOD_CWS aggregates, capped at 100 upstream), so it is never negative. This is the annual surface water delivery shortage, distinct from the municipal supply shortage of the CWS economics analysis. The served series is aggregated by calendar year, so its first and last years are stubs; the site keeps 1922 to 2020. Water-year-type filtering does not apply: the CWS team aggregated these series by calendar year, not water year.",
    tierOutcome: "CWS_DEL",
    tierOutcomeName: "Community surface water",
    data: "live",
    wytApplicable: false,
    yearBasis: "calendar",
    servedYearRange: { min: 1922, max: 2020 },
    mockKind: "short",
    mockEffect: "cwsShort",
  },
  cws_short: {
    id: "cws_short",
    proseName: "municipal supply shortage",
    name: "Municipal supply shortages",
    sectorId: "cwsS",
    locationGroup: "cwsShortage",
    unit: "TAF",
    unitLabel: TAF,
    views: ["dist", "pct_demand"],
    viewLabels: { dist: "Shortage (TAF)", pct_demand: "% of demand" },
    viewUnits: { pct_demand: { unit: "%", unitLabel: "percent of demand" } },
    plain:
      "How much water communities needed but did not get, accounting for surface water deliveries and groundwater sources. Shortages are generally zero in wet years but can spike in droughts. Water shortage is expressed as a volume of unmet demand (annual TAF) and as a percent of unmet demand (%) for all locations of interest.",
    tech: "Served live from the cws data-in-depth endpoint on the NOD_CWS/SOD_CWS aggregates and on the 63 community water systems in the CWS economics analysis: the volume view reads the shortage_total measure (annual TAF), the percent view reads the served shortage_pct measure directly (0-100). Note the shortage measures aggregate over the systems with modeled shortage series, a narrower set than the delivery measure covers, so shortage_pct is not simply 100 minus pct_demand_met. Water-year-type filtering does not apply because the annual data were calculated by calendar year, not water year.",
    data: "live",
    wytApplicable: false,
    mockKind: "short",
    mockEffect: "cwsShort",
  },
  cws_welfare: {
    id: "cws_welfare",
    proseName: "welfare loss",
    name: "Welfare loss",
    sectorId: "cwsS",
    locationGroup: "cwsShortage",
    unit: "$M",
    unitLabel: "million dollars per year",
    views: ["dist"],
    plain:
      "Welfare loss measures the value consumers would have been willing to pay above prevailing water rates to avoid the water reduction they face in any given scenario. The welfare loss outcome reports annual residential consumer welfare loss in dollars per year for each municipal location.",
    tech: "Served live from the cws data-in-depth endpoint's welfare_loss measure (the capped welfare-loss series from the CWS economics analysis) on the NOD_CWS/SOD_CWS aggregates and on the 63 community water systems with modeled shortage series; the site displays millions of dollars. Water-year-type filtering does not apply: the loss is an economic outcome that does not decompose by water year. See the Community water deliveries outcome level brief on the Data page for more information.",
    data: "live",
    wytApplicable: false,
    mockKind: "short",
    mockEffect: "cwsShort",
  },
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Variable ids retired by being FOLDED INTO a view of another variable, with
 * the view that now shows the same quantity.
 *
 * Share URLs carry a variable id and a view, so a link minted before a fold
 * must land on the same chart rather than on a stranger. Generic healing
 * (fall back to the default variable) is the right answer for a variable
 * whose content is simply gone; this map is for the ones whose content still
 * exists, just under a different address.
 */
const FOLDED_VARIABLE_IDS: Record<string, { id: string; view: VariableView }> =
  {
    // "Shortage as % of demand" became ag_short's percent-of-demand view.
    ag_shortpct: { id: "ag_short", view: "pct_demand" },
  }

/**
 * Variable ids retired OUTRIGHT: their content is gone, not moved. A share
 * URL or persisted session carrying one lands on the default variable, on
 * purpose and deterministically, rather than on whatever the caller's own
 * fallback happens to be.
 *
 * - ndo_uif, "Outflow as % of unimpaired flow": provisional sample data only;
 *   the unimpaired series exists as a spreadsheet, not in the API. Dropped
 *   from the Delta outflows sector at the project lead's request (Aug 2026).
 */
export const RETIRED_VARIABLE_IDS: ReadonlySet<string> = new Set(["ndo_uif"])

/**
 * Resolves a persisted (variableId, view) pair through the fold map and the
 * retired set. Returns the pair unchanged when the id was never folded or
 * retired, so callers can apply it unconditionally. Pure.
 */
export function resolveFoldedVariable(
  variableId: string,
  view: string,
): { id: string; view: string } {
  const folded = FOLDED_VARIABLE_IDS[variableId]
  if (folded) return { id: folded.id, view: folded.view }
  if (RETIRED_VARIABLE_IDS.has(variableId)) {
    return { id: DEFAULT_VARIABLE_ID, view: "dist" }
  }
  // A view the variable no longer offers (a retired summary view) heals to
  // its first view, so a stale link never renders a chart with no button.
  const def = VARIABLES[variableId]
  if (def && !def.views.includes(view as VariableView)) {
    return { id: variableId, view: def.views[0] ?? "dist" }
  }
  return { id: variableId, view }
}

/**
 * Text of the key-outcome chip under the variable breadcrumb, or null when
 * the variable shows no chip. "not-used" wins over the tier metadata; a
 * tier outcome name reads as "used in calculation of key outcome: <name>".
 * Pure.
 */
export function keyOutcomeChipText(variable: VariableDef): string | null {
  if (variable.keyOutcomeChip === "not-used") {
    return "not used in calculation of key outcome"
  }
  if (variable.tierOutcomeName) {
    return `used in calculation of key outcome: ${variable.tierOutcomeName}`
  }
  return null
}

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

/**
 * Carry the location selection from one group to another when a variable
 * switch changes groups (community water systems deliveries vs shortages
 * bind different, overlapping system lists). The location picked last
 * follows the user into the next group when that group has it; a location
 * the next group lacks is left behind, and the next group's own pin (its
 * default at worst) stands. The store seeds every group with a default pin,
 * so "no pin yet" cannot be told apart from "the default", which is why the
 * latest pick wins rather than only filling a gap. Pure: returns new
 * records, never mutates the inputs.
 */
export function carryLocationSelection(
  prevGroupId: string,
  nextGroupId: string,
  pinnedLocationByGroup: Record<string, string>,
  selectedLocationsByGroup: Record<string, string[]>,
): {
  pinnedLocationByGroup: Record<string, string>
  selectedLocationsByGroup: Record<string, string[]>
} {
  const next = LOCATION_GROUPS[nextGroupId as LocationGroupId]
  if (prevGroupId === nextGroupId || !next) {
    return { pinnedLocationByGroup, selectedLocationsByGroup }
  }
  const has = (id: string) => next.items.some((l) => l.id === id)
  const pins = { ...pinnedLocationByGroup }
  const prevPin = pinnedLocationByGroup[prevGroupId]
  if (prevPin && has(prevPin)) pins[nextGroupId] = prevPin
  const selections = { ...selectedLocationsByGroup }
  const carried = (selectedLocationsByGroup[prevGroupId] ?? []).filter(has)
  if (carried.length > 0) selections[nextGroupId] = carried
  return { pinnedLocationByGroup: pins, selectedLocationsByGroup: selections }
}

/** The reason shown wherever a groundwater total cannot take the Level view. */
export const LEVEL_VIEW_UNAVAILABLE_REASON =
  "Groundwater levels are reported per basin; the North and South of Delta totals are volumes."

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
