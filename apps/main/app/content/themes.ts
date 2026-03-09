/**
 * Theme display configuration
 *
 * Maps each ScenarioTheme to a human-readable label.
 * Keys align with WATER_THEMES ids in packages/data/src/coeqwal/themes.ts.
 */

import type { ScenarioTheme } from "./scenarios"

// =============================================================================
// Block types — content blocks for theme sections
// =============================================================================

export type ParagraphBlock = {
  type: "paragraph"
  text: string
}

export type ListBlock = {
  type: "list"
  items: string[]
}

export type ImageBlock = {
  type: "image"
  src: string
  alt: string
  caption?: string
}

export type ContentBlock = ParagraphBlock | ListBlock | ImageBlock

// =============================================================================
// Section types
// =============================================================================

export interface MixedSection {
  type: "mixed"
  blocks: ContentBlock[]
  /** Optional gap between blocks — defaults to theme spacing if omitted */
  gap?: string | number
}

export interface BoxItem {
  title: string
  paragraphs: string[]
}

export interface BoxSection {
  type: "boxes"
  items: BoxItem[]
}

export type SectionContent = MixedSection | BoxSection

// =============================================================================
// Theme section IDs (define the fixed structure of every theme page)
// =============================================================================

export const THEME_SECTION_IDS = [
  "intro",
  "why-this-matters",
  "what-this-theme-focuses-on",
  "what-to-keep-in-mind",
  "what-management-strategies-are-explored",
  "what-the-models-show",
  "how-to-explore-further",
] as const

export type ThemeSectionId = (typeof THEME_SECTION_IDS)[number]

// =============================================================================
// Theme type
// =============================================================================

export interface Theme {
  /** Stable identifier (e.g. "delta") */
  id: string
  /** Display label — may contain \n for line-breaks in circle layouts */
  label: string
  /** Short label for compact UI contexts (tabs, chips, dropdowns) */
  shortLabel: string
  /** One-sentence description of what this theme covers */
  description: string
  /** Hero image for the theme panel */
  heroImage: string
  /** Intro question that encapsulates the theme */
  inquiry: string
  /** Sections for the theme panel */
  sections: ThemeSection[]
}

export interface ThemeSection {
  id: ThemeSectionId
  content: SectionContent
}

// =============================================================================
// Theme display configuration
// =============================================================================

export interface ThemeLabelConfig {
  /** Human-readable label for display */
  label: string
}

export const THEME_LABEL_CONFIG: Record<ScenarioTheme, ThemeLabelConfig> = {
  baseline: { label: "Baseline" },
  ag_gw: { label: "Farms and groundwater" },
  eco: { label: "Rivers, salmon and the Delta ecosystem" },
  delta: { label: "The Delta as a living place" },
  cws: { label: "Community water systems" },
}

/** Active themes available for filtering */
export const ACTIVE_THEMES: ScenarioTheme[] = [
  "baseline",
  "ag_gw",
  "eco",
  "delta",
  "cws",
]

// =============================================================================
// WATER_THEMES — content for each theme page
// =============================================================================

