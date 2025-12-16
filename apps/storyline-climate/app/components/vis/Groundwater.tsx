import React, { useEffect, useState } from "react"
import * as d3 from "d3"
import { Typography } from "@repo/ui/mui"
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

  useEffect(() => {
    let cancelled = false

    d3.csv("./data/combined_groundwater.csv", d3.autoType).then((raw) => {
      if (cancelled) return

      const processed: GroundwaterRow[] = raw
        .map((d: any) => {
          const year = Number(d["Year"])
          const gwRaw = Number(d["GW Change"])

          // only flip negatives numbers
          const gwDepth =
            Number.isFinite(gwRaw) && gwRaw < 0 ? -gwRaw : gwRaw
          return {
            msmt_date: `${year}-01-01`,
            date: new Date(year, 0, 1),
            gse_gwe: gwDepth,
          }
        })
        .filter(
          (d) =>
            Number.isFinite(d.gse_gwe) &&
            d.date instanceof Date &&
            !Number.isNaN(d.date.getTime())
        )
      setRows(processed)

      const values = processed.map((r) => r.gse_gwe)
      const min = 0
      const max = d3.max(values) ?? 0
      const pad = max * 0.05 || 1
      setYExtents([min, max + pad])
    })

    return () => {
      cancelled = true
    }
  }, [])

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