import type { NavDropdownOption } from "@repo/ui"
import { WATER_THEMES } from "../../../../main/app/content/themes"

const MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "https://dev.coeqwal.org"

function buildMainUrl(path = "", search = "") {
  return `${MAIN_APP_URL}${path}${search}`
}

export function getStorylineWaterThemesOptions(): NavDropdownOption[] {
  return WATER_THEMES.map((theme) => ({
    key: theme.id,
    label: theme.label.replace(/\n/g, " "),
    onClick: () => {
      if (typeof window === "undefined") return
      window.location.href = buildMainUrl("/", `?theme=${theme.id}`)
    },
    disabled: theme.sections.length === 0,
  }))
}

export function goToMainHome() {
  if (typeof window === "undefined") return
  window.location.href = buildMainUrl("/")
}

export function goToMainAbout() {
  if (typeof window === "undefined") return
  window.location.href = buildMainUrl("/about")
}

export function goToMainData() {
  if (typeof window === "undefined") return
  window.location.href = buildMainUrl("/data")
}
