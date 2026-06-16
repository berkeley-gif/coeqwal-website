import { hydroclimateOptions } from "../../../../../../content/scenarios"
import {
  HYDROCLIMATE_CONFIG,
  HYDROCLIMATE_FALLBACK_ACCENT,
} from "../../../../../scenarios/hydroclimateConfig"

export function getHydroclimateBadgeDisplay(hydroclimate: string): {
  title: string
  accentColor: string
} | null {
  const opt = hydroclimateOptions.find((o) => o.value === hydroclimate)
  if (!opt) return null
  const cfg = HYDROCLIMATE_CONFIG[hydroclimate]
  return {
    title: `${opt.label} hydroclimate`,
    accentColor: cfg?.bgColor ?? HYDROCLIMATE_FALLBACK_ACCENT,
  }
}
