"use client"

import { ReactNode } from "react"
import { Box } from "@repo/ui/mui"
import { CallResponsePanel } from "@repo/ui"

export interface ScrollSectionContentProps {
  /** Section identifier (used for panel id) */
  id: string
  /** Panel side - left for "call", right for "response" */
  side: "left" | "right"
  /** Content to display in the panel */
  children: ReactNode
  /** Whether the panel is visible (for entrance animation) */
  isVisible: boolean
  /** Minimum height of the section (default: "100vh") */
  minHeight?: string
  /** Additional margin top */
  mt?: string
  /** Whether this is a sticky section with progress tracking */
  sticky?: boolean
  /** Disable the highlight effect */
  disableHighlight?: boolean
}

/**
 * ScrollSectionContent - Content wrapper for scrollytelling sections
 *
 * Combines Box + CallResponsePanel boilerplate into a single component.
 * Developer note: This does not include the <Step> wrapper. That must remain as a
 * direct child of <Scrollama> in the parent component so that Scrolama can find it.
 *
 * Usage:
 * ```tsx
 * <Step data={"section-id" as SectionId}>
 *   <ScrollSectionContent id="section-id" side="left" isVisible={true}>
 *     <YourContent />
 *   </ScrollSectionContent>
 * </Step>
 * ```
 */
export function ScrollSectionContent({
  id,
  side,
  children,
  isVisible,
  minHeight = "100vh",
  mt,
  sticky = false,
  disableHighlight = false,
}: ScrollSectionContentProps) {
  const variant = side === "left" ? "call" : "response"

  // Sticky section (e.g., rivers)
  if (sticky) {
    return (
      <Box
        sx={{
          minHeight: minHeight,
          position: "relative",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <CallResponsePanel
            id={`${id}-${variant}`}
            side={side}
            variant={variant}
            isVisible={isVisible}
            disableHighlight={disableHighlight}
            sx={{ minHeight: "auto", mb: 0 }}
          >
            {children}
          </CallResponsePanel>
        </Box>
      </Box>
    )
  }

  // Standard section
  return (
    <Box
      sx={{
        minHeight,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
        ...(mt && { mt }),
      }}
    >
      <CallResponsePanel
        id={`${id}-${variant}`}
        side={side}
        variant={variant}
        isVisible={isVisible}
        disableHighlight={disableHighlight}
      >
        {children}
      </CallResponsePanel>
    </Box>
  )
}

/**
 * TriggerSectionContent - invisible section that only triggers layer changes
 *
 * Developer note: This does not include the <Step> wrapper. See comment above.
 */
export function TriggerSectionContent({ minHeight = "100vh" }: { minHeight?: string }) {
  return (
    <Box
      sx={{
        minHeight,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {/* Hidden trigger section */}
    </Box>
  )
}
