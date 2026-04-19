export type SnowpackTrendRow = {
  year: number
  "CanESM2 (Average)": number | null
}

type TrendPoint = { year: number; value: number }

export function getSnowpackTrendEndpoints(
  rows: SnowpackTrendRow[],
  maxYear = 2050,
): [TrendPoint, TrendPoint] | null {
  const points = rows
    .filter(
      (d): d is SnowpackTrendRow & { "CanESM2 (Average)": number } =>
        Number.isFinite(d.year) &&
        typeof d["CanESM2 (Average)"] === "number" &&
        d.year <= maxYear,
    )
    .map((d) => ({ year: d.year, value: d["CanESM2 (Average)"] }))

  if (points.length < 2) return null

  const n = points.length
  const sumX = points.reduce((acc, d) => acc + d.year, 0)
  const sumY = points.reduce((acc, d) => acc + d.value, 0)
  const sumXY = points.reduce((acc, d) => acc + d.year * d.value, 0)
  const sumXX = points.reduce((acc, d) => acc + d.year * d.year, 0)
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  const minYearPoint = points.reduce((minP, p) =>
    p.year < minP.year ? p : minP,
  )
  const maxYearPoint = points.reduce((maxP, p) =>
    p.year > maxP.year ? p : maxP,
  )

  return [
    {
      year: minYearPoint.year,
      value: slope * minYearPoint.year + intercept,
    },
    {
      year: maxYearPoint.year,
      value: slope * maxYearPoint.year + intercept,
    },
  ]
}
