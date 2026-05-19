"use client"

import React from "react"
import { Box, icons } from "@repo/ui/mui"

export const INFO_ICON_PLACEHOLDER = "{{infoIcon}}"

/** Step body with optional inline info icon via `{{infoIcon}}` in tour copy */
export function TourBodyContent({
  body,
  infoIconColor,
}: {
  body: string
  infoIconColor: string
}) {
  if (!body.includes(INFO_ICON_PLACEHOLDER)) {
    return <>{body}</>
  }
  const parts = body.split(INFO_ICON_PLACEHOLDER)
  const InfoGlyph = icons.InfoOutlined
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 ? (
            <Box
              component="span"
              role="img"
              aria-label="info"
              sx={{
                display: "inline-flex",
                verticalAlign: "middle",
                position: "relative",
                top: -1,
                mx: 0.2,
              }}
            >
              <InfoGlyph
                sx={{
                  fontSize: "1.1em",
                  color: infoIconColor,
                }}
              />
            </Box>
          ) : null}
        </React.Fragment>
      ))}
    </>
  )
}
