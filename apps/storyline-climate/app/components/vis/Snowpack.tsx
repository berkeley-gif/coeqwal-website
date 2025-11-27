import React, { useState } from "react"
import * as d3 from "d3"
import { Typography } from "@repo/ui/mui"
import { useFetchData } from "../../hooks/useFetchData"
import SnowpackLine, { SnowRow } from "./SnowpackLine"
import { MotionValue } from "@repo/motion"

export type ContainerSize = { width: number; height: number }

export default function SnowpackContainer({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>
}) {
  const [rows, setRows] = useState<SnowRow[]>([])
  const [yExtents, setYExtents] = useState<[number, number]>([0, 0])

  // Change this path to where you host the JSON in your app
  useFetchData("./data/Snowpack.json", (raw: SnowRow[]) => {
    setRows(raw)
    const values = raw.flatMap((r) => [r["CanESM2 (Average)"] ?? undefined])
    const min = 0
    const max = d3.max(values.filter((v): v is number => v != null)) ?? 0
    const pad = max * 0.05 || 1
    setYExtents([min, max + pad])
  })

  const hasData = rows.length > 0

  return (
    <>
      <div style={{ width: "100%", height: "100%" }}>
        {hasData ? (
          <SnowpackLine
            data={rows}
            yExtents={yExtents}
            scrollProgress={scrollProgress}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="body1">
              Loading snowpack time series…
            </Typography>
          </div>
        )}
      </div>
    </>
  )
}
