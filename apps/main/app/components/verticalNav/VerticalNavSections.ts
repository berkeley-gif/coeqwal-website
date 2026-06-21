/**
 * verticalNavSections.ts
 *
 * Single source of truth for the vertical sidebar nav structure.
 *
 * First-level items = top-level page sections (routing targets).
 * Second-level items = sub-sections within a first-level item,
 * highlighted automatically when the user scrolls to them.
 *
 * HOW TO EXTEND:
 * - Add a new NavSection to NAV_SECTIONS with a unique `id`.
 * - If it has scrollable sub-sections, add them to `subSections`
 *   with `id` values that match the `id` props on the rendered elements.
 * - If it has no sub-sections (e.g. a static page), leave `subSections` empty.
 *
 * FLAG: `id` values on first-level items and the routing logic in the click
 * handler (VerticalNav.tsx) need to be wired to your actual routing system
 * (e.g. usePanelRoute, Next.js router, or mapMode). Update those ids and
 * the `onNavigate` callback when routing is confirmed.
 */

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

export const NAV_SECTIONS: NavSection[] = [
  {
    // FLAG: update id to match the map route/mapMode value (e.g. "learn", "get-started")
    id: "get-started",
    label: "Get Started",
    subSections: [
      // Learn map sections (from MapOverlayPanels / SectionId)
      // FLAG: confirm with coworkers whether these Learn scroll steps should
      // appear as 2nd-level nav items or be grouped under one item.
      // For now they are listed individually so the wiring is ready either way.
      { id: "california", label: "California overview" },
      { id: "central-valley", label: "Central Valley" },
      { id: "rivers", label: "Rivers" },
      { id: "distribution", label: "Water distribution" },
      { id: "calsim", label: "CalSim model" },
      { id: "coeqwal", label: "COEQWAL scenarios" },
      // Get Started panel sections
      // FLAG: these ids must match the `id` props added to PanelShell
      // (or its inner card Box) in each panel component. They do not exist
      // yet — add them as part of the PanelShell wiring task.
      { id: "welcome", label: "Welcome" },
      { id: "water-issues", label: "Water issues" },
      { id: "hydroclimate-futures", label: "Hydroclimate futures" },
      { id: "key-outcomes", label: "Key outcomes" },
      { id: "tier-animation", label: "Scenario tiers" },
      { id: "data-in-depth", label: "Data in depth" },
      { id: "interpreting-outcomes", label: "Interpreting outcomes" },
      { id: "choose-scenarios", label: "Choose your scenarios" },
      { id: "before-you-begin", label: "Before you begin" },
    ],
  },
  {
    // FLAG: update id to match the Water Issues route key
    id: "water-issues-section",
    label: "Water Issues",
    // No sub-sections yet — add when the Water Issues page has scrollable sections
    subSections: [],
  },
  {
    // FLAG: update id to match the Water Stories route key
    id: "water-stories-section",
    label: "Water Stories",
    // No sub-sections yet — add when the Water Stories page has scrollable sections
    subSections: [],
  },
]
 