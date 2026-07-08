"use client"

import { Typography } from "../../mui-components"
import type { TypographyProps } from "../../mui-components"
import { Text } from "./Text"
import type { MarkClassNames, MarkSx, RichText, TextBlock } from "./types"

export type ParagraphAlignment = "left" | "center"

export interface ParagraphProps extends Omit<TypographyProps, "children"> {
  blocks: readonly (TextBlock | RichText)[]
  alignment?: ParagraphAlignment
  markSx?: MarkSx
  markClassNames?: MarkClassNames
}

export function Paragraph({
  blocks,
  variant = "body1",
  alignment = "left",
  markSx,
  markClassNames,
  sx,
  ...typographyProps
}: ParagraphProps) {
  const alignmentSx =
    alignment === "center"
      ? { textAlign: "center", mx: "auto" }
      : { textAlign: "left", mx: 0 }

  return (
    <>
      {blocks.map((block, index) => (
        <Typography
          key={index}
          variant={variant}
          sx={[alignmentSx, ...(Array.isArray(sx) ? sx : [sx])]}
          {...typographyProps}
        >
          <Text value={block} markSx={markSx} markClassNames={markClassNames} />
        </Typography>
      ))}
    </>
  )
}
