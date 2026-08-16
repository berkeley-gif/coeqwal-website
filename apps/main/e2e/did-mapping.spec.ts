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
  expect(didDomainForVariable("riv_uif")).toBeNull() // % of unimpaired not served
  expect(didDomainForVariable("station_ec")).toBeNull()
  expect(didDomainForVariable("nonsense")).toBeNull()
})

test("didPeriodForVariable pins one period per live variable", () => {
  expect(didPeriodForVariable("res_apr")).toBe("april")
  expect(didPeriodForVariable("res_sep")).toBe("sept")
  expect(didPeriodForVariable("riv_flow")).toBe("annual")
  expect(didPeriodForVariable("x2_apr")).toBe("april")
  expect(didPeriodForVariable("x2_sep")).toBe("sept")
  expect(didPeriodForVariable("riv_uif")).toBeNull()
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

test("gw serves only the NOD/SOD aggregates live; named basins stay mock pending the basin-to-WBA lookup", () => {
  expect(toDidSubject("gw", "AGG_GW_NOD")).toBe("NOD_GroundwaterStorage")
  expect(toDidSubject("gw", "AGG_GW_SOD")).toBe("SOD_GroundwaterStorage")
  expect(toDidSubject("gw", "COL")).toBeNull()
  expect(toDidSubject("gw", "MER")).toBeNull()
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
