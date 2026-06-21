import type { Theme } from "@repo/ui/mui"

/**
 * sx helpers for the CategoryView outcome-category accordions. Kept separate
 * so CategoryView stays focused on composition rather than styling.
 */

/**
 * Outer Accordion sx for a category card. Neutral chrome with a subtle
 * shadow on hover when collapsed.
 */
export function getAccordionStyles(theme: Theme, isExpanded: boolean) {
  return {
    backgroundColor: theme.palette.background.paper,
    boxShadow: "none",
    border: theme.border.light,
    mb: theme.space.component.lg,
    transition: theme.transition.default,
    "&:before": { display: "none" },
    "&:hover": { boxShadow: isExpanded ? "none" : theme.shadow.subtle },
  }
}

/**
 * AccordionSummary sx for a category. Adds the 4px colored left rail and
 * pins the summary to the top of the viewport while expanded.
 */
export function getSummaryStyles(
  theme: Theme,
  color: string,
  isExpanded: boolean,
) {
  return {
    backgroundColor: theme.palette.background.paper,
    borderLeft: `4px solid ${color}`,
    borderBottom: isExpanded ? theme.border.light : "none",
    minHeight: 64,
    "&:hover": { backgroundColor: theme.palette.grey[50] },
    "& .MuiAccordionSummary-content": { my: 1.5 },
    ...(isExpanded && {
      position: "sticky" as const,
      top: 0,
      zIndex: 10,
    }),
  }
}

/** Solid colored square that holds the category icon to the left of the title */
export function getIconChipStyles(theme: Theme, color: string) {
  return {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.sm,
    backgroundColor: color,
    color: theme.palette.common.white,
    fontSize: 20,
  }
}
