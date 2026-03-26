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
  unthemed: { label: "Other scenarios" },
}

/** Active themes available for filtering */
export const ACTIVE_THEMES: ScenarioTheme[] = [
  "baseline",
  "ag_gw",
  "eco",
  "delta",
  "cws",
  "unthemed",
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
    heroImage: "/images/themes/farms-groundwater_hero.jpg",
    inquiry:
      "How can California continue to grow food and support farming communities, while protecting groundwater and sustaining the system for the future?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Farms depend on reliable water. But water comes from two main sources: rivers and reservoirs (surface water), and groundwater stored underground. These two systems are closely connected. When one is stressed, pressure shifts to the other.",
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
              text: "California grows a large share of the nation's fruits, nuts, and vegetables. Farming supports jobs, local economies, and food systems across the country. But agriculture is also one of the largest water users in the state.",
            },
            {
              type: "paragraph",
              text: "In wet years, farms receive more surface water deliveries from reservoirs and canals. In dry years, when surface supplies are reduced, farmers often pump more groundwater to make up the difference. Over time, heavy groundwater pumping can lower water tables, increase costs for farmers, and cause land subsidence. Some regions, especially in the San Joaquin Valley, have seen long-term groundwater declines.",
            },
            {
              type: "paragraph",
              text: "New groundwater laws, such as the Sustainable Groundwater Management Act (SGMA), require regions to bring groundwater use into balance over time. This may involve reducing pumping, shifting crops, or retiring land. At the same time, climate change is reducing snowpack and increasing drought intensity, making surface water supplies less reliable.",
            },
            {
              type: "paragraph",
              text: "Understanding how surface water deliveries, groundwater use, agricultural production, and climate stress interact is essential for planning a stable and sustainable food future.",
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
              title: "Surface water and groundwater as a connected system",
              paragraphs: [
                "Surface water and groundwater are part of a single, connected system. Reservoir storage determines how much water can be delivered through canals. When surface deliveries are reduced, farmers often rely more heavily on groundwater. Over time, this can lead to declining groundwater levels if pumping exceeds recharge.",
              ],
            },
            {
              title: "Groundwater sustainability and agricultural adaptation",
              paragraphs: [
                "Groundwater changes slowly over time. Long-term trends matter more than single years. As groundwater laws are implemented, some regions may need to reduce pumping. Farmers may respond by fallowing land, changing crops, improving efficiency, or shifting water sources. These changes can affect both production and local economies.",
              ],
            },
            {
              title: "System connections and trade-offs",
              paragraphs: [
                "Decisions about groundwater, land use, and surface water deliveries affect multiple parts of the system. Reducing groundwater pumping may improve long-term sustainability but can reduce agricultural production in the short term. Changes in one region may also shift pressures to other regions or water sources, creating complex system-wide responses.",
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
                "Farms rely on both surface water deliveries and groundwater pumping. When one source becomes less available, the other often compensates.",
                "Groundwater systems respond slowly. Long-term trends are more important than year-to-year changes.",
                "Changes in water availability do not always lead to immediate impacts. Farmers can adapt by shifting crops, using stored water, or reducing planted acreage.",
                "Results reflect long-term patterns across many years, not predictions for a single year.",
                "Different regions experience change differently. For example, the Sacramento Valley and San Joaquin Valley face different groundwater conditions and constraints.",
                "System-wide averages may appear stable, but important differences can exist across regions and communities.",
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
                "Agricultural production and revenue",
                "Groundwater pumping limits",
                "Changes in irrigated acreage",
                "Surface water deliveries to farms",
                "Reservoir storage patterns",
                "Long-term groundwater storage trends",
              ],
            },
            {
              type: "paragraph",
              text: "Some scenarios explore groundwater pumping restrictions in the San Joaquin Valley or across the Central Valley. Others explore land-use changes or combined strategies that include both groundwater limits and changes to surface water management. Looking at these strategies together helps reveal how farms respond under different policy, climate, and operational conditions.",
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
              text: "**Trade-offs** – Restricting groundwater pumping can improve groundwater storage over time but may reduce agricultural production in some regions. In some cases, limits in one area may shift pressure to other water sources or regions. Climate stress can intensify these trade-offs. Under warmer and drier conditions, surface water supplies decline, increasing reliance on groundwater just as it is being constrained.",
            },
            {
              type: "paragraph",
              text: "**Equity** – Impacts are not evenly distributed. Adverse effects are often concentrated in regions like the San Joaquin Valley, where groundwater declines have historically been more severe. Other regions, such as parts of the Sacramento Valley, may experience more stable conditions under certain scenarios. Water rights and infrastructure also influence who experiences shortages or reliability.",
            },
            {
              type: "paragraph",
              text: "**Resilience** – Resilience in this system means balancing short-term reliability with long-term sustainability. A system that relies heavily on groundwater during drought may maintain production in the short term but risk long-term depletion. A system that stabilizes groundwater but significantly reduces production may face economic challenges. Resilience depends on the ability to adapt to changing conditions while maintaining both agricultural viability and groundwater health.",
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
              text: "Explore how different water management choices affect agricultural production, groundwater storage, and water deliveries across regions and climate conditions.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "eco",
    label: "Rivers, salmon and\nthe Delta ecosystem",
    shortLabel: "Rivers, salmon and the Delta ecosystem",
    description:
      "Whether rivers, salmon, and the Delta estuary receive the flows they need to remain functional and resilient",
    heroImage: "/images/themes/salmon_hero.jpg",
    inquiry:
      "Can California's rivers support healthy salmon populations and functioning ecosystems, while also providing water for people and farms?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Rivers are essential sources of water, but they are more than channels that move water from mountains to farms and cities. They are living systems. Salmon depend on them to migrate, spawn, and survive. Wetlands, birds, and wildlife depend on them too.",
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
              text: "California's rivers begin in the mountains and flow through valleys before reaching the Delta and the ocean. Along the way, they sustain ecosystems and provide water for farms and communities. Salmon are an important part of this story. They travel hundreds of miles between rivers and the ocean. They are part of Tribal traditions, fishing economies, and California's natural heritage. When salmon struggle, it signals stress in the broader river system.",
            },
            {
              type: "paragraph",
              text: "Over time, dams, reservoirs, diversions, and land use changes have reshaped how rivers flow. Spring floods that once spread across floodplains are now captured in reservoirs. Water is stored for later use. Channels are straighter and more controlled. These changes have improved water reliability, but they have also reduced natural habitat, changed water temperatures, and altered the timing of flows.",
            },
            {
              type: "paragraph",
              text: "Climate change adds new pressures. The snowpack is shrinking. Snow melts earlier in the year. Droughts are becoming more intense. Heat waves raise river temperatures. These changes affect how much water is available and when it moves through the system. Understanding how rivers function as living ecosystems, not just water delivery systems, is essential for shaping future water management decisions.",
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
              title: "Seasonal flow & ecosystem rhythms",
              paragraphs: [
                "Rivers naturally follow seasonal patterns. In winter and spring, snow and rain increase flows. Rivers may spill onto floodplains, creating habitat and supporting young fish. In summer and fall, flows decrease and temperatures rise. These seasonal rhythms shape habitat conditions for salmon and other species.",
              ],
            },
            {
              title: "Water management & salmon survival",
              paragraphs: [
                "Water management decisions influence both flow and temperature. Reservoir releases determine how much water moves downstream and when. Storage decisions affect cold-water availability, which is critical for species like winter-run Chinook salmon. If cold-water pools in reservoirs are depleted during hot months, winter-run Chinook salmon eggs may not survive, even if flow targets are met. This means that both timing and temperature matter.",
              ],
            },
            {
              title: "System connections & trade-offs",
              paragraphs: [
                "River systems are deeply connected. Decisions about reservoir storage, environmental flow requirements, and water deliveries affect multiple outcomes. Efforts to create more natural flow patterns, such as seasonal pulse flows, can improve habitat but may reduce water available for other uses. Choices in one part of the system can create ripple effects elsewhere.",
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
                "Rivers are shaped not only by how much water flows, but by when it flows. Timing can be as important as quantity.",
                "Salmon depend on different conditions at different life stages, including cold water, sufficient flow, and connected habitat.",
                "Reservoirs improve water storage for people and farms, but they also alter natural flow patterns and temperatures.",
                "River ecosystems respond to droughts, floods, and sequences of extreme years. Short periods of stress can have lasting impacts.",
                "Improving flows alone does not fully restore ecosystems. Habitat conditions, landscape changes, and invasive species also play a role.",
                "For winter-run salmon, water temperature — especially cold water stored in reservoirs — can matter as much as flow volume.",
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
                "Seasonal flow patterns in rivers",
                "Storage in reservoirs",
                "Salmon survival across life stages",
                "Outflows to the Bay-Delta estuary",
                "Water deliveries for communities and farms",
              ],
            },
            {
              type: "paragraph",
              text: "Looking at these factors together helps show how river systems respond under different climate and water use conditions.",
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
              text: "**Trade-offs** – Water stored in reservoirs supports cities and farms, but holding water can reduce natural spring flows that benefit ecosystems. Releasing water to improve river conditions may reduce storage needed later for temperature control or supply reliability. Decisions about timing and volume of releases can shift outcomes across regions and sectors.",
            },
            {
              type: "paragraph",
              text: "**Equity** – River conditions affect communities differently. Tribal nations, fishing communities, farmers, and downstream towns may experience changes in distinct ways. Salmon declines can affect cultural traditions and local economies. Water rights and geographic location also shape who experiences shortages or protections first.",
            },
            {
              type: "paragraph",
              text: "**Resilience** – Resilience in rivers means being able to handle droughts, floods, and warming temperatures while maintaining ecosystem health. Protecting cold-water storage, maintaining habitat connectivity, and managing flows flexibly across seasons all influence how well river systems can adapt. Rivers respond not only to averages, but to stress over time.",
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
              text: "Explore how different water management choices shape seasonal river flows, water temperature, salmon survival, and habitat conditions across regions and climate futures.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "delta",
    label: "The Delta as\na living place",
    shortLabel: "The Delta as a living place",
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
    id: "governance",
    label: "Water operations\nand impacts",
    shortLabel: "Operations and impacts",
    description:
      "How water management decisions affect trade-offs, equity and resilience.",
    heroImage: "",
    inquiry: "",
    sections: [],
  },
]
