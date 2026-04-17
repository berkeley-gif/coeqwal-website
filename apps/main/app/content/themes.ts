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
  /** Optional short description shown in an info tooltip next to the theme label */
  tooltip?: string
}

export const THEME_LABEL_CONFIG: Record<ScenarioTheme, ThemeLabelConfig> = {
  baseline: {
    label: "Baselines",
    tooltip:
      "Baselines represent current operations of the State Water Project and Central Valley Project. They serve as the reference point for comparing all other scenarios.",
  },
  ag_gw: { label: "Farms and groundwater" },
  eco: { label: "Rivers, salmon and the Delta ecosystem" },
  delta: { label: "The Delta as a living place" },
  cws: { label: "Community water systems" },
  unthemed: { label: "Other scenarios" },
}

// WATER_THEMES contains narrative content for thematic themes only.
// `baseline` and `unthemed` appear in ACTIVE_THEMES for scenario filtering
// but have no narrative panel, so they are intentionally excluded here.
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
    heroImage: "/images/themes/cws_hero_cred_dan_bacher.jpg",
    inquiry:
      "Can California's communities reliably access safe and affordable drinking water — in wet years, dry years, and a changing climate?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Millions of Californians depend on community water systems for daily life, for drinking, cooking, bathing, schools, hospitals, and local businesses. When these systems are stressed, the impacts are immediate and personal.",
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
              text: "Community water systems serve cities, towns, and rural communities across California. Some rely on surface water delivered through rivers and canals, while others depend heavily on groundwater wells, many use a combination of both.",
            },
            {
              type: "paragraph",
              text: "In wet years, water supplies are generally more stable. In dry years, shortages can emerge, especially when reservoir storage is low or groundwater levels decline. Smaller and rural systems are often more vulnerable because they have fewer backup options and limited financial resources.",
            },
            {
              type: "paragraph",
              text: "Water rights and operating rules also shape outcomes. Senior water rights holders may continue to receive deliveries even when supplies shrink, while lower-priority users may face larger reductions. This can create uneven impacts across communities.",
            },
            {
              type: "paragraph",
              text: "Climate change adds new uncertainty. Snowpack is declining, heat increases evaporation, and droughts may become longer and more severe. These shifts affect how much water is available and when. Understanding how reliable water supplies are under changing conditions helps communities anticipate risks, plan ahead, and ensure consistent access to water.",
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
              title: "Water sources & system diversity",
              paragraphs: [
                "Community water systems rely on different combinations of surface water and groundwater. These differences shape how systems experience risk. Surface water systems are sensitive to changes in reservoir storage and delivery conditions, while groundwater-dependent systems are influenced by aquifer levels, recharge rates, and pumping patterns.",
              ],
            },
            {
              title: "Storage, groundwater & drought response",
              paragraphs: [
                "Reservoir storage and groundwater act as buffers during dry periods. When surface water deliveries decline, systems may increase groundwater pumping or rely on stored supplies. However, groundwater responds slowly and if pumping exceeds recharge over time, water levels can drop, increasing costs and long-term risks.",
              ],
            },
            {
              title: "Water rights & distribution of impacts",
              paragraphs: [
                "Water deliveries are often determined by contracts and water rights, not just need. During shortages, senior rights holders are more likely to maintain deliveries, while lower-priority users may face greater reductions. This creates uneven impacts across regions and communities, with implications for fairness and equity.",
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
                "Community water systems depend on different water sources — risks are not the same everywhere.",
                "A shortage does not necessarily mean taps run dry. Systems can adapt by drawing on water storage, purchases, operational changes, or demand management.",
                "Reliability reflects patterns over time, not just single-year conditions.",
                "Multiple consecutive drought years tend to have greater impacts than a single dry year, as stresses on both surface water and groundwater systems accumulate over time.",
                "Water deliveries are shaped by contracts and water rights, not necessarily actual demand.",
                "Impacts are not evenly distributed across systems. Smaller and lower-priority systems often experience greater variability in water supply.",
                "Big-picture summaries show overall trends, but local differences remain important.",
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
                "Drinking water delivery reliability",
                "Reservoir storage patterns",
                "Groundwater availability and trends",
                "Regional differences across communities",
                "Performance during drought and extreme conditions",
              ],
            },
            {
              type: "paragraph",
              text: "Looking at these factors together helps show how communities experience water security under different conditions.",
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
              text: "**Trade-offs** – Water is limited. Protecting reservoir storage may improve long-term drought reliability but reduce short-term deliveries. Increasing deliveries in one region may reduce availability elsewhere. When supply declines, reductions are distributed across users, often unevenly.",
            },
            {
              type: "paragraph",
              text: "**Equity** – Water rights priorities and geographic differences shape who is affected most. Senior contractors often maintain deliveries, while lower-priority users may face larger reductions. Smaller or groundwater-dependent systems may experience different risks than large urban suppliers.",
            },
            {
              type: "paragraph",
              text: "**Resilience** – A resilient community water system can handle drought, heat, and variability without severe disruption. Resilience is influenced by many factors, which can include diversified supplies, stable groundwater levels, reservoir carryover storage, and flexible management strategies. Results reflect patterns over many years. They are not predictions of any single year, but tools to understand relative reliability and vulnerability under different conditions.",
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
              text: "Explore how water management choices affect community water reliability across regions, water sources, and climate conditions, and how these differences shape community outcomes.",
            },
          ],
        },
      },
    ],
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
              text: "Farms need reliable water to grow crops and stay economically viable. This water comes from two main sources, surface water from rivers and reservoirs and groundwater stored underground. These two sources are closely connected. When one becomes limited, the other is used more heavily. During droughts or periods of high demand, farmers often rely more on groundwater. If too much groundwater is pumped, it can become unsustainable, putting farms, drinking water supplies, and ecosystems at risk.",
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
                "Farms rely on both surface water and groundwater. When surface water is limited, groundwater often helps fill the gap, but when groundwater is restricted, surface supplies usually cannot increase, leading to shortages.",
                "Groundwater systems respond slowly. Conditions over multiple years (3–5 years) matter more than single wet or dry years.",
                "Results reflect long-term patterns across many years, rather than predictions for any one year, and highlight risks when dry conditions persist.",
                "Farmers can adapt by shifting crops, using stored water, or reducing acreage, but many of these decisions require long-term planning.",
                "Perennial crops (such as nuts and fruit trees) require continuous water and years of investment, making them difficult to adjust in response to short-term shortages.",
                "Impacts vary by region. The Sacramento Valley and San Joaquin Valley face different groundwater conditions and constraints, so system-wide averages can mask important local challenges.",
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
              text: "Rivers are essential sources of water, but they are more than channels that move water from mountains to farms and cities. They are also living systems supporting a great diversity of species. Salmon depend on cold water in rivers for spawning and rearing, and to migrate to and from the ocean. Wetlands, birds, other fish, and other wildlife depend on rivers too.",
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
              text: "California's rivers begin in the mountains and flow through valleys to the Delta and ocean. Along the way, they sustain ecosystems and provide water for farms and communities. River systems are deeply interconnected. Decisions about storage, environmental flows, and water deliveries create trade-offs, where changes in one part of the system can ripple elsewhere.",
            },
            {
              type: "paragraph",
              text: "Salmon are central to this story. They travel hundreds of miles between rivers and the ocean and are part of Tribal traditions, fishing economies, our food supply, and California's natural heritage. When salmon struggle, it signals stress in the broader river system.",
            },
            {
              type: "paragraph",
              text: "Over time, dams, reservoirs, diversions, and land use changes have reshaped rivers. Spring floods that once spread across floodplains are now captured or confined. These changes have improved water reliability for people, but reduced habitat, changed temperatures, and altered the timing of flows.",
            },
            {
              type: "paragraph",
              text: "Rivers respond not only to single events, but to stress over time. Sustained drought and repeated dry years can have compounding effects on ecosystems and water availability.",
            },
            {
              type: "paragraph",
              text: "Climate change adds new pressures. Snowpack is shrinking, snow melts earlier, and droughts and heat waves are intensifying. These changes affect how much cold water is available and when it moves through the system.",
            },
            {
              type: "paragraph",
              text: "Understanding rivers as living ecosystems, not just water delivery systems, is essential for future water management. A key idea explored here is that river flows can be managed to better resemble natural patterns while still delivering water to people.",
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
                "Wild rivers follow natural seasonal patterns. Winter and spring rains and snowmelt increase flows, sometimes spreading onto floodplains and creating habitat for fish and other species. In summer and fall, flows decrease and water temperatures rise. These seasonal rhythms support native ecosystems, including many salmon species, which evolved to depend on these changing conditions.",
              ],
            },
            {
              title: "Winter-run Chinook & cold-water refuges",
              paragraphs: [
                "Winter-run Chinook salmon are different. They spawn in summer, when rivers are warm, and evolved in cold, spring-fed habitats. Today, dams block access to these areas, and winter-run salmon depend on cold-water releases from reservoirs (like Shasta) to survive. If cold-water pools are depleted during hot months, their eggs may not survive, even if flow targets are met. This means both timing and temperature are critical for their survival.",
              ],
            },
            {
              title: "System connections & trade-offs",
              paragraphs: [
                "River systems are deeply interconnected. Limited water means that decisions about reservoir storage, environmental flows, and water deliveries create trade-offs across multiple outcomes. Efforts to create more natural flow patterns, such as seasonal pulse flows, can improve habitat but may reduce water available for other uses. Choices in one part of the system can create ripple effects elsewhere.",
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
                "Rivers are shaped not only by how much water flows, but by when it flows and water temperature. Timing and water temperature can be as important as quantity.",
                "Salmon depend on different conditions at different life stages, including cold water, sufficient flow, and connected habitat.",
                "Reservoirs improve water storage for people and farms, but they also alter natural flow patterns and temperatures.",
                "River ecosystems respond to droughts, floods, and sequences of extreme years. Short periods of stress can have lasting impacts.",
                "Improving flows alone does not fully restore ecosystems. Habitat conditions, landscape changes, and invasive species also play a role.",
                "This theme focuses on flows, so scenarios that perform poorly here may still achieve better outcomes when paired with habitat restoration or other management actions.",
                "For winter-run Chinook salmon, water temperature, especially cold water stored in reservoirs, can matter as much as flow volume.",
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
                "Winter-run Chinook salmon survival across life stages",
                "Outflows to the Bay-Delta estuary",
                "Water deliveries for communities and farms",
              ],
            },
            {
              type: "paragraph",
              text: "Looking at these factors together shows how river systems respond under different climate and water use conditions.",
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
              text: "**Trade-offs** – Water stored in reservoirs supports cities and farms, but can reduce natural winter and spring flows that benefit ecosystems. Releasing water to support salmon can limit storage needed later for temperature control or supply. For example, prioritizing cold-water storage in Shasta Reservoir can improve egg survival, but reduce flows for juvenile outmigration. Increasing flows can benefit juveniles, but deplete cold-water pools and increase egg mortality. Decisions about when and how much water to release shift outcomes across life stages, regions, and sectors.",
            },
            {
              type: "paragraph",
              text: "**Equity** – River conditions affect communities differently. Tribal nations, fishing communities, farmers, and downstream towns may experience changes in distinct ways. Salmon declines can impact cultural practices, subsistence, and local economies. Water rights and location also shape who experiences shortages or protections first. For example, decisions that benefit one salmon life stage may help some communities while increasing risks for others who depend on salmon at different times.",
            },
            {
              type: "paragraph",
              text: "**Resilience** – Resilience means rivers can withstand droughts, floods, and warming while maintaining ecosystem health. Protecting cold-water storage, maintaining habitat connectivity, and managing flows across seasons all support this. Because salmon depend on multiple life stages, actions that help one stage but harm another can still lead to decline. River systems respond to average conditions, extreme events, and cumulative stress over time.",
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
              text: "**Resilience** – Resilience means being able to handle stress and still function. For the Delta, this means handling droughts, floods, rising seas, heat, and changing water demand without losing ecosystem health, water reliability, or ways of life that depend on water. Flows, storage, temperature, salinity, and landscape shape all play a role. Understanding how they interact helps us think about what it takes to support the Delta over time, as both a working water system and a living estuary.",
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