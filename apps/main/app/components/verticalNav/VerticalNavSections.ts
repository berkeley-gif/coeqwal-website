/**
 * verticalNavSections.ts
 *
 * Single source of truth for the vertical sidebar nav structure.
 *
 * First-level items = top-level page sections (routing targets).
 * Second-level items = sub-sections within a first-level item,
 * highlighted automatically when the user scrolls to them.
 *
 */

import { SECTION_LABELS, type SectionId, SECTION_LAYERS } from "../../features/map/config/sectionLayers"


export interface NavSubSection {
  /** Must match the `id` prop on the rendered DOM element for scroll detection */
  id: string
  label: string
}

export interface NavSection {
  /**
   * Unique identifier. Used as the routing key — wire this to your
   * route/mapMode values when routing is confirmed.
   * FLAG: update these ids to match your actual route keys.
   */
  id: string
  label: string
  subSections: NavSubSection[]
}

const GET_STARTED_SUBSECTIONS: NavSubSection[] = (
  Object.keys(SECTION_LABELS) as SectionId[]
)
  .filter((id) => !SECTION_LAYERS[id].isHiddenFromVerticalNav)
  .map((id) => ({
    id,
    label: SECTION_LABELS[id],
  }))

export const NAV_SECTIONS: NavSection[] = [
  {
    // FLAG: update id to match the map route/mapMode value (e.g. "learn", "get-started")
    id: "get-started",
    label: "Get Started",
    subSections: GET_STARTED_SUBSECTIONS,
  },
  {
    // FLAG: update id to match the Water Issues route key
    id: "water-issues",
    label: "Water Issues",
    // No sub-sections yet — add when the Water Issues page has scrollable sections
    subSections: [],
  },
  {
    // FLAG: update id to match the Water Stories route key
    id: "water-stories",
    label: "Water Stories",
    // No sub-sections yet — add when the Water Stories page has scrollable sections
    subSections: [],
  },
]
