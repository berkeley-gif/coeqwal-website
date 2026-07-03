"use client"

import { Typography } from "../../mui-components"
import type { TypographyProps } from "../../mui-components"
import { Text } from "./Text"
import type { MarkClassNames, MarkSx, RichText, TextBlock } from "./types"

export interface ParagraphProps extends Omit<TypographyProps, "children"> {
  blocks: readonly (TextBlock | RichText)[]
  markSx?: MarkSx
  markClassNames?: MarkClassNames
}

export function Paragraph({
  blocks,
  variant = "body1",
  markSx,
  markClassNames,
  ...typographyProps
}: ParagraphProps) {
  return (
    <>
      {blocks.map((block, index) => (
        <Typography key={index} variant={variant} {...typographyProps}>
          <Text value={block} markSx={markSx} markClassNames={markClassNames} />
        </Typography>
      ))}
    </>
  )
}
