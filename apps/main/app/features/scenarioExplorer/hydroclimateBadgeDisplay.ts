import { hydroclimateOptions } from "../../content/scenarios"
import { HYDROCLIMATE_CONFIG } from "../scenarios/components/HydroclimateChooser"

export function getHydroclimateBadgeDisplay(hydroclimate: string): {
  title: string
  accentColor: string
} | null {
  const opt = hydroclimateOptions.find((o) => o.value === hydroclimate)
  const cfg = HYDROCLIMATE_CONFIG[hydroclimate]
  if (!opt || !cfg) return null
  return {
    title: `${opt.label} hydroclimate`,
    accentColor: cfg.bgColor,
  }
}
