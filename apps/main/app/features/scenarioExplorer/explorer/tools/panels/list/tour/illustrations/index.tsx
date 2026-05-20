/**
 * List tour illustrations registry. Maps the `illustration` string used in
 * `steps.ts` to a renderer that the `ToolTour` runner inlines into the
 * popper card. Keep entries tightly scoped per visual block; the
 * `ControlIllustration` variants are exposed as distinct keys so the
 * step copy can refer to "the search field" or "the sort button"
 * without forking illustrations into separate components.
 */

import React, { type ReactNode } from "react"
import BarIllustration from "./BarIllustration"
import MapLegend from "./MapLegend"
import ControlIllustration from "./ControlIllustration"

export const LIST_TOUR_ILLUSTRATIONS: Record<string, () => ReactNode> = {
  listBarTiers: () => <BarIllustration />,
  listMapLegend: () => <MapLegend />,
  listSearch: () => <ControlIllustration variant="search" />,
  listChips: () => <ControlIllustration variant="chips" />,
  listSortButton: () => <ControlIllustration variant="sortButton" />,
  listCheckbox: () => <ControlIllustration variant="checkbox" />,
  listHydroclimate: () => <ControlIllustration variant="hydroclimate" />,
}
