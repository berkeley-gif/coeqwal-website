import { test, expect } from "@playwright/test"
import {
  didDomainForVariable,
  viewHasLiveSource,
  didPeriodForVariable,
  toDidSubject,
  unitTokenForView,
  includeForView,
  seriesFromValues,
  pickLiveSeries,
  pointsFromValues,
  pickLiveSeriesPoints,
  didLiveScaleForVariable,
  SSJV_ALL_ROUTES_LOCATION,
  SSJV_ROUTE_SUBJECTS,
  sumAlignedSeriesPoints,
  companionUnitTokensForView,
  hasEmptyScenariosResponse,
  trimPointsToYearRange,
  blockHasSubject,
  locationAxisRequest,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/didMapping"

// Pure request-mapping for the data-in-depth live endpoints. Node-side spec
// (no browser), runs in the e2e-core CI job. Subject codes are pinned to the
// live API/DB (verified 2026-07-20): reservoirs and rivers have curated remaps
// and only X2 is served for delta.

test("didDomainForVariable maps live variables and returns null for mock ones", () => {
  expect(didDomainForVariable("res_apr")).toBe("reservoir")
  expect(didDomainForVariable("res_sep")).toBe("reservoir")
  expect(didDomainForVariable("riv_flow")).toBe("river")
  expect(didDomainForVariable("x2_apr")).toBe("delta")
  expect(didDomainForVariable("x2_sep")).toBe("delta")
  // Not served live -> mock:
  expect(didDomainForVariable("ndo_uif")).toBeNull() // % of unimpaired not served
  expect(didDomainForVariable("station_ec")).toBeNull()
  expect(didDomainForVariable("nonsense")).toBeNull()
})

test("didPeriodForVariable pins one period per live variable", () => {
  expect(didPeriodForVariable("res_apr")).toBe("april")
  expect(didPeriodForVariable("res_sep")).toBe("sept")
  expect(didPeriodForVariable("riv_flow")).toBe("annual")
  expect(didPeriodForVariable("x2_apr")).toBe("april")
  expect(didPeriodForVariable("x2_sep")).toBe("sept")
  expect(didPeriodForVariable("ndo_uif")).toBeNull()
})

test("didLiveScaleForVariable scales served salmon percent to proportion, others pass through", () => {
  // The salmon endpoint serves percent (0-100, the same units as the Salmon
  // Data Drop csv); the tool displays proportion (0-1.0, confirmed at the
  // 2026-08-18 review), so the adopted live series scales by 0.01.
  expect(didLiveScaleForVariable("salmon_abund")).toBe(0.01)
  expect(didLiveScaleForVariable("res_apr")).toBe(1)
  expect(didLiveScaleForVariable("nonsense")).toBe(1)
})

test("toDidSubject maps reservoir location ids to API subject codes", () => {
  // exact matches pass through
  expect(toDidSubject("reservoir", "SHSTA")).toBe("SHSTA")
  expect(toDidSubject("reservoir", "FOLSM")).toBe("FOLSM")
  // curated remaps
  expect(toDidSubject("reservoir", "SLCVP")).toBe("SLUIS_CVP")
  expect(toDidSubject("reservoir", "SLSWP")).toBe("SLUIS_SWP")
  expect(toDidSubject("reservoir", "AGG_NOD")).toBe("NOD_Reservoirs")
  expect(toDidSubject("reservoir", "AGG_SOD")).toBe("SOD_Reservoirs")
  // unknown -> null (mock fallback, never fetch a subject the API lacks)
  expect(toDidSubject("reservoir", "MADE_UP")).toBeNull()
})

test("toDidSubject maps river location ids, remapping the four that differ", () => {
  expect(toDidSubject("river", "AMR004")).toBe("AMR004")
  expect(toDidSubject("river", "SAC049")).toBe("SAC049")
  expect(toDidSubject("river", "SJR070")).toBe("SJR070")
  // registry ids that differ from API codes
  expect(toDidSubject("river", "YRS")).toBe("YUB002")
  expect(toDidSubject("river", "TLG")).toBe("TUO003")
  expect(toDidSubject("river", "MRC")).toBe("MCD005")
  expect(toDidSubject("river", "MKM")).toBe("MOK028")
  expect(toDidSubject("river", "MADE_UP")).toBeNull()
})

test("toDidSubject returns X2 for delta regardless of location", () => {
  expect(toDidSubject("delta", "X2")).toBe("X2")
  expect(toDidSubject("delta", "DELTA")).toBe("X2")
})

test("ndo resolves to the river domain's SAC000 series", () => {
  // Delta outflow is served by the river-flows endpoint as the CalSim
  // C_SAC000 channel (confirmed by the modeling team, 2026-08-20), so ndo
  // borrows the river domain rather than the delta one (which serves X2
  // only). The DELTA location id is unique to ndo, so remapping it to the
  // SAC000 subject cannot collide with riv_flow's own SAC000 location.
  expect(didDomainForVariable("ndo")).toBe("river")
  expect(didPeriodForVariable("ndo")).toBe("annual")
  expect(toDidSubject("river", "DELTA", "ndo")).toBe("SAC000")
  // riv_flow keeps its own location group, so the remap changes nothing there.
  expect(toDidSubject("river", "SAC000")).toBe("SAC000")
})

test("unitTokenForView picks the request unit per domain and view", () => {
  expect(unitTokenForView("reservoir", "dist")).toBe("volume")
  expect(unitTokenForView("reservoir", "pct")).toBe("pct_capacity")
  expect(unitTokenForView("reservoir", "cv")).toBe("volume")
  expect(unitTokenForView("river", "dist")).toBe("volume")
  expect(unitTokenForView("delta", "dist")).toBe("km")
  expect(unitTokenForView("delta", "pct")).toBe("km") // delta ignores pct
})

test("includeForView requests only values (FE derives the rest)", () => {
  expect(includeForView("dist")).toEqual(["values"])
  expect(includeForView("cv")).toEqual(["values"])
})

test("seriesFromValues extracts numbers and drops nulls", () => {
  expect(
    seriesFromValues([
      { value: 10 },
      { value: null },
      { value: 0 },
      { value: 4552.1 },
    ]),
  ).toEqual([10, 0, 4552.1])
  expect(seriesFromValues([])).toEqual([])
  expect(seriesFromValues(undefined)).toEqual([])
})

test("pickLiveSeries reads the values facet by domain, subject, period, unit", () => {
  // Reservoir: array key "reservoirs", request unit "volume" -> response key "TAF".
  const reservoirBlock = {
    scenario: "s0020",
    reservoirs: [
      {
        subject: "SHSTA",
        periods: {
          april: {
            TAF: {
              values: [{ value: 4552.1 }, { value: null }, { value: 2157.9 }],
            },
          },
          sept: { TAF: { values: [{ value: 1200 }] } },
        },
      },
    ],
  }
  expect(
    pickLiveSeries(reservoirBlock, "reservoir", "SHSTA", "april", "volume"),
  ).toEqual([4552.1, 2157.9])

  // pct request unit -> response key PCT_CAP
  const pctBlock = {
    reservoirs: [
      {
        subject: "SHSTA",
        periods: { april: { PCT_CAP: { values: [{ value: 90 }] } } },
      },
    ],
  }
  expect(
    pickLiveSeries(pctBlock, "reservoir", "SHSTA", "april", "pct_capacity"),
  ).toEqual([90])

  // River: array key "rivers", annual, TAF
  const riverBlock = {
    rivers: [
      {
        subject: "YUB002",
        periods: { annual: { TAF: { values: [{ value: 300 }] } } },
      },
    ],
  }
  expect(
    pickLiveSeries(riverBlock, "river", "YUB002", "annual", "volume"),
  ).toEqual([300])

  // Delta: array key "subjects", km
  const deltaBlock = {
    subjects: [
      {
        subject: "X2",
        periods: { april: { km: { values: [{ value: 64.3 }] } } },
      },
    ],
  }
  expect(pickLiveSeries(deltaBlock, "delta", "X2", "april", "km")).toEqual([
    64.3,
  ])

  // Missing subject / period / block -> empty (caller falls back to mock)
  expect(
    pickLiveSeries(reservoirBlock, "reservoir", "OROVL", "april", "volume"),
  ).toEqual([])
  expect(
    pickLiveSeries(undefined, "reservoir", "SHSTA", "april", "volume"),
  ).toEqual([])
})

test("pointsFromValues keeps years aligned with values and drops null years", () => {
  const { series, waterYears } = pointsFromValues([
    { water_year: 1921, value: 4200 },
    { water_year: 1922, value: null },
    { water_year: 1923, value: 3100 },
  ])
  expect(series).toEqual([4200, 3100])
  expect(waterYears).toEqual([1921, 1923])
})

test("pointsFromValues tolerates missing water_year fields", () => {
  const { series, waterYears } = pointsFromValues([{ value: 5 }, { value: 7 }])
  expect(series).toEqual([5, 7])
  expect(waterYears).toEqual([])
})

test("pickLiveSeriesPoints mirrors pickLiveSeries and adds years", () => {
  const block = {
    reservoirs: [
      {
        subject: "SHSTA",
        periods: {
          april: { TAF: { values: [{ water_year: 1921, value: 4200 }] } },
        },
      },
    ],
  }
  const points = pickLiveSeriesPoints(
    block,
    "reservoir",
    "SHSTA",
    "april",
    "volume",
  )
  expect(points.series).toEqual([4200])
  expect(points.waterYears).toEqual([1921])
  expect(
    pickLiveSeriesPoints(block, "reservoir", "OROVL", "april", "volume").series,
  ).toEqual([])
})

test("data-in-depth endpoint paths serialize the wyt filter deduped and sorted", async () => {
  // The wyt= query parameter IS the server-side water-year-type filter and
  // doubles as part of the SWR cache key, so its serialization must be
  // order-independent. Imported from @repo/data source directly (types-only
  // imports, safe in this node-side spec).
  const { ENDPOINTS } = await import("../../../packages/data/src/coeqwal/api")
  const path = ENDPOINTS.reservoirStorageDataInDepth(["s0020"], {
    subjects: ["SHSTA"],
    wyt: [5, 1, 5],
  })
  expect(path).toContain("wyt=1%2C5")
  const unfiltered = ENDPOINTS.reservoirStorageDataInDepth(["s0020"], {
    subjects: ["SHSTA"],
  })
  expect(unfiltered).not.toContain("wyt=")
})

test("the CWS request contract omits wyt and fails loud on a smuggled one", async () => {
  // The CWS series aggregate by calendar year upstream, so a water-year-type
  // filter cannot apply to them. The registry flag stops the UI from sending
  // one; this is the contract-level backstop. `wyt` is not a field on
  // CwsDataInDepthOptions (a caller that adds one fails check-types), and the
  // builder throws rather than silently dropping it, so a coordination
  // failure is visible to the caller instead of buried.
  const { ENDPOINTS } = await import("../../../packages/data/src/coeqwal/api")
  const path = ENDPOINTS.cwsDataInDepth(["s0020"], { subjects: ["NOD_CWS"] })
  expect(path).not.toContain("wyt=")
  expect(() =>
    ENDPOINTS.cwsDataInDepth(["s0020"], {
      subjects: ["NOD_CWS"],
      wyt: [1, 2],
    } as Parameters<typeof ENDPOINTS.cwsDataInDepth>[1] & { wyt: number[] }),
  ).toThrow(/wyt/)
})

test("system-delivery variables map to the sysdel domain with annual periods", () => {
  expect(didDomainForVariable("cvp_del")).toBe("sysdel")
  expect(didDomainForVariable("swp_del")).toBe("sysdel")
  expect(didDomainForVariable("tot_exp")).toBe("sysdel")
  expect(didPeriodForVariable("cvp_del")).toBe("annual")
  expect(didPeriodForVariable("swp_del")).toBe("annual")
  expect(didPeriodForVariable("tot_exp")).toBe("annual")
})

test("sysdel subjects depend on the variable as well as the location", () => {
  // CVP and SWP deliveries: system total plus north/south of Delta splits.
  expect(toDidSubject("sysdel", "SYS", "cvp_del")).toBe("DEL_CVP_TOTAL")
  expect(toDidSubject("sysdel", "NOD", "cvp_del")).toBe("DEL_CVP_TOT_N_WAMER")
  expect(toDidSubject("sysdel", "SOD", "cvp_del")).toBe("DEL_CVP_TOT_S_WLOSS")
  expect(toDidSubject("sysdel", "SYS", "swp_del")).toBe("DEL_SWP_TOTAL")
  expect(toDidSubject("sysdel", "NOD", "swp_del")).toBe("DEL_SWP_TOT_N")
  expect(toDidSubject("sysdel", "SOD", "swp_del")).toBe("DEL_SWP_TOT_S")
  // Delta exports have no regional split in CalSim; single Delta location.
  expect(toDidSubject("sysdel", "DELTA", "tot_exp")).toBe(
    "C_CVPSWP_TOTAL_EXPORTS",
  )
  // Unknown location or missing variable id -> null (mock fallback).
  expect(toDidSubject("sysdel", "NOD", "tot_exp")).toBeNull()
  expect(toDidSubject("sysdel", "SYS", "nonsense")).toBeNull()
  expect(toDidSubject("sysdel", "SYS")).toBeNull()
})

test("sector-specific delivery variables map their verified subject codes", () => {
  // Subject codes pinned to the live endpoint (25 subjects). The split code
  // patterns are asymmetric on purpose; they quote the API, not a naming
  // convention.
  expect(toDidSubject("sysdel", "SYS", "cvp_ag")).toBe("DEL_CVP_PAG_TOTAL")
  expect(toDidSubject("sysdel", "NOD", "cvp_ag")).toBe("DEL_CVP_PAG_NOD")
  expect(toDidSubject("sysdel", "SOD", "cvp_ag")).toBe("DEL_CVP_PAG_SOD")
  expect(toDidSubject("sysdel", "SYS", "cvp_mi")).toBe("DEL_CVP_PMI_TOTAL")
  expect(toDidSubject("sysdel", "NOD", "cvp_mi")).toBe("DEL_CVP_PMI_N_WAMER")
  expect(toDidSubject("sysdel", "SOD", "cvp_mi")).toBe("DEL_CVP_PMI_S")
  expect(toDidSubject("sysdel", "SYS", "swp_ag")).toBe("DEL_SWP_PAG_TOTAL")
  expect(toDidSubject("sysdel", "NOD", "swp_ag")).toBe("DEL_SWP_PAG_NOD")
  expect(toDidSubject("sysdel", "SOD", "swp_ag")).toBe("DEL_SWP_PAG_S")
  expect(toDidSubject("sysdel", "SYS", "swp_mi")).toBe("DEL_SWP_PMI")
  expect(toDidSubject("sysdel", "NOD", "swp_mi")).toBe("DEL_SWP_PMI_N")
  expect(toDidSubject("sysdel", "SOD", "swp_mi")).toBe("DEL_SWP_PMI_S")
  // Refuges are served as a system total only: no regional splits exist.
  expect(toDidSubject("sysdel", "SYS", "cvp_refuges")).toBe("DEL_CVP_PRF_TOTAL")
  expect(toDidSubject("sysdel", "NOD", "cvp_refuges")).toBeNull()
  expect(toDidSubject("sysdel", "SOD", "cvp_refuges")).toBeNull()
  // Per-project Delta exports at the single Delta location; regional and
  // system ids stay unmapped.
  expect(toDidSubject("sysdel", "DELTA", "cvp_exp")).toBe("C_CVP_TOTAL_EXPORTS")
  expect(toDidSubject("sysdel", "DELTA", "swp_exp")).toBe("C_CAA003_SWP")
  expect(toDidSubject("sysdel", "SYS", "cvp_exp")).toBeNull()
  expect(toDidSubject("sysdel", "NOD", "swp_exp")).toBeNull()
  // Southern SJV exports: three served component routes as locations under
  // one variable; no served total exists and none is computed client-side.
  expect(toDidSubject("sysdel", "CVC", "ssjv_exp")).toBe("D_CAA238_CVPCV")
  expect(toDidSubject("sysdel", "FRIANT", "ssjv_exp")).toBe("D_MLRTN_FRK000")
  expect(toDidSubject("sysdel", "KERN", "ssjv_exp")).toBe("SWP_TA_KERNAG")
  expect(toDidSubject("sysdel", "SYS", "ssjv_exp")).toBeNull()
})

test("sector-specific delivery variables map to sysdel with annual periods", () => {
  for (const id of [
    "cvp_ag",
    "cvp_mi",
    "cvp_refuges",
    "swp_ag",
    "swp_mi",
    "cvp_exp",
    "swp_exp",
    "ssjv_exp",
  ]) {
    expect(didDomainForVariable(id)).toBe("sysdel")
    expect(didPeriodForVariable(id)).toBe("annual")
  }
})

test("viewHasLiveSource: only mock-surfaced views opt out of live adoption", () => {
  expect(viewHasLiveSource("dist")).toBe(true)
  expect(viewHasLiveSource("pct")).toBe(true)
  expect(viewHasLiveSource("level")).toBe(true)
  expect(viewHasLiveSource("cv")).toBe(true)
  // Monthly bands and summary values come from the sample engine even when a
  // live series exists, so these views must not claim live data.
  expect(viewHasLiveSource("monthly")).toBe(false)
  expect(viewHasLiveSource("value")).toBe(false)
  // Allowlist semantics: an unknown future view defaults to sample-labeled.
  expect(viewHasLiveSource("someFutureView")).toBe(false)
})

test("pickLiveSeries reads sysdel blocks from the subjects array under TAF", () => {
  const block = {
    subjects: [
      {
        subject: "DEL_CVP_TOTAL",
        periods: {
          annual: { TAF: { values: [{ water_year: 1922, value: 5432.1 }] } },
        },
      },
    ],
  }
  expect(
    pickLiveSeries(block, "sysdel", "DEL_CVP_TOTAL", "annual", "volume"),
  ).toEqual([5432.1])
  expect(
    pickLiveSeries(block, "sysdel", "DEL_SWP_TOTAL", "annual", "volume"),
  ).toEqual([])
})

test("groundwater aggregates and salmon map to their own domains with annual periods", () => {
  expect(didDomainForVariable("gw_stor")).toBe("gw")
  expect(didDomainForVariable("salmon_abund")).toBe("salmon")
  expect(didPeriodForVariable("gw_stor")).toBe("annual")
  expect(didPeriodForVariable("salmon_abund")).toBe("annual")
})

test("gw subjects: aggregates remap, served basins pass through by code", () => {
  expect(toDidSubject("gw", "AGG_GW_NOD")).toBe("NOD_GroundwaterStorage")
  expect(toDidSubject("gw", "AGG_GW_SOD")).toBe("SOD_GroundwaterStorage")
  // Basin location ids ARE the endpoint's subject codes (42 served basins:
  // 41 WBA* codes plus DETAW), validated against the served set so a typo'd
  // or retired id falls back to mock instead of a dead request.
  expect(toDidSubject("gw", "WBA10")).toBe("WBA10")
  expect(toDidSubject("gw", "WBA8S")).toBe("WBA8S")
  expect(toDidSubject("gw", "WBA90")).toBe("WBA90")
  expect(toDidSubject("gw", "DETAW")).toBe("DETAW")
  // Unknown ids stay unmapped, including the retired sample placeholders.
  expect(toDidSubject("gw", "COL")).toBeNull()
  expect(toDidSubject("gw", "MER")).toBeNull()
  expect(toDidSubject("gw", "WBA99")).toBeNull()
  expect(toDidSubject("salmon", "WRLCM")).toBe("WRLCM_ADULT_FEMALES")
})

test("measure-keyed domains resolve their own request tokens and response keys", () => {
  expect(unitTokenForView("gw", "dist")).toBe("volume")
  expect(unitTokenForView("gw", "level")).toBe("level")
  expect(unitTokenForView("salmon", "dist")).toBe("nof_3yr_avg")
  const gwBlock = {
    subjects: [
      {
        subject: "NOD_GroundwaterStorage",
        periods: {
          annual: { volume: { values: [{ water_year: 1922, value: 42 }] } },
        },
      },
    ],
  }
  expect(
    pickLiveSeries(gwBlock, "gw", "NOD_GroundwaterStorage", "annual", "volume"),
  ).toEqual([42])
  // Aggregates never serve level; an absent key falls back to mock.
  expect(
    pickLiveSeries(gwBlock, "gw", "NOD_GroundwaterStorage", "annual", "level"),
  ).toEqual([])
  const salmonBlock = {
    subjects: [
      {
        subject: "WRLCM_ADULT_FEMALES",
        periods: {
          annual: {
            NOF_3YR_AVG: { values: [{ water_year: 1934, value: 0.23 }] },
          },
        },
      },
    ],
  }
  expect(
    pickLiveSeries(
      salmonBlock,
      "salmon",
      "WRLCM_ADULT_FEMALES",
      "annual",
      "nof_3yr_avg",
    ),
  ).toEqual([0.23])
})

// CWS wiring (2026-08-19): the cws endpoint serves delivery, shortage_total,
// and shortage_pct (plus pct_demand_met and welfare_loss) with NOD_CWS and
// SOD_CWS aggregate subjects. The explorer wires both CWS variables on the
// aggregates; entity-level locations follow once the location list is
// finalized with the data team, so unknown ids stay unmapped (mock).

test("cws variables map to the cws domain with annual periods", () => {
  expect(didDomainForVariable("cws_del")).toBe("cws")
  expect(didDomainForVariable("cws_short")).toBe("cws")
  expect(didPeriodForVariable("cws_del")).toBe("annual")
  expect(didPeriodForVariable("cws_short")).toBe("annual")
})

test("cws subjects: only the served NOD/SOD aggregates resolve", () => {
  expect(toDidSubject("cws", "AGG_CWS_NOD", "cws_del")).toBe("NOD_CWS")
  expect(toDidSubject("cws", "AGG_CWS_SOD", "cws_short")).toBe("SOD_CWS")
  // Retired illustrative groups and entity codes stay unmapped until the
  // entity-level location list is finalized.
  expect(toDidSubject("cws", "CWS_SACU")).toBeNull()
  expect(toDidSubject("cws", "02_NU")).toBeNull()
})

test("cws request tokens are measures, split per variable and view", () => {
  expect(unitTokenForView("cws", "dist", "cws_del")).toBe("delivery")
  expect(unitTokenForView("cws", "dist", "cws_short")).toBe("shortage_total")
  expect(unitTokenForView("cws", "pct_demand", "cws_short")).toBe(
    "shortage_pct",
  )
  // The percent-of-demand view draws only live-backed distribution surfaces.
  expect(viewHasLiveSource("pct_demand")).toBe(true)
  const cwsBlock = {
    subjects: [
      {
        subject: "NOD_CWS",
        periods: {
          annual: {
            delivery: { values: [{ water_year: 1922, value: 380.5 }] },
            shortage_pct: { values: [{ water_year: 1922, value: 6.2 }] },
          },
        },
      },
    ],
  }
  expect(
    pickLiveSeries(cwsBlock, "cws", "NOD_CWS", "annual", "delivery"),
  ).toEqual([380.5])
  expect(
    pickLiveSeries(cwsBlock, "cws", "NOD_CWS", "annual", "shortage_pct"),
  ).toEqual([6.2])
  // A measure the block does not carry falls back to mock.
  expect(
    pickLiveSeries(cwsBlock, "cws", "NOD_CWS", "annual", "shortage_total"),
  ).toEqual([])
})

// SSJV all-routes total (2026-08-19 team decision): no combined subject is
// served, so the explorer sums the three served route series client-side,
// FAIL-CLOSED: the sum exists only when every route series is present with
// identical, verifiable water years; anything less falls back to sample
// labeling, never a partial sum.

test("ssjv all-routes location expands to the three served route subjects", () => {
  expect(SSJV_ALL_ROUTES_LOCATION).toBe("ALL_ROUTES")
  expect([...SSJV_ROUTE_SUBJECTS]).toEqual([
    "D_CAA238_CVPCV",
    "D_MLRTN_FRK000",
    "SWP_TA_KERNAG",
  ])
  // The synthetic total is not a served subject: the single-subject mapping
  // stays null for it, so nothing ever requests a subject the API lacks.
  expect(toDidSubject("sysdel", "ALL_ROUTES", "ssjv_exp")).toBeNull()
})

test("sumAlignedSeriesPoints sums only complete, year-aligned series", () => {
  const cvc = { series: [63, 60], waterYears: [1922, 1923] }
  const friant = { series: [877, 880], waterYears: [1922, 1923] }
  const kern = { series: [415, 410], waterYears: [1922, 1923] }
  // Expected-total fixture: per-year sums, shared years.
  expect(sumAlignedSeriesPoints([cvc, friant, kern])).toEqual({
    series: [1355, 1350],
    waterYears: [1922, 1923],
  })
  // A missing route series (empty) kills the sum.
  expect(
    sumAlignedSeriesPoints([cvc, friant, { series: [], waterYears: [] }]),
  ).toBeNull()
  // A length mismatch kills the sum.
  expect(
    sumAlignedSeriesPoints([
      cvc,
      friant,
      { series: [415], waterYears: [1922] },
    ]),
  ).toBeNull()
  // Misaligned years kill the sum even at equal lengths.
  expect(
    sumAlignedSeriesPoints([
      cvc,
      friant,
      { series: [415, 410], waterYears: [1922, 1924] },
    ]),
  ).toBeNull()
  // Unverifiable years (pointsFromValues returns empty waterYears when any
  // point lacked a water_year) kill the sum: alignment cannot be proven.
  expect(
    sumAlignedSeriesPoints([
      cvc,
      friant,
      { series: [415, 410], waterYears: [] },
    ]),
  ).toBeNull()
  expect(sumAlignedSeriesPoints([])).toBeNull()
})

// Agriculture wiring (2026-08-21): the ag endpoint serves net_diversion,
// gw_pumping, shortage, and revenue on the NOD_Agriculture / SOD_Agriculture
// aggregate subjects. Aggregates only in this pass, mirroring the CWS
// precedent: there is no upstream-confirmed entity-level demand-unit list, so
// the four illustrative sample groups retire rather than being guessed at.

test("ag variables resolve the ag domain on the NOD/SOD aggregates", () => {
  expect(didDomainForVariable("ag_del")).toBe("ag")
  expect(didDomainForVariable("ag_pump")).toBe("ag")
  expect(didDomainForVariable("ag_short")).toBe("ag")
  expect(didPeriodForVariable("ag_del")).toBe("annual")
  expect(didPeriodForVariable("ag_pump")).toBe("annual")
  expect(didPeriodForVariable("ag_short")).toBe("annual")
  expect(toDidSubject("ag", "AGG_AG_NOD", "ag_del")).toBe("NOD_Agriculture")
  expect(toDidSubject("ag", "AGG_AG_SOD", "ag_pump")).toBe("SOD_Agriculture")
  // The retired illustrative groups stay unmapped, so a stale persisted pin
  // falls back to sample data rather than fetching a subject that does not
  // exist.
  expect(toDidSubject("ag", "AG_SAC", "ag_del")).toBeNull()
  expect(toDidSubject("ag", "AG_ALL", "ag_del")).toBeNull()
  // Revenue is an external-model output and stays out of scope.
  // Revenue is served too (see the dedicated case below).
  expect(didDomainForVariable("ag_rev")).toBe("ag")
})

test("ag measure tokens are keyed per variable and never scaled", () => {
  expect(unitTokenForView("ag", "dist", "ag_del")).toBe("net_diversion")
  expect(unitTokenForView("ag", "dist", "ag_pump")).toBe("gw_pumping")
  // Shortage is the primary series in BOTH of ag_short's views: the percent
  // view derives rather than switching to a served percent measure.
  expect(unitTokenForView("ag", "dist", "ag_short")).toBe("shortage")
  expect(unitTokenForView("ag", "pct_demand", "ag_short")).toBe("shortage")
  // The upstream extraction bug that made ag volumes read 1000x low was fixed
  // in the databases, so the served values are already TAF. Pinning the scale
  // at 1 makes a future client-side "correction" fail loudly instead of
  // silently double-counting the upstream fix.
  expect(didLiveScaleForVariable("ag_del")).toBe(1)
  expect(didLiveScaleForVariable("ag_pump")).toBe(1)
  expect(didLiveScaleForVariable("ag_short")).toBe(1)
})

test("only the ag percent-of-demand view needs a companion measure", () => {
  // The ag endpoint serves no percent measure, so that view fetches shortage
  // AND net_diversion and derives the percent on the site. Every other view
  // and domain fetches exactly one measure; community water systems in
  // particular adopt a SERVED shortage_pct and need no companion, so a
  // regression that gave them one would fetch a measure nothing reads.
  expect(companionUnitTokensForView("ag", "pct_demand", "ag_short")).toEqual([
    "net_diversion",
  ])
  expect(companionUnitTokensForView("ag", "dist", "ag_short")).toEqual([])
  expect(companionUnitTokensForView("ag", "dist", "ag_del")).toEqual([])
  expect(companionUnitTokensForView("cws", "pct_demand", "cws_short")).toEqual(
    [],
  )
  expect(companionUnitTokensForView("reservoir", "dist", "res_apr")).toEqual([])
})

test("hasEmptyScenariosResponse separates 'not modeled' from 'still loading'", () => {
  // The endpoint answers 200 with an empty scenarios array when a scenario is
  // not modeled for the variable (salmon under the Delta Conveyance Project),
  // so hasData alone cannot tell that apart from a pending request. Only a
  // RESOLVED, non-loading, empty response counts.
  expect(
    hasEmptyScenariosResponse({
      hasData: true,
      isLoading: false,
      scenarios: [],
    }),
  ).toBe(true)
  expect(
    hasEmptyScenariosResponse({
      hasData: true,
      isLoading: false,
      scenarios: [{ scenario: "s0020" }],
    }),
  ).toBe(false)
  // Mid-flight: not yet an answer, so not yet a "no data" verdict.
  expect(
    hasEmptyScenariosResponse({
      hasData: true,
      isLoading: true,
      scenarios: [],
    }),
  ).toBe(false)
  // Never fetched, and a slot that does not exist at all.
  expect(
    hasEmptyScenariosResponse({
      hasData: false,
      isLoading: false,
      scenarios: [],
    }),
  ).toBe(false)
  expect(hasEmptyScenariosResponse(undefined)).toBe(false)
})

// Entity-level subjects for the ag and CWS domains: the served code IS the
// registry id, and each CWS variable resolves only within its own measure
// family (delivery vs shortage/welfare), so the site never requests a subject
// the endpoint does not serve for that measure.
test("toDidSubject resolves ag demand units and CWS systems per measure family", () => {
  expect(toDidSubject("ag", "08N_SA2", "ag_del")).toBe("08N_SA2")
  expect(toDidSubject("ag", "90_PA1", "ag_pump")).toBe("90_PA1")
  expect(toDidSubject("ag", "AGG_AG_NOD", "ag_short")).toBe("NOD_Agriculture")
  expect(toDidSubject("ag", "NOD_Agriculture", "ag_del")).toBeNull()
  expect(toDidSubject("cws", "MWD", "cws_del")).toBe("MWD")
  expect(toDidSubject("cws", "MWD", "cws_short")).toBeNull()
  expect(toDidSubject("cws", "02_NU", "cws_short")).toBe("02_NU")
  expect(toDidSubject("cws", "02_NU", "cws_del")).toBeNull()
  expect(toDidSubject("cws", "26N_NU1", "cws_del")).toBe("26N_NU1")
  expect(toDidSubject("cws", "26N_NU1", "cws_short")).toBe("26N_NU1")
  expect(toDidSubject("cws", "AGG_CWS_SOD", "cws_short")).toBe("SOD_CWS")
  expect(toDidSubject("cws", "NO_SUCH", "cws_del")).toBeNull()
  // Without a variable the cws domain cannot pick a family: aggregates only.
  expect(toDidSubject("cws", "MWD")).toBeNull()
  expect(toDidSubject("cws", "AGG_CWS_NOD")).toBe("NOD_CWS")
})

// The CWS delivery family is a calendar-year series over a model run that
// starts in October 1921 and ends in September 2021, so its first and last
// years are three-month and nine-month stubs (about 0.2 and 0.8 of a full
// year). The site trims a served series to the registry's servedYearRange
// before adoption; a series without years cannot be trimmed safely and is
// returned untouched rather than partially trimmed.
test("trimPointsToYearRange drops points outside the range, index-aligned, and fails closed without years", () => {
  const points = {
    series: [10, 100, 110, 120, 80],
    waterYears: [1921, 1922, 1923, 2020, 2021],
  }
  expect(trimPointsToYearRange(points, { min: 1922, max: 2020 })).toEqual({
    series: [100, 110, 120],
    waterYears: [1922, 1923, 2020],
  })
  // Nothing outside the range: unchanged.
  expect(
    trimPointsToYearRange(
      { series: [1, 2], waterYears: [1950, 1951] },
      { min: 1922, max: 2020 },
    ),
  ).toEqual({ series: [1, 2], waterYears: [1950, 1951] })
  // No years: cannot tell which points are stubs, so nothing is dropped.
  const noYears = { series: [10, 100], waterYears: [] }
  expect(trimPointsToYearRange(noYears, { min: 1922, max: 2020 })).toBe(noYears)
})

// A served scenario block that lacks the requested subject means the subject
// is not modeled for that scenario (KCWA is absent from the five Delta
// Conveyance Project scenarios on /cws). That is a fact about the model,
// distinct from an empty response (scenario not modeled at all) and from a
// transport failure.
test("blockHasSubject reports whether a served block carries the subject", () => {
  const block = {
    subjects: [{ subject: "MWD", periods: {} }, { subject: "NOD_CWS" }],
  }
  expect(blockHasSubject(block, "cws", "MWD")).toBe(true)
  expect(blockHasSubject(block, "cws", "KCWA")).toBe(false)
  expect(blockHasSubject(undefined, "cws", "MWD")).toBe(false)
  expect(
    blockHasSubject(
      { reservoirs: [{ subject: "SHSTA" }] },
      "reservoir",
      "SHSTA",
    ),
  ).toBe(true)
})

// Welfare loss reads the cws endpoint's welfare_loss measure (USD) and is the
// second variable of the shortage/welfare family, so it resolves the same
// 63-system list as delivery shortages. The served dollars scale to millions
// on adoption; the scale table is pinned exactly so an accidental scale on
// any other variable regresses loudly.
test("welfare loss maps to the welfare_loss measure on the shortage family and scales USD to $M", () => {
  expect(didDomainForVariable("cws_welfare")).toBe("cws")
  expect(didPeriodForVariable("cws_welfare")).toBe("annual")
  expect(unitTokenForView("cws", "dist", "cws_welfare")).toBe("welfare_loss")
  expect(toDidSubject("cws", "02_NU", "cws_welfare")).toBe("02_NU")
  expect(toDidSubject("cws", "MWD", "cws_welfare")).toBeNull()
  expect(toDidSubject("cws", "AGG_CWS_NOD", "cws_welfare")).toBe("NOD_CWS")
  expect(didLiveScaleForVariable("cws_welfare")).toBe(1e-6)
  expect(didLiveScaleForVariable("cws_short")).toBe(1)
  expect(didLiveScaleForVariable("ag_del")).toBe(1)
  expect(
    pickLiveSeriesPoints(
      {
        subjects: [
          {
            subject: "NOD_CWS",
            periods: {
              annual: {
                welfare_loss: {
                  values: [{ water_year: 1922, value: 2551000 }],
                },
              },
            },
          },
        ],
      },
      "cws",
      "NOD_CWS",
      "annual",
      "welfare_loss",
    ).series,
  ).toEqual([2551000])
})

// Compare by Locations makes ONE request per chart (the held scenario, every
// selected location's subject) and each member picks its own series by
// subject id. The helper turns the selected location ids into that request:
// deduplicated subjects in first-seen order, and per member the subject to
// pick (or the SSJV route list for the synthetic total, or null when the
// registry cannot map the id, which renders sample, labeled).
test("locationAxisRequest builds one deduplicated subject list and per-member selectors", () => {
  expect(
    locationAxisRequest("reservoir", "res_apr", ["SHSTA", "OROVL", "TRNTY"]),
  ).toEqual({
    subjects: ["SHSTA", "OROVL", "TRNTY"],
    memberSubjects: ["SHSTA", "OROVL", "TRNTY"],
  })
  expect(
    locationAxisRequest("reservoir", "res_apr", ["SLCVP", "SLSWP", "AGG_NOD"]),
  ).toEqual({
    subjects: ["SLUIS_CVP", "SLUIS_SWP", "NOD_Reservoirs"],
    memberSubjects: ["SLUIS_CVP", "SLUIS_SWP", "NOD_Reservoirs"],
  })
  expect(
    locationAxisRequest("sysdel", "cvp_del", ["SYS", "NOD", "SOD"]),
  ).toEqual({
    subjects: ["DEL_CVP_TOTAL", "DEL_CVP_TOT_N_WAMER", "DEL_CVP_TOT_S_WLOSS"],
    memberSubjects: [
      "DEL_CVP_TOTAL",
      "DEL_CVP_TOT_N_WAMER",
      "DEL_CVP_TOT_S_WLOSS",
    ],
  })
  // The SSJV total depends on its three route subjects; a route picked
  // alongside it shares the request without duplicating the subject.
  expect(
    locationAxisRequest("sysdel", "ssjv_exp", [
      SSJV_ALL_ROUTES_LOCATION,
      "CVC",
    ]),
  ).toEqual({
    subjects: ["D_CAA238_CVPCV", "D_MLRTN_FRK000", "SWP_TA_KERNAG"],
    memberSubjects: [[...SSJV_ROUTE_SUBJECTS], "D_CAA238_CVPCV"],
  })
  // Unknown ids map to null and never enter the request; a duplicated id
  // is requested once and still yields two members.
  expect(
    locationAxisRequest("reservoir", "res_apr", ["SHSTA", "NOPE", "SHSTA"]),
  ).toEqual({
    subjects: ["SHSTA"],
    memberSubjects: ["SHSTA", null, "SHSTA"],
  })
  // Entities: ag demand units and CWS systems ride the same helper.
  expect(
    locationAxisRequest("ag", "ag_del", ["AGG_AG_NOD", "08N_SA2", "90_PA1"]),
  ).toEqual({
    subjects: ["NOD_Agriculture", "08N_SA2", "90_PA1"],
    memberSubjects: ["NOD_Agriculture", "08N_SA2", "90_PA1"],
  })
})

// Revenue reads the ag endpoint's revenue measure (USD) and scales to $M on
// adoption, the third and last entry in the scale table.
test("gross crop revenues maps to the revenue measure and scales USD to $M", () => {
  expect(didDomainForVariable("ag_rev")).toBe("ag")
  expect(unitTokenForView("ag", "dist", "ag_rev")).toBe("revenue")
  expect(didLiveScaleForVariable("ag_rev")).toBe(1e-6)
  expect(didLiveScaleForVariable("ag_short")).toBe(1)
  expect(
    pickLiveSeriesPoints(
      {
        subjects: [
          {
            subject: "08N_SA2",
            periods: {
              annual: {
                revenue: { values: [{ water_year: 1922, value: 178500000 }] },
              },
            },
          },
        ],
      },
      "ag",
      "08N_SA2",
      "annual",
      "revenue",
    ).series,
  ).toEqual([178500000])
})