export const WATER_THEMES: Theme[] = [
  {
    id: "cws",
    label: "Community\nwater systems",
    shortLabel: "Community water systems",
    description:
      "Whether people and communities can reliably access safe drinking water for daily life, health, and essential services",
    heroImage: "",
    inquiry: "",
    sections: [],
  },
  {
    id: "ag_gw",
    label: "Farms and\ngroundwater",
    shortLabel: "Farms and groundwater",
    description:
      "Whether agricultural water deliveries can sustain food protection, while preventing over-draft of groundwater basins",
    heroImage: "",
    inquiry: "",
    sections: [],
  },
  {
    id: "eco",
    label: "Rivers, salmon and\nthe Delta ecosystem",
    shortLabel: "Rivers, salmon and the Delta ecosystem",
    description:
      "Whether rivers, salmon, and the Delta estuary receive the flows they need to remain functional and resilient",
    heroImage: "",
    inquiry: "",
    sections: [],
  },
  {
    id: "delta",
    label: "The Delta as\na living place",
    shortLabel: "The Delta",
    description:
      "Whether the Delta is a place where communities, farms, and ecosystems coexist and thrive.",
    heroImage: "/images/themes/delta_hero.jpg",
    inquiry:
      "Can the Delta stay healthy for people, farms, fish, and wildlife – now and in the future?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Millions of Californians rely on water pumped from the Sacramento-San Joaquin Delta. At the same time, the Delta is a living place – home to communities, farms that grow food, and fish and birds that depend on healthy rivers and wetlands.",
            },
            {
              type: "image",
              src: "/images/themes/delta_salinity_overview_graph.png",
              alt: "Delta flow diagram",
              caption: "Rising tides and saline waters flowing into the Delta",
            },
          ],
        },
      },
      {
        id: "why-this-matters",
        content: {
          type: "mixed",
          gap: "40px",
          blocks: [
            {
              type: "paragraph",
              text: "The Sacramento–San Joaquin Delta sits at the heart of California's water system. It sends water to cities and farms across the state. It is also an ecosystem of wetlands, rivers, and important fish species. Families, farmers, fishing communities, and Tribal nations have deep ties to this landscape.",
            },
            {
              type: "paragraph",
              text: "Over time, dams, levees, reservoirs, and pumping plants have changed how water moves through the Delta. Controlled releases from dams maintain freshwater flows into the Delta throughout the year. Wetlands have been converted to farmland. Some islands have sunk below sea level. Invasive species have changed habitats. These physical changes affect the quality of water in the Delta and estuary.",
            },
            {
              type: "paragraph",
              text: "The Delta now faces new pressures. Droughts are lasting longer. Heat waves are more intense. Sea levels are rising, changing how freshwater from rivers mixes with saltwater from the Bay. These shifts increase stress on both ecosystems and water supplies.",
            },
            {
              type: "paragraph",
              text: "Understanding how the Delta functions – as both infrastructure and living ecosystem – helps inform decisions about its future.",
            },
          ],
        },
      },
      {
        id: "what-this-theme-focuses-on",
        content: {
          type: "boxes",
          items: [
            {
              title: "Seasonal flow & salinity patterns",
              paragraphs: [
                "The Delta changes with the seasons. In spring, snowmelt fills rivers with fresh water, pushing salt toward the Bay. In summer and fall, river flows decline, temperatures rise, and salt moves farther inland. Reservoir releases help manage salinity during dry months. Farms, wetlands, fish, and communities depend on these seasonal patterns, and on whether conditions remain within healthy ranges.",
              ],
            },
            {
              title: "Water management & ecosystem health",
              paragraphs: [
                "Water management decisions shape what happens inside the Delta. Freshwater flows influence salinity levels and where they occur. Pumping shifts how water moves through the system. Reservoir storage affects both supply and temperature. These forces interact to influence habitat conditions and ecosystem resilience.",
                "Salinity depends not only on how much water is present, but also on how water moves and mixes across levees, channels, and wetlands. Small changes in flow or pumping can shift ecological conditions in different parts of the Delta — sometimes improving habitat, sometimes increasing stress.",
              ],
            },
            {
              title: "System connections & ripple effects",
              paragraphs: [
                "The Delta is deeply connected to the rest of California's water system. Storage north and south of the Delta, export operations, farming demand, environmental requirements, and sea-level rise all interact. A change in one place can affect many others. Seeing the Delta as a living place means recognizing how water movement, landscape, communities, and ecosystem health are linked, as well as how management decisions influence long-term resilience.",
              ],
            },
          ],
        },
      },
      {
        id: "what-to-keep-in-mind",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "list",
              items: [
                "The Delta responds to seasons and extreme years, not just long-term averages. Short periods of stress can matter.",
                "Changing river flows alone does not automatically restore ecosystem health. Landscape conditions, habitat changes, levees, and invasive species – not directly evaluated by COEQWAL – also influence outcomes.",
                "Different regions experience impacts differently. A benefit in one area may create pressure in another.",
                "Some water standards must legally be met. Certain outcomes may appear stable even when other parts of the system change.",
                "Key outcomes (i.e. tier outcomes) provide a big-picture view, but local or seasonal variation can still be important.",
              ],
            },
          ],
        },
      },
      {
        id: "what-management-strategies-are-explored",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "This theme allows you to explore how different water management choices affect:",
            },
            {
              type: "list",
              items: [
                "Freshwater availability for in-Delta farms and communities",
                "Delta outflows that support estuary health",
                "Reservoir storage north and south of the Delta",
                "Water deliveries to farms and cities",
              ],
            },
            {
              type: "paragraph",
              text: "Looking at these factors together shows how the Delta responds under different conditions.",
            },
          ],
        },
      },
      {
        id: "what-the-models-show",
        content: {
          type: "mixed",
          gap: "40px",
          blocks: [
            {
              type: "paragraph",
              text: "**Trade-offs** – Water is limited. When we support one goal, it can affect another. Increasing flows to improve ecosystem conditions may change storage or deliveries. Protecting storage may influence how much water moves downstream. Managing pumping can shift salinity patterns. The Delta makes these trade-offs visible. Understanding them helps people see the real choices involved.",
            },
            {
              type: "paragraph",
              text: "**Equity** – Not everyone is affected in the same way. Where you live, what water rights you hold, how close you are to rising saltwater, and how sensitive ecosystems are can shape how impacts are felt. Exploring multiple outcomes together helps show where benefits are stronger and where pressures may be greater. This supports more informed and fair conversations about the future.",
            },
            {
              type: "paragraph",
              text: "**Resilience** – Resilience means being able to handle stress and still function. For the Delta, this means handling droughts, floods, rising seas, heat, and changing water demand without losing ecosystem health,water reliability, or ways of life that depend on water. Flows, storage, temperature, salinity, and landscape shape all play a role. Understanding how they interact helps us think about what it takes to support the Delta over time, as both a working water system and a living estuary.",
            },
          ],
        },
      },
      {
        id: "how-to-explore-further",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Explore how water management choices influence salinity, reservoir storage, estuary health, and water deliveries – and how these changes affect communities and ecosystems across California.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "climate",
    label: "Drought, climate risk,\nand resilience",
    shortLabel: "Climate resilience",
    description:
      "How the water system performs under increasing climate variability, drought risk, and extreme conditions.",
    heroImage: "",
    inquiry: "",
    sections: [],
  },
  {
    id: "governance",
    label: "Operations\nand impacts",
    shortLabel: "Operations & impacts",
    description:
      "How evidence, trade-offs, and equity considerations inform water-management decisions.",
    heroImage: "",
    inquiry: "",
    sections: [],
  },
]
