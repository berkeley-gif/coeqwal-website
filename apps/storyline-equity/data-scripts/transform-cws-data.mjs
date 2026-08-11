import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const appDirectory = path.resolve(scriptDirectory, "..")
const outputDirectory = path.join(
  appDirectory,
  "public",
  "data",
  "community-water-systems",
)

const [annualCsvPath, tiersJsonPath, monthlyCsvPath] = process.argv.slice(2)

if (!annualCsvPath || !tiersJsonPath || !monthlyCsvPath) {
  throw new Error(
    "Usage: node scripts/transform-cws-data.mjs <annual.csv> <tiers.json> <monthly.csv>",
  )
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ""
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === "," && !quoted) {
      row.push(value)
      value = ""
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1
      row.push(value)
      if (row.some((cell) => cell !== "")) rows.push(row)
      row = []
      value = ""
    } else {
      value += character
    }
  }

  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }

  const [headers, ...data] = rows
  return data.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index]])),
  )
}

function groupBy(rows, key) {
  const groups = new Map()

  for (const row of rows) {
    const groupKey = row[key]
    if (!groups.has(groupKey)) groups.set(groupKey, [])
    groups.get(groupKey).push(row)
  }

  return groups
}

function classifyTier({ shareAbove90Pct, minimumPercentMet, shareBelow50Pct }) {
  if (shareAbove90Pct >= 0.9 && minimumPercentMet >= 70) return 1
  if (shareAbove90Pct >= 0.5 && minimumPercentMet >= 50) return 2
  if (shareAbove90Pct >= 0.5 && shareBelow50Pct <= 0.2) return 3
  return 4
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function round(value, places = 6) {
  const factor = 10 ** places
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

const [annualText, tiersText, monthlyText] = await Promise.all([
  readFile(path.resolve(annualCsvPath), "utf8"),
  readFile(path.resolve(tiersJsonPath), "utf8"),
  readFile(path.resolve(monthlyCsvPath), "utf8"),
])

const annualRows = parseCsv(annualText).map((row) => ({
  scenarioId: row.scenario_id,
  locationId: row.dwuc,
  year: Number(row.year),
  annualDeliveryTaf: Number(row.annual_delivery),
  annualDemandTaf: Number(row.annual_demand),
  percentDemandMet: Number(row.percent_demand_met),
}))

const monthlyRows = parseCsv(monthlyText).map((row) => ({
  scenarioId: row.scenario_id,
  locationId: row.dwuc,
  date: row.date,
  year: Number(row.year),
  deliveryTaf: Number(row.delivery_taf),
}))

const sourceTiers = JSON.parse(tiersText)
const tierResult = sourceTiers.results.CWS_DEL
const sourceTierByLocation = new Map(
  tierResult.locations.map((location) => [location.location_id, location]),
)
const annualByLocation = groupBy(annualRows, "locationId")
const monthlyByLocation = groupBy(monthlyRows, "locationId")
const locationIds = [...annualByLocation.keys()].sort()
const scenarioIds = new Set([
  ...annualRows.map((row) => row.scenarioId),
  ...monthlyRows.map((row) => row.scenarioId),
  sourceTiers.scenario,
])

assert(scenarioIds.size === 1, "Expected one consistent scenario identifier")
assert(
  locationIds.length === 74,
  `Expected 74 locations, found ${locationIds.length}`,
)
assert(
  locationIds.every(
    (locationId) =>
      monthlyByLocation.has(locationId) && sourceTierByLocation.has(locationId),
  ),
  "Location identifiers do not match across source files",
)

const annualLocations = locationIds.map((locationId) => {
  const years = annualByLocation.get(locationId).sort((a, b) => a.year - b.year)

  return {
    locationId,
    years: years.map(
      ({ year, annualDeliveryTaf, annualDemandTaf, percentDemandMet }) => ({
        year,
        annualDeliveryTaf,
        annualDemandTaf,
        percentDemandMet,
      }),
    ),
  }
})

const monthlyLocations = locationIds.map((locationId) => {
  const series = monthlyByLocation
    .get(locationId)
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    locationId,
    series: series.map(({ date, year, deliveryTaf }) => ({
      date,
      year,
      deliveryTaf,
    })),
  }
})

const nodeDeliveryMedians = locationIds.map((locationId) => {
  const waterYearTotals = new Map()
  const fullYearDemandTaf = median(
    annualByLocation
      .get(locationId)
      .filter((row) => row.year > 1921 && row.year < 2021)
      .map((row) => row.annualDemandTaf),
  )

  for (const row of monthlyByLocation.get(locationId)) {
    const [calendarYear, month] = row.date.split("-").map(Number)
    const waterYear = month >= 10 ? calendarYear + 1 : calendarYear
    waterYearTotals.set(
      waterYear,
      (waterYearTotals.get(waterYear) ?? 0) + row.deliveryTaf,
    )
  }

  const completeWaterYears = [...waterYearTotals.values()]
  assert(
    completeWaterYears.length === 100,
    `${locationId}: expected 100 complete water years`,
  )

  return {
    locationId,
    medianAnnualDeliveryTaf: round(median(completeWaterYears)),
    annualDemandTafByWaterYear: Array.from({ length: 100 }, () =>
      round(fullYearDemandTaf),
    ),
  }
})

for (const locationId of locationIds) {
  const annual = annualByLocation.get(locationId)
  const monthly = monthlyByLocation.get(locationId)
  const monthlyTotals = new Map()

  for (const row of monthly) {
    monthlyTotals.set(
      row.year,
      (monthlyTotals.get(row.year) ?? 0) + row.deliveryTaf,
    )
  }

  for (const row of annual) {
    const difference = Math.abs(
      row.annualDeliveryTaf - (monthlyTotals.get(row.year) ?? Number.NaN),
    )
    assert(
      difference < 1e-8,
      `${locationId} ${row.year}: monthly deliveries do not match annual delivery`,
    )
  }
}

const tierLocations = locationIds.map((locationId) => {
  const years = annualByLocation.get(locationId)
  const sourceTier = sourceTierByLocation.get(locationId)
  const yearsAbove90Pct = years.filter(
    (year) => year.percentDemandMet > 90,
  ).length
  const yearsBelow50Pct = years.filter(
    (year) => year.percentDemandMet < 50,
  ).length
  const minimumPercentMet = Math.min(
    ...years.map((year) => year.percentDemandMet),
  )
  const shareAbove90Pct = yearsAbove90Pct / years.length
  const shareBelow50Pct = yearsBelow50Pct / years.length
  const calculatedTier = classifyTier({
    shareAbove90Pct,
    minimumPercentMet,
    shareBelow50Pct,
  })

  assert(
    calculatedTier === sourceTier.tier_level,
    `${locationId}: calculated tier ${calculatedTier} does not match source tier ${sourceTier.tier_level}`,
  )

  return {
    locationId,
    locationName: sourceTier.location_name,
    locationType: sourceTier.location_type,
    yearsEvaluated: years.length,
    yearsAbove90Pct,
    shareAbove90Pct: round(shareAbove90Pct),
    yearsBelow50Pct,
    shareBelow50Pct: round(shareBelow50Pct),
    minimumPercentMet: round(minimumPercentMet),
    tierLevel: sourceTier.tier_level,
    tierContinuous: Number(sourceTier.tier_continuous),
  }
})

const tierCounts = Object.fromEntries(
  [1, 2, 3, 4].map((tierLevel) => [
    tierLevel,
    tierLocations.filter((location) => location.tierLevel === tierLevel).length,
  ]),
)

const scenarioId = [...scenarioIds][0]
const years = annualRows.map((row) => row.year)
const dates = monthlyRows.map((row) => row.date).sort()
const sharedSource = {
  scenarioId,
  sourceFiles: {
    annualDemandPerformance: path.basename(annualCsvPath),
    tiers: path.basename(tiersJsonPath),
    monthlyDeliveries: path.basename(monthlyCsvPath),
  },
}

const monthlyOutput = {
  schemaVersion: 1,
  ...sharedSource,
  metric: "Community water system monthly surface-water deliveries",
  unit: "thousand acre-feet",
  dateRange: { start: dates[0], end: dates.at(-1) },
  locationCount: locationIds.length,
  recordCount: monthlyRows.length,
  locations: monthlyLocations,
}

const annualOutput = {
  schemaVersion: 1,
  ...sharedSource,
  metric: "Annual community water system potable demand met",
  units: {
    annualDeliveryTaf: "thousand acre-feet",
    annualDemandTaf: "thousand acre-feet",
    percentDemandMet: "percent, capped at 100",
  },
  calculation:
    "percentDemandMet = min(100, annualDeliveryTaf / annualDemandTaf * 100)",
  yearRange: { start: Math.min(...years), end: Math.max(...years) },
  endpointNote:
    "The monthly source begins in October 1921 and ends in September 2021; calendar years 1921 and 2021 are partial.",
  locationCount: locationIds.length,
  recordCount: annualRows.length,
  locations: annualLocations,
}

const tiersOutput = {
  schemaVersion: 1,
  ...sharedSource,
  outcomeCode: "CWS_DEL",
  outcomeName: "Community surface water",
  description:
    "Extent to which surface-water deliveries to cities and towns satisfy associated estimated potable drinking-water demands.",
  scope:
    "Only State Water Project and Central Valley Project surface-water deliveries are evaluated. Groundwater and other surface-water supplies are not included.",
  tierDefinitions: [
    {
      level: 1,
      name: "Optimal",
      criteria: {
        minimumShareOfYearsAbove90Pct: 0.9,
        minimumPercentMetInEveryYear: 70,
      },
    },
    {
      level: 2,
      name: "Acceptable",
      criteria: {
        minimumShareOfYearsAbove90Pct: 0.5,
        minimumPercentMetInEveryYear: 50,
      },
    },
    {
      level: 3,
      name: "At-risk",
      criteria: {
        minimumShareOfYearsAbove90Pct: 0.5,
        maximumShareOfAllYearsBelow50Pct: 0.2,
      },
    },
    {
      level: 4,
      name: "Critical",
      criteria: {
        fallback: "None of the criteria for tiers 1–3 are met.",
      },
    },
  ],
  thresholdNotes: {
    above90Comparison: "strictly greater than 90 percent",
    below50Comparison: "strictly less than 50 percent",
    atRiskDenominator:
      "The 20 percent threshold is evaluated against all years in the source series.",
    tierContinuous:
      "Preserved from the source tier file; its calculation is not documented in the supplied files.",
  },
  tierCounts,
  locationCount: tierLocations.length,
  locations: tierLocations,
}

const nodeDeliveryMediansOutput = {
  schemaVersion: 1,
  ...sharedSource,
  metric: "Median annual community water system delivery by water year",
  unit: "thousand acre-feet",
  waterYearRange: { start: 1922, end: 2021 },
  locationCount: nodeDeliveryMedians.length,
  locations: nodeDeliveryMedians,
}

await mkdir(outputDirectory, { recursive: true })
await Promise.all([
  writeFile(
    path.join(outputDirectory, "monthly-deliveries.json"),
    `${JSON.stringify(monthlyOutput)}\n`,
  ),
  writeFile(
    path.join(outputDirectory, "annual-demand-performance.json"),
    `${JSON.stringify(annualOutput)}\n`,
  ),
  writeFile(
    path.join(outputDirectory, "tiers.json"),
    `${JSON.stringify(tiersOutput, null, 2)}\n`,
  ),
  writeFile(
    path.join(outputDirectory, "node-delivery-medians.json"),
    `${JSON.stringify(nodeDeliveryMediansOutput, null, 2)}\n`,
  ),
])

console.log(
  JSON.stringify(
    {
      outputDirectory,
      scenarioId,
      monthlyRecords: monthlyRows.length,
      annualRecords: annualRows.length,
      locations: locationIds.length,
      tierCounts,
    },
    null,
    2,
  ),
)
