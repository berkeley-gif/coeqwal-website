import React, { useState } from "react"
import * as d3 from "d3"
import { Typography } from "@repo/ui/mui"
import { useFetchData } from "../../hooks/useFetchData"
import GroundwaterLine, { GroundwaterRow } from "./GroundwaterLine"
import { MotionValue } from "@repo/motion"

export type ContainerSize = { width: number; height: number }

export default function GroundwaterContainer({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>
}) {
  const [rows, setRows] = useState<GroundwaterRow[]>([])
  const [yExtents, setYExtents] = useState<[number, number]>([0, 0])

  useFetchData("./data/Groundwater.json", (raw: GroundwaterRow[]) => {
    // parse dates
    const processed = raw.map((d) => ({
      ...d,
      date: new Date(d.msmt_date),
    }))

    setRows(processed)

    const values = processed.map((r) => r.gse_gwe)
    const min = 0 // always start from 0
    const max = d3.max(values) ?? 0
    const pad = max * 0.05 || 1
    setYExtents([min, max + pad])
  })

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {rows.length > 0 ? (
        <GroundwaterLine
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
          <Typography variant="body1">Loading groundwater levels…</Typography>
        </div>
      )}
    </div>
  )
}
