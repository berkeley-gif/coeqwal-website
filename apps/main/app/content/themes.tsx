/**
 * Theme display configuration
 *
 * Maps each ScenarioTheme to a human-readable label.
 * Keys align with WATER_THEMES ids in packages/data/src/coeqwal/themes.ts.
 */

import type { ScenarioTheme } from "./scenarios"
import type { ReactNode } from "react"
import { Typography } from "@repo/ui/mui"
import { WATER_THEME_REGISTRY } from "@repo/ui/themes/theme"
import { InlineNavLink } from "../components/InlineNavLink"
import { GlossaryTermLink } from "../features/glossary/GlossaryTermLink"

// Looks up a theme's canonical display name from the shared registry in
// @repo/ui (the actual source of truth — packages/ui can't import from
// apps/main, so the name lives there and this file derives from it,
// rather than the other way around).
function registryLabel(id: string): string {
  return WATER_THEME_REGISTRY.find((t) => t.id === id)?.shortLabel ?? id
}

// =============================================================================
// Block types: content blocks for theme sections
// =============================================================================

export type ParagraphBlock = {
  type: "paragraph"
  /** Plain string gets **bold** markdown parsing. Pass JSX (e.g. with
   * InlineNavLink or GlossaryTermLink) when the paragraph needs a link. */
  text: ReactNode
}

export type ListBlock = {
  type: "list"
  items: ReactNode[]
}

export type ImageBlock = {
  type: "image"
  src: string
  alt: string
  /** Text shown above the image, in its own box — the "top slot" for
   * figures where the doc places some of the box's text before the
   * graphic rather than all of it after. Rare; most figures only use
   * `caption`. */
  captionBefore?: ReactNode
  /** Bold heading shown above the caption — a Figure Box's title line */
  title?: ReactNode
  /** Text shown below the image ("bottom slot"). Plain string gets
   * \n-separated paragraph breaks. Pass JSX when one of the caption's
   * paragraphs needs a link. */
  caption?: ReactNode
}

export type ContentBlock = ParagraphBlock | ListBlock | ImageBlock

// =============================================================================
// Section types
// =============================================================================

export interface MixedSection {
  type: "mixed"
  blocks: ContentBlock[]
  /** Optional gap between blocks. Defaults to theme spacing if omitted */
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
  /** Display label, may contain \n for line-breaks in circle layouts */
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
    label: registryLabel("baseline"),
    tooltip:
      "Baselines represent current operations of the State Water Project and Central Valley Project. They serve as the reference point for comparing all other scenarios.",
  },
  ag_gw: { label: registryLabel("ag_gw") },
  eco: { label: registryLabel("eco") },
  delta: { label: registryLabel("delta") },
  cws: { label: registryLabel("cws") },
  unthemed: { label: "Other scenarios" },
}

// WATER_THEMES contains narrative content for thematic themes only.
// `baseline` and `unthemed` appear in ACTIVE_THEMES for scenario filtering
// but have no narrative panel, so they are intentionally excluded here.
export const ACTIVE_THEMES: ScenarioTheme[] = [
  "baseline",
  "ag_gw",
  "eco",
  "cws",
  "delta",
  "unthemed",
]

// =============================================================================
// WATER_THEMES: content for each theme page
// =============================================================================

export const WATER_THEMES: Theme[] = [
  {
    id: "baseline",
    label: "Understanding Today's\nWater System",
    shortLabel: registryLabel("baseline"),
    description:
      "Whether California's current water management — the Central Valley Project and State Water Project — performs reliably for communities, agriculture, and the environment, now and under future climate conditions",
    heroImage: "/images/themes/baseline_hero_cred_ken_james.jpg",
    inquiry:
      "How do California's major water projects in the Central Valley perform under current and future climate conditions?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: (<>This water issue provides a foundation for understanding the strengths, vulnerabilities, trade-offs, and inequities in California's current water system, with a focus on the <GlossaryTermLink>Central Valley Project</GlossaryTermLink> and State Water Project, and how those conditions may change under future climates. It also examines different representations of current operations used by state and federal agencies in their models, and how those differences can influence our understanding of impacts on communities, agriculture, and the environment.</>),
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
              text: (<>California's <GlossaryTermLink>Central Valley</GlossaryTermLink> water system reflects more than a century of investments in reservoirs, canals, levees, groundwater development, environmental regulations, water rights, contracts, and operating agreements. Together, this infrastructure and these management decisions shape how water is stored, moved, allocated, and managed across the state.</>),
            },
            {
              type: "paragraph",
              text: "The current system supports millions of Californians, one of the world's most productive agricultural economies, and diverse freshwater and estuarine ecosystems. At the same time, it faces ongoing challenges, including drought, groundwater depletion, ecosystem declines, water quality concerns, and unequal impacts across communities and regions.",
            },
            {
              type: "paragraph",
              text: "Future climate conditions add another layer of uncertainty. While water managers can influence how water is managed, they cannot control future precipitation, temperature, snowpack, or drought frequency. Understanding how today's system performs under both historical and future hydroclimates can reveal which parts of the system are relatively resilient, where vulnerabilities already exist, and where adaptation may be needed.",
            },
            {
              type: "image",
              src: "/images/themes/baseline-fig-01.svg",
              alt: "California's interconnected water system",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    California&apos;s interconnected water system
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    California&apos;s major water projects connect reservoirs,
                    rivers, groundwater basins, and the Delta to an extensive
                    network of water users. Decisions about how water is stored
                    and moved through this system affects communities,
                    agriculture, and the environment. The map highlights key
                    parts of the system represented in COEQWAL, including major
                    reservoirs and rivers, groundwater aquifers, the Delta,
                    water deliveries and exports, and ecological conditions.
                  </Typography>
                </>
              ),
            },
          ],
        },
      },
      {
        id: "what-this-theme-focuses-on",
        content: {
          type: "mixed",
          gap: "40px",
          blocks: [
            {
              type: "paragraph",
              text: "**A reference point for comparison** – The representation of current operations provides a common reference point for comparison. Comparing alternative water management strategies to current operations reveals management-driven changes, while comparing the same operations across hydroclimates reveals climate-driven changes. Together, these comparisons help distinguish the effects of management decisions, climate change, and their interactions.",
            },
            {
              type: "paragraph",
              text: (<><strong>Alternative representations of current operations</strong> – Policies governing Central Valley water management are continually evolving, making the precise definition of "current operations" challenging. State and federal agencies may represent current operations differently based on the regulations, land-use conditions, operational assumptions, and other information incorporated into their models. Comparing these representations helps reveal how those choices influence modeled system performance.</>),
            },
            {
              type: "paragraph",
              text: "**Historical and future hydroclimates** – Climate change will affect how much water is available, when it is available, and water needs across the system. Comparing performance under historical and plausible future hydroclimates helps reveal how climate change may stress different parts of the water system.",
            },
            {
              type: "image",
              src: "/images/themes/baseline-fig-02.svg",
              alt: "Operations of the Central Valley Project and State Water Project",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Operations of the Central Valley Project and State Water
                    Project
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The CalSim3 water systems model used in COEQWAL focuses on
                    operations of the Central Valley Project and State Water
                    Project. While other features of California&apos;s
                    integrated water system are represented, most of the
                    information shared on the COEQWAL platform focuses on water
                    supplied to the San Francisco Bay-Delta watershed
                    (Contributing Watershed Area), water distributed to users
                    within the Sacramento and San Joaquin Valley (Central Valley
                    Model Area), and water exported to water users in the Tulare
                    Basin, Southern California, and coast.
                  </Typography>
                </>
              ),
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
                "Current operations provide a representation of today's water management system. They are not a neutral starting point, but reflect decades of infrastructure investments, policies, regulations, water rights, contracts, and negotiated trade-offs.",
                ( <><GlossaryTermLink>COEQWAL</GlossaryTermLink> uses <GlossaryTermLink>CalSim3</GlossaryTermLink>, the water <GlossaryTermLink>allocation</GlossaryTermLink> model used by state and federal agencies to plan and manage the Central Valley Project and State Water Project. Using the same model makes this decision-making space more accessible to a broader range of people and perspectives.</>),
                ( <>Models are a simplification of reality. The CalSim3 water allocation model used by COEQWAL focuses on operations of the Central Valley Project and State Water Project. Some aspects of California's water management system fall outside its scope or are represented in simplified ways.</>),
                'There is no single model representation of "current operations". State and federal agencies use different assumptions about land use, system operations, regulations, and other conditions, and these representations change as policies and operations evolve.',
                "Differences between hydroclimates under the same management strategy help reveal climate-driven changes, while differences between management strategies under the same hydroclimate help reveal management-driven changes.",
                "Current operations already contain benefits, trade-offs, and inequities. Comparing other scenarios to current operations therefore shows how management changes redistribute benefits relative to current conditions, not to a neutral starting point.",
                "Future hydroclimates are not predictions. They represent plausible alternative futures that help test how the system responds to different climate conditions. Results describe patterns across many modeled years rather than predicting conditions in any single year.",
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
              text: (
                <>
                  This water issue compares alternative representations of current operations and provides a foundation for understanding the broader range of management strategies explored by COEQWAL. The scenarios vary assumptions about operating rules, agricultural land use, and Temporary Urgency Change Petitions (TUCPs), which can temporarily modify certain water-right requirements during drought or other urgent conditions.
                </>
              ),
            },
            {
              type: "paragraph",
              text: "This water issue specifically compares the following representations of current operations:",
            },
            {
              type: "list",
              items: [
                (<>Current operations, with <GlossaryTermLink term="California Department of Water Resources (DWR)">DWR</GlossaryTermLink> (2023) operating rules, recent (2020) land use, and allowing for TUCP actions"</>),
                (<>Current operations with historical agricultural land use, with DWR (2023) operating rules, historical (2004-2013) land use, and allowing for TUCP actions</>),
                (<>Current operations without TUCPs, with DWR (2023) operating rules and recent (2020) land use, but without TUCP actions</>),
                "Current USBR operations, with U.S. Bureau of Reclamation (2024) operating rules, recent (2020) land use, and TUCPs",
                "Current USBR operations without TUCPs, with U.S. Bureau of Reclamation (2024) operating rules and recent (2020) land use, but without TUCPs",
              ],
            },
            {
              type: "paragraph",
              text: (
                <>
                  For more information about each of these, and other,
                  scenarios, visit{" "}
                  <InlineNavLink to="/data">
                    Data and Documentation
                  </InlineNavLink>
                  .
                </>
              ),
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
              text: (
                <>
                  In the{" "}
                  <InlineNavLink to="explore">Explore Tool</InlineNavLink>,
                  different representations of current operations are grouped as
                  &ldquo;baseline&rdquo; scenarios because they provide
                  reference points for comparing alternative management
                  strategies. The Explore Tool allows you to examine how
                  outcomes differ across the baseline scenarios and under
                  different hydroclimate conditions. There are complementary
                  ways to visualize tradeoffs, equity, and resilience of water
                  management strategies. The examples below illustrate results
                  from select scenarios for this water issue.
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/baseline-fig-03.svg",
              alt: "Trade-offs radar chart",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Trade-offs
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How do different management strategies affect overall system
                    performance across multiple outcomes?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The radar chart in the Explore Tool summarizes performance
                    across nine key outcomes, revealing broad system-level
                    trade-offs within and between scenarios. The chart displays
                    average performance across all locations of interest for
                    each outcome. This example compares Current operations with
                    Current operations with historical land use and Current
                    operations without TUCPs under the historical hydroclimate.
                    Outcomes are categorized into different performance classes:
                    optimal, acceptable, at-risk, and critical. See{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information on how these categories are defined.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The radar plot highlights existing trade-offs among
                    competing water uses and objectives under current
                    operations. Community surface water deliveries are in
                    optimal conditions, on average, while agricultural revenues,
                    reservoir storage, groundwater storage, and freshwater for
                    Delta exports and in-delta uses are, on average, in
                    acceptable conditions. Environmental flows, Delta estuary
                    ecology, and winter-run salmon generally are considered
                    at-risk or in critical condition under the baseline
                    scenarios.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The radar plot also indicates that representing current
                    operations with historical land use produces similar
                    outcomes to those with more recent land use for most
                    outcomes, but agricultural revenues decline from acceptable
                    to at-risk conditions, on average. This likely reflects the
                    larger footprint of higher-value perennial crops under more
                    recent conditions. There are also slight improvements in
                    groundwater storage in the scenario with historical land
                    use, suggesting that current agricultural water demands rely
                    more on groundwater than they did historically. The radar
                    plot shows that TUCPs have limited effects on overall system
                    performance, but relative to the scenario without TUCPs, the
                    Current operations scenario (with TUCPs) has slightly worse
                    average conditions for In-Delta uses and slightly improved
                    reservoir storage conditions.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Overall, the radar chart shows that the broad pattern of
                    system performance is relatively consistent across these
                    representations of current operations, but some outcomes are
                    sensitive to differences in land-use assumptions and
                    operating rules. The system-wide averages do not show how
                    these conditions are distributed among individual locations,
                    which is explored in the Distribution view below.
                  </Typography>
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/baseline-fig-04.svg",
              alt: "Equity distribution view map",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Equity
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Where do benefits and impacts occur, and who is most
                    affected?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    System-wide averages can hide important differences in
                    current conditions across individual locations. Water
                    availability, infrastructure, water rights, access to
                    different water sources, and other characteristics vary
                    considerably across California, meaning that the outcomes
                    produced by current water management can differ
                    substantially from place to place.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Distribution view in the Explore Tool shows results for
                    individual locations of interest. The figure below shows
                    outcomes for Current operations under the historical
                    hydroclimate, while the map highlights community surface
                    water delivery locations in particular. The markers
                    represent locations of interest, and the colors represent
                    optimal (green), acceptable (blue), at-risk (orange), or
                    critical (red) outcomes.
                  </Typography>
                </>
              ),
              caption:
                "The Distribution view shows considerable variation among community surface water delivery locations and agricultural districts. Many locations experience optimal or acceptable conditions, while others fall into at-risk or critical conditions. Poor community surface water delivery outcomes are not concentrated in a single region, showing that vulnerabilities under current operations occur in different parts of the state. It is also important to keep in mind that the community surface water outcome only evaluates the reliability of water delivered from the state's major water projects and does not consider the contribution of other water sources to the water supplies of community water systems.\nOverall, the Distribution view reveals patterns hidden by system-wide averages and helps identify where vulnerabilities already exist under current operations and how unevenly those conditions are distributed.",
            },
            {
              type: "image",
              src: "/images/themes/baseline-fig-05.svg",
              alt: "Resilience heatmap across hydroclimate scenarios",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Resilience
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How consistently do management strategies perform under
                    different climate futures?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Climate change is expected to place increasing stress on
                    California&apos;s water system. A management strategy that
                    performs well today may respond differently as droughts
                    become more frequent, temperatures rise, and water
                    availability changes. The Resilience heatmap in the Explore
                    Tool examines how management strategies perform across a
                    range of plausible hydroclimates, representing increasing
                    levels of stress to the water system. See{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information about hydroclimates.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Resilience heatmap summarizes performance across all
                    nine outcomes under Historical conditions and under
                    Moderate, Moderate-High, High and Extreme climate stress for
                    Current Operations. Outcomes are categorized as optimal
                    (green, 1.00 - 1.99), acceptable (blue, 2.00 - 2.99),
                    at-risk (orange, 3.00 - 3.99), or critical (red, 4.00 -
                    4.99), with higher numerical values indicating worse
                    performance.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The results show that climate stress affects different parts
                    of the water system in different ways. Community surface
                    water deliveries, agricultural revenues, and reservoir
                    storage remain in optimal or acceptable conditions across
                    most hydroclimates, although performance generally declines
                    under the more stressful futures. Other outcomes are more
                    sensitive to climate stress. Freshwater available for Delta
                    exports and in-Delta uses deteriorates steadily as climate
                    stress increases, reaching &ldquo;Critical&rdquo; conditions
                    under Extreme stress. Environmental flows, Delta estuary
                    ecology, and winter run salmon remain at risk or fall to
                    critical conditions with greater climate stress.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Overall, the Resilience heatmap shows that some parts of
                    today&apos;s water system remain relatively robust to
                    climate stress across the hydroclimates examined, while
                    others are already vulnerable under historical conditions or
                    become increasingly vulnerable as climate conditions change.
                    These patterns help identify where current operations may be
                    less able to accommodate future climate stress and where
                    adaptation may be needed.
                  </Typography>
                </>
              ),
            },
          ],
        },
      },
    ],
  },
  {
    id: "cws",
    label: "Securing Community\nWater Supplies",
    shortLabel: registryLabel("cws"),
    description:
      "Whether California's community water systems can reliably deliver safe drinking water to the people who depend on them, in wet years, dry years, and a changing climate",
    heroImage: "/images/themes/cws_hero_cred_dan_bacher.jpg",
    inquiry:
      "How can we ensure reliable drinking water access for Californians in wet years, dry years, and a changing climate?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Almost 38 million Californians, 97% of the state's population, depend on community water systems to provide water for drinking, cooking, bathing, schools, hospitals, and local businesses. When these systems are stressed, the impacts are immediate and personal.",
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
              text: "Community water systems serve cities, towns, and rural communities across California. Some rely on surface water delivered through rivers and canals, while others depend on groundwater wells. Many use a combination of both.",
            },
            {
              type: "image",
              src: "/images/themes/cws-fig-01.svg",
              alt: "Different water sources shape community resilience",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Different water sources shape community resilience
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Some communities rely primarily on surface water delivered
                    through rivers, reservoirs, pipes, and canals, while others
                    draw from both surface water and groundwater wells. Access
                    to multiple water sources can provide greater flexibility
                    when one source becomes less available, while reliance on a
                    single source can leave communities more vulnerable to
                    drought, infrastructure disruptions, and other changes in
                    water supply.
                  </Typography>
                </>
              ),
            },
            {
              type: "paragraph",
              text: "In wet years, water supplies are generally more abundant. In dry years, shortages can emerge, especially when reservoir storage is low or groundwater levels decline. Smaller and rural systems are often more vulnerable because they have limited financial resources and infrastructure to access alternative water sources.",
            },
            {
              type: "paragraph",
              text: (<>Surface water <GlossaryTermLink>deliveries</GlossaryTermLink> are shaped by a complex combination of water rights, contracts, operating rules, infrastructure, and water availability. These arrangements affect how shortages are distributed, meaning that some community water systems may experience larger reductions in project deliveries than others.</>),
            },
            {
              type: "paragraph",
              text: "Climate change adds new uncertainty. Snowpack is declining, higher temperatures increase evaporation, and droughts may become longer and more severe. These shifts affect how much water is available. Understanding how reliable different water supplies are under changing conditions helps communities anticipate risks, plan ahead, and ensure consistent access to water.",
            },
          ],
        },
      },
      {
        id: "what-this-theme-focuses-on",
        content: {
          type: "mixed",
          gap: "40px",
          blocks: [
            {
              type: "image",
              src: "/images/themes/cws-fig-02.svg",
              alt: "Surface water deliveries from large water projects to communities",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Surface water deliveries from large water projects to
                    communities
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Community water systems rely on surface water, groundwater,
                    or a combination of sources to meet their needs. This water
                    issue focuses on surface water delivered from
                    California&apos;s major water projects to major metropolitan
                    areas around the Bay Area, Sacramento, and Los Angeles, as
                    well as smaller communities throughout the Central Valley
                    and Southern California. These deliveries represent only a
                    subset of California&apos;s community water systems and
                    drinking water supplies.
                  </Typography>
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/cws-fig-03.svg",
              alt: "Community drinking water deliveries as represented in CalSim3",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Community drinking water deliveries as represented in
                    CalSim3
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The CalSim3 water systems model that is used in COEQWAL
                    simulates surface water deliveries from the major water
                    projects to community water systems at 74 locations of
                    interest throughout California, shown on the map below.
                  </Typography>
                </>
              ),
            },
            {
              type: "paragraph",
              text: (<><strong>Assessing delivery reliability and the distribution of impacts</strong> – Surface water deliveries are not determined by community need alone. Water rights, contracts, operating rules, infrastructure, and patterns of water availability all influence how project water is distributed and how reductions in deliveries are experienced across communities.</>),
            },
            {
              type: "paragraph",
              text: (<>To evaluate these deliveries in the context of community needs, <GlossaryTermLink>COEQWAL</GlossaryTermLink> compares modeled surface water <GlossaryTermLink>deliveries</GlossaryTermLink> with recent potable (drinking water) demands. This provides a measure of how reliably the modeled project supplies can contribute to meeting community water needs under different management and climate conditions.</>),
            },
            {
              type: "paragraph",
              text: (<>This analysis also shows how reliability varies among locations, revealing which community water systems consistently receive reliable project deliveries and which remain more vulnerable.</>),
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
                (<>Community water systems may rely on surface water, groundwater, stored water, or combinations of different sources. Access to these alternative sources varies considerably among systems. COEQWAL evaluates surface water deliveries from major water projects to select community water systems, not each community's complete water supply portfolio.</>),
                "Community surface water deliveries are evaluated relative to recent potable water demands, provided by the State Water Resources Control Board's Division of Drinking Water. Project deliveries are influenced by water availability, contracts, water rights, infrastructure, and operating rules and may not fully meet these demands.",
                "When modeled project deliveries fall below demand, this does not necessarily mean that a community experiences a drinking water shortage. Systems with access to groundwater, local surface water, or other alternatives may be better able to respond to reduced project deliveries than systems with fewer options.",
                "Community water systems respond to both the severity and frequency of shortages. Water system stress can result from a significant delivery shortfall in a single year or repeated shortfalls over multiple years.",
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
              text: "This water issue explores two scenarios that prioritize surface water deliveries for community use:",
            },
            {
              type: "list",
              items: [
                "Prioritizing human health water deliveries to community water systems",
                "Prioritizing full demands of community water systems",
              ],
            },
            {
              type: "paragraph",
              text: "Together, these scenarios examine how different levels of priority for community water deliveries affect the broader water system, including agricultural water supplies, reservoir storage, environmental flows, and other outcomes.",
            },
            {
              type: "paragraph",
              text: (
                <>
                  For more information about each of these scenarios, visit{" "}
                  <InlineNavLink to="/data">
                    Data and Documentation
                  </InlineNavLink>
                  .
                </>
              ),
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
              text: (
                <>
                  The <InlineNavLink to="explore">Explore Tool</InlineNavLink>{" "}
                  allows you to explore how scenario outcomes compare under
                  alternative management strategies and climate conditions.
                  There are complementary ways to visualize tradeoffs, equity,
                  and resilience of water management strategies. The examples
                  below illustrate results from select scenarios for this water
                  issue.
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/cws-fig-04.svg",
              alt: "Trade-offs radar chart",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Trade-offs
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How do different management strategies affect overall system
                    performance across multiple outcomes?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The radar chart in the{" "}
                    <InlineNavLink to="explore">Explore Tool</InlineNavLink>{" "}
                    summarizes performance across nine key outcomes, revealing
                    broad system-level trade-offs within and between scenarios.
                    The chart displays the average performance across all
                    locations of interest for each scenario, providing a
                    system-wide view of how these management strategies
                    influence multiple outcomes simultaneously. The chart view
                    below specifically compares Current operations (black),
                    Prioritizing human health delivery levels to community water
                    systems (blue), and Prioritizing full demands of community
                    water systems (red) under the historical hydroclimate.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The points show the average condition across all locations
                    of interest for each outcome, classified into four outcome
                    levels: optimal, acceptable, at-risk, and critical. See{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information on how these categories are defined.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The results show that community surface water deliveries
                    perform well on average under Current Operations and improve
                    further under both scenarios that prioritize community water
                    needs. The results also reveal that these improvements in
                    community surface water outcomes are not associated with
                    notable impacts to other parts of the system. The
                    performance of winter-run salmon does decline in the
                    scenario that prioritizes human health delivery levels,
                    suggesting that additional community water deliveries limit
                    water needed by this salmon population. However, the average
                    values for all other outcomes are similar between the
                    baseline and the two scenarios that prioritize water
                    deliveries to community water systems.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The radar chart shows system-wide performance of outcomes,
                    while the Distribution view reveals the specific locations
                    where benefits or impacts occur.
                  </Typography>
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/cws-fig-05.svg",
              alt: "Distribution view map of community water delivery outcomes",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Equity
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Where do benefits and impacts occur, and who is most
                    affected?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    System-wide averages can hide important differences in
                    scenario impacts. Water availability and access can vary
                    substantially between regions and served systems, meaning
                    that the same management strategy can produce different
                    outcomes in different places.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Distribution view in the Explore Tool shows results for
                    individual locations of interest. This figure displays
                    outcomes for community surface water deliveries for
                    Prioritizing human health delivery levels to community water
                    systems, relative to Current operations. Arrows indicate the
                    direction of change relative to current operations, and
                    color represents optimal (green), acceptable (blue), at-risk
                    (orange), or critical (red) outcomes for the scenario.
                    Circles represent locations that did not change condition
                    relative to current operations.
                  </Typography>
                </>
              ),
              caption:
                'The results show that surface water deliveries to most locations of interest are "Optimal" or "Acceptable" under the human health priority scenario, and deliveries improve for many systems. However, seven locations remain "At-risk" or "Critical" and do not improve relative to Current operations. This shows that prioritizing community water deliveries across the system does not benefit every community equally or eliminate existing vulnerabilities.\nBecause communities differ in their access to groundwater, local storage, alternative supplies, financial resources, and other sources of resilience, similar surface water delivery outcomes may have different implications in different places. Overall, the Distribution view reveals patterns hidden by the system-wide averages and helps identify which locations benefit from changes in management and which remain vulnerable.',
            },
            {
              type: "image",
              src: "/images/themes/cws-fig-06.svg",
              alt: "Resilience heatmap across hydroclimate scenarios",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Resilience
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How consistently do management strategies perform under
                    different climate futures?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Climate change is expected to place increasing stress on
                    California&apos;s water system. A management strategy that
                    performs well today may respond differently as droughts
                    become more frequent, temperatures rise, and water
                    availability changes. The Resilience heatmap in the{" "}
                    <InlineNavLink to="explore">Explore Tool</InlineNavLink>{" "}
                    examines how management strategies perform across a range of
                    plausible hydroclimates, representing increasing levels of
                    stress to the water system. Visit{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information about hydroclimates.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    This Resilience heatmap summarizes community surface water
                    deliveries under the historical hydroclimate and future
                    hydroclimates representing Moderate, Moderate-High, High and
                    Extreme levels of climate stress for Current Operations and
                    Prioritizing human health delivery levels to community water
                    systems. Outcomes are categorized as optimal (1.00 - 1.99),
                    acceptable (2.00 - 2.99), at-risk (3.00 - 3.99), or critical
                    (4.00 - 4.99), with higher numerical values indicating worse
                    performance.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Community surface water deliveries decline as climate stress
                    increases under both management strategies. Under Current
                    operations, average performance remains
                    &ldquo;Optimal&rdquo; from the historical through
                    Moderate-High hydroclimates, before declining to
                    &ldquo;Acceptable&rdquo; under High and Extreme climate
                    stress. Prioritizing human health delivery levels improves
                    average community surface water delivery performance under
                    every hydroclimate examined. However, performance still
                    declines as climate stress increases, shifting from
                    &ldquo;Optimal&rdquo; through Moderate-High stress to
                    &ldquo;Acceptable&rdquo; under High and Extreme stress.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    These results suggest that prioritizing essential community
                    water needs improves the resilience of modeled surface water
                    deliveries across a range of climate futures, but cannot
                    fully offset the effects of increasingly severe water
                    scarcity.
                  </Typography>
                </>
              ),
            },
          ],
        },
      },
    ],
  },
  {
    id: "ag_gw",
    label: "Sustaining Farms\nand Groundwater",
    shortLabel: registryLabel("ag_gw"),
    description:
      "Whether California's agricultural water use can be sustained without depleting the groundwater that farms, communities, and ecosystems depend on",
    heroImage: "/images/themes/farms-groundwater_hero.jpg",
    inquiry:
      "How can California continue to grow food and support farming communities, while protecting groundwater for the future?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Farms need water to grow crops and stay economically viable. Agricultural water comes primarily from surface water diverted from rivers and reservoirs, and from groundwater pumped from aquifers. These sources are closely connected. When surface water becomes limited, farmers often rely more heavily on groundwater, particularly during droughts or periods of high demand. Water from rivers and irrigation can percolate through the soil and help recharge aquifers. But if groundwater pumping exceeds recharge over time, groundwater overdraft occurs, putting farms, drinking water supplies, and ecosystems at risk.",
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
              text: "California grows a large share of the nation's fruits, nuts, and vegetables. Farming supports jobs, local economies, and food systems across the country. But agriculture is also the largest water user in the state.",
            },
            {
              type: "paragraph",
              text: "Over time, heavy groundwater pumping can lower groundwater tables. When pumping persistently exceeds recharge, groundwater overdraft can cause wells to go dry, increase pumping costs, contribute to land subsidence, and reduce groundwater contributions to rivers and freshwater ecosystems. These problems have been particularly acute in parts of the San Joaquin Valley. At the same time, climate change is reducing snowpack and increasing drought intensity, which makes surface water supplies less reliable. These changes make the long-term sustainability of groundwater increasingly important.",
            },
            {
              type: "paragraph",
              text: (<>California's Sustainable Groundwater Management Act (SGMA) requires groundwater basins to achieve long-term balance between pumping and recharge. Meeting SGMA requirements may involve reducing pumping alongside other changes in agricultural water and land management. Understanding how surface water <GlossaryTermLink>deliveries</GlossaryTermLink>, groundwater use, and agricultural production change as groundwater restrictions are put in place is essential for planning for a sustainable agricultural future.</>),
            },
            {
              type: "image",
              src: "/images/themes/ag_gw-fig-01.svg",
              alt: "Relationships between agricultural water use, groundwater levels, agricultural revenues, and groundwater-dependent ecosystems over time",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Relationships between agricultural water use, groundwater
                    levels, and agricultural revenues, and groundwater-dependent
                    ecosystems over time under two hypothetical scenarios
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    When no restrictions on groundwater pumping are imposed
                    (Scenario 1), groundwater use increases during drought,
                    causing declines in groundwater levels. With reductions in
                    groundwater use (Scenario 2), groundwater can still help
                    mitigate agricultural losses during the worst drought years,
                    while groundwater levels remain more stable over the long
                    term. However, reduced access to groundwater during drought
                    can lead to unmet agricultural water demand and lower
                    agricultural revenues.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Over the longer term, maintaining more sustainable
                    groundwater levels can reduce problems associated with
                    overdraft, including land subsidence, dry wells, and
                    reductions in groundwater contributions to surface waters.
                    Groundwater-dependent ecosystems can also benefit, as more
                    stable groundwater levels can help sustain native vegetation
                    and support recovery following drought.
                  </Typography>
                </>
              ),
            },
          ],
        },
      },
      {
        id: "what-this-theme-focuses-on",
        content: {
          type: "mixed",
          gap: "40px",
          blocks: [
            {
              type: "paragraph",
              text: "**Groundwater sustainability and agricultural adaptation** – As groundwater management requirements are implemented, some regions may need to reduce pumping. Farmers may respond by fallowing land, changing crops, improving irrigation efficiency, developing or shifting to alternative water supplies where alternatives are available, or making other long-term changes to farming operations. These changes can affect agricultural production, farm employment, and local economies, particularly when reductions persist over multiple years.",
            },
            {
              type: "paragraph",
              text: "**Surface water and groundwater as a connected system** – Surface water and groundwater are connected parts of California's water system, but access to each source varies considerably across agricultural regions and individual farms. Where groundwater is available, pumping often increases when surface water deliveries decline. Over time, increased pumping can lead to declining groundwater levels.",
            },
            {
              type: "paragraph",
              text: "**System connections and trade-offs** – Decisions about groundwater, land use, and surface water deliveries affect multiple parts of the system. Reducing groundwater pumping may increase pressure on surface water supplies. Changes in one region may shift demands or impacts to other regions or water sources. Reduced water availability, particularly during multi-year droughts, can have lasting effects on agricultural production, farm employment, local economies, and communities.",
            },
            {
              type: "paragraph",
              text: "These connections also extend to ecosystems. In the Sacramento Valley, for example, working agricultural lands such as rice fields provide important habitat, and irrigation districts deliver water to wildlife refuges and other managed habitat areas. Groundwater-dependent ecosystems, including wetlands and streamside forests, support regional biodiversity and native fish and wildlife. Declining groundwater levels can threaten these ecosystems and the functions they provide. Changes in agricultural water use and groundwater management therefore have environmental as well as economic consequences. Protecting groundwater over the long term is important for agriculture, communities, and ecosystems.",
            },
            {
              type: "image",
              src: "/images/themes/ag_gw-fig-02.svg",
              alt: "Groundwater storage and agricultural demand units",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Groundwater storage and agricultural demand units
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The CalSim3 water systems model used in COEQWAL simulates
                    groundwater storage conditions in 42 aquifer regions across
                    the Central Valley (see left map below). Agricultural
                    revenues are evaluated separately for 134 agricultural
                    demand units within the modeled area (see right map), each
                    representing agricultural land with specific water demand
                    characteristics.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The colors of the polygons indicate conditions under current
                    operations and represent whether outcomes are optimal,
                    acceptable, at-risk, or critical (red). See{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information on how these performance levels are
                    defined.
                  </Typography>
                </>
              ),
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
                (<>Across the <GlossaryTermLink>Central Valley</GlossaryTermLink>, farms often rely on a combination of surface water and groundwater. When surface water is limited, groundwater can sometimes be used to fill this gap. When groundwater is also constrained, however, additional surface water may not be available to make up the difference, leading to agricultural water shortages.</>),
                "Agricultural revenues change year-to-year in response to water availability and the crops planted. Annual crops generally yield lower revenues than perennial crops but offer more flexibility to adjust planting from year to year. Higher-value perennial crops (such as nuts and fruit trees) require water every year and long-term investment, making them difficult to adjust in response to short-term shortages.",
                "Groundwater systems change slowly. Reversing long-term trends in declining groundwater levels may require concerted management over many years or decades. Severe groundwater depletion and land subsidence can also make recovery more difficult.",
                "Farmers can adapt to reductions in groundwater access by shifting crops, changing water management practices, or retiring farmland, but many of these decisions require long-term planning.",
                "Impacts vary by region. The Sacramento Valley and San Joaquin Valley face different groundwater conditions and constraints, so system-wide averages can mask important local impacts.",
                (<>The models used by <GlossaryTermLink>COEQWAL</GlossaryTermLink> primarily focus on the Sacramento and San Joaquin River basins. The Tulare Basin and other parts of the southern San Joaquin Valley are only partially represented, and changes in groundwater storage and agricultural revenues are not evaluated in these regions.</>),
                (<><GlossaryTermLink>COEQWAL</GlossaryTermLink> explores the broader effects of limiting groundwater pumping. Because SGMA is implemented through individual basin plans that use different strategies to achieve groundwater sustainability, these scenarios do not represent how SGMA will be implemented or predict future conditions in individual basins. For more details about SGMA, visit the California Department of Water Resources.</>),
                "Some important management options and system connections are not evaluated here. These include managed aquifer recharge and environmental benefits associated with working agricultural lands, such as habitat provided by flooded rice fields and water delivered throughout agricultural infrastructure to wildlife refuges.",
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
              text: "This water issue compares water management strategies that reduce groundwater use through direct pumping limits and/or reductions in irrigated crop acreage, including:",
            },
            {
              type: "list",
              items: [
                "Groundwater pumping limits in the San Joaquin Valley",
                "Groundwater pumping limits via reduced crop acreage in the San Joaquin Valley",
                "Groundwater pumping limits in the Sacramento and San Joaquin Valley",
                "Groundwater pumping limits via reduced crop acreage in the Sacramento and San Joaquin Valley",
              ],
            },
            {
              type: "paragraph",
              text: "Together, these examine how the geographic extent of groundwater management (San Joaquin Valley versus both Sacramento and San Joaquin Valley) and different strategies to reduce groundwater use (direct pumping restrictions versus reduced crop acreage) influence water system performance under current and future climates.",
            },
            {
              type: "paragraph",
              text: (
                <>
                  For more information about each of these scenarios, visit{" "}
                  <InlineNavLink to="/data">
                    Data and Documentation
                  </InlineNavLink>
                  .
                </>
              ),
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
              text: (
                <>
                  The <InlineNavLink to="explore">Explore Tool</InlineNavLink>{" "}
                  allows you to explore how scenario outcomes compare under
                  alternative management strategies and climate conditions.
                  There are complementary ways to visualize tradeoffs, equity,
                  and resilience of water management strategies. The examples
                  below illustrate results from select scenarios for this water
                  issue.
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/ag_gw-fig-03.svg",
              alt: "Trade-offs radar chart",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Trade-offs
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How do different management strategies affect system
                    performance across multiple outcomes?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The radar chart in the Explore Tool summarizes performance
                    across nine key outcomes, revealing broad system-level
                    trade-offs within and between scenarios. The chart displays
                    the average performance across all locations of interest for
                    each scenario, providing a system-wide view of how these
                    management strategies influence multiple outcomes
                    simultaneously.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    This chart specifically compares Current operations (black),
                    Groundwater pumping limits in the Central Valley (blue), and
                    Groundwater pumping limits via reduced crop acreage in the
                    Central Valley (red) under the historical hydroclimate.
                    Agricultural revenues are distinguished for water districts
                    north-of-Delta (Sacramento Valley) and south-of-Delta (San
                    Joaquin Valley). The points show the average condition
                    across all locations of interest for each outcome,
                    classified into four outcome levels: optimal, acceptable,
                    at-risk, and critical. See{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information on how these categories are defined.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The results show slight improvements in the average
                    groundwater storage performance levels for Groundwater
                    pumping limits in the Central Valley, which corresponds to a
                    decrease in agricultural revenue. A larger improvement in
                    groundwater storage occurs when groundwater use is limited
                    through reductions in crop acreage. These groundwater
                    benefits, however, come with larger reductions in
                    agricultural revenues, particularly in the Sacramento Valley
                    (North of Delta), where conditions fall from
                    &ldquo;acceptable&rdquo; to &ldquo;at risk&rdquo;.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Reservoir storage improves under both groundwater management
                    strategies, showing that changes in groundwater use can have
                    effects elsewhere in the interconnected water system.
                    Winter-run salmon also show modest improvements relative to
                    current operations. Community water deliveries and Delta
                    estuary conditions change relatively little on average.
                    Water exports from the Delta substantially increase under
                    the reduced crop acreage scenario. This may reflect lower
                    agricultural water demands in the Sacramento Valley and
                    changes in Sacramento River inflows associated with
                    groundwater contributions. The increase in exports may also
                    help buffer impacts to agricultural revenues in the San
                    Joaquin Valley (South of Delta).
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    These results illustrate a central trade-off in groundwater
                    management. Direct pumping limits produce relatively modest
                    improvements in the average groundwater storage performance
                    level across locations, but also smaller impacts on
                    agricultural revenues. Reducing crop acreage produces larger
                    groundwater benefits, but also larger economic impacts,
                    particularly in the Sacramento Valley. This illustrates how
                    groundwater outcomes depend not only on pumping constraints,
                    but also on how agricultural systems adapt to reduced water
                    availability.
                  </Typography>
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/ag_gw-fig-04.svg",
              alt: "Distribution view map of groundwater and agricultural revenue outcomes",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Equity
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Where do benefits and impacts occur, and who is most
                    affected?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    System-wide averages can hide important differences in
                    scenario impacts. Water availability, groundwater
                    conditions, agricultural systems, and management constraints
                    vary considerably among agricultural water users across the
                    areas represented in the analysis, meaning that the same
                    management strategy can produce different outcomes in
                    different places.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Distribution view in the Explore Tool shows results for
                    individual locations of interest. This figure compares
                    outcomes for aquifer zones and agricultural districts for
                    Groundwater pumping limits via reduced crop acreage in the
                    Central Valley relative to the Current operations scenario
                    under the historical hydroclimate. Arrows indicate the
                    direction of change relative to current operations and color
                    represents optimal, acceptable, at-risk, or critical
                    outcomes for the scenario. Circles on the map indicate
                    locations where the outcome level did not change relative to
                    current operations.
                  </Typography>
                </>
              ),
              caption:
                "Agricultural revenue declines at most locations in the scenario with reduced crop acreage, with many falling into at-risk or critical conditions. In contrast, groundwater storage improves across most zones, with numerous locations moving into optimal condition and none remaining critical. The map indicates improvements in groundwater storage across much of the Sacramento and San Joaquin Valleys. Agricultural impacts are more uneven, with some of the largest declines in agricultural revenues occurring in the central and southern Sacramento Valley.\nComparing the two maps makes an important distributional trade-off visible: groundwater storage improves across much of the represented Central Valley, while agricultural revenues decline at many locations. The geographic patterns do not align perfectly because groundwater storage and agricultural revenues are evaluated using different spatial units, and the magnitude of benefits and impacts varies across regions.\nOverall, the Distribution view reveals regional patterns hidden by the system-wide averages and helps identify where management strategies create benefits, where they create burdens, and how evenly those effects are distributed.",
            },
            {
              type: "image",
              src: "/images/themes/ag_gw-fig-05.svg",
              alt: "Resilience heatmap across hydroclimate scenarios",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Resilience
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How consistently do management strategies perform under
                    different climate futures?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Climate change is expected to place increasing stress on
                    California&apos;s water system. A management strategy that
                    performs well today may respond differently as droughts
                    become more frequent, temperatures rise, and water
                    availability changes. The Resilience heatmap in the Explore
                    Tool examines how management strategies perform across a
                    range of plausible hydroclimates, representing increasing
                    levels of stress to the water system. Visit{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information about hydroclimates.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    This Resilience heatmap summarizes changes in groundwater
                    storage and agricultural revenues under Historical
                    conditions and under Moderate, Moderate-High, High and
                    Extreme climate stress for Current Operations and for
                    Groundwater pumping limits via reduced crop acreage in the
                    Central Valley. Outcomes are categorized as optimal (1.00 -
                    1.99), acceptable (2.00 - 2.99), at-risk (3.00 - 3.99), or
                    critical (4.00 - 4.99), with higher numerical values
                    indicating worse performance.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Groundwater pumping limits via reduced crop acreage in the
                    Central Valley lowers agricultural revenues relative to
                    Current operations under the historical climate and under
                    future climates. However, agricultural revenues for Current
                    operations respond more strongly to climate stress than for
                    the scenario in which groundwater limits are imposed. This
                    suggests a unique tradeoff between the two scenarios, in
                    which the impacts of lower overall agricultural revenues are
                    paired with a benefit of greater resilience to climate
                    stress.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Groundwater storage shows a different pattern. Reducing crop
                    acreage improves groundwater conditions under the historical
                    hydroclimate, and much of this benefit persists under
                    Moderate through High climate stress. Under Extreme stress,
                    however, groundwater conditions deteriorate and much of the
                    advantage over current operations is lost.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    These results suggest that reducing agricultural water
                    demand can improve groundwater resilience across a wide
                    range of climate conditions, but increasingly severe climate
                    stress can erode those benefits. They also show that
                    protecting groundwater does not eliminate the broader
                    challenge of maintaining agricultural production as water
                    becomes more limited.
                  </Typography>
                </>
              ),
            },
          ],
        },
      },
    ],
  },
  {
    id: "eco",
    label: "Protecting Rivers\nand Salmon",
    shortLabel: registryLabel("eco"),
    description:
      "Whether California's rivers can support healthy ecosystems and salmon populations while continuing to provide water for people and farms",
    heroImage: "/images/themes/salmon_hero.jpg",
    inquiry:
      "Can California's rivers support healthy ecosystems and salmon populations, while also providing water for people and farms?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Rivers are essential sources of water, but they are more than channels that move water from mountains to farms and cities. They are also living systems that support a great diversity of species. Salmon depend on river flows, cold water, and connected habitat for spawning, rearing, and migration to and from the ocean. Wetlands, birds, other fish, and other wildlife depend on healthy rivers too.",
            },
            {
              type: "paragraph",
              text: "California's rivers are defined by strong seasonal and annual variation in flows. In the winter and spring, rivers swell with rain and snowmelt, sometimes spilling onto floodplains and moving sediment, nutrients, plants, and animals across the landscape. In summer, flows recede and waters warm. California's native freshwater species evolved with these changing conditions. Salmon, in particular, depend on different river conditions at different stages of their life cycle.",
            },
            {
              type: "image",
              src: "/images/themes/eco-fig-01.svg",
              alt: "Winter-run Chinook salmon life cycle",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Winter-run Chinook salmon life cycle
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Sacramento River winter-run Chinook have a unique life
                    history. Spawning adults (age 2, 3, or 4 years old) enter
                    the Sacramento River as early as November, and most migrate
                    far up the Sacramento River, where they hold in the upper
                    river for several months before spawning. After spawning,
                    the eggs incubate in the gravel for approximately 3 months
                    before emerging as fry.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Fry can rear in the freshwater environment for 5-10 months
                    before transitioning to the smolt outmigration lifestage.
                    From January through April, smolts migrate downstream and
                    enter the Gulf of the Farallones. Once in the Pacific Ocean,
                    they mature for 1-3 years before re-entering the Sacramento
                    River to spawn again to start the next generation.
                  </Typography>
                </>
              ),
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
              text: (<>California's rivers begin in the mountains and flow through valleys to the <GlossaryTermLink>Delta</GlossaryTermLink> and ocean. Along the way, they sustain ecosystems and provide water for farms and communities. Rivers are deeply interconnected with California's water management system. Dams, reservoir operations, and water diversions have altered the timing and amount of river flows on which native species depend. Decisions about how much water to store, release, and deliver for different purposes therefore create trade-offs that can ripple across the system.</>),
            },
            {
              type: "paragraph",
              text: "Salmon are among California's most iconic species. Different salmon runs migrate between rivers and the ocean at different times of the year, supporting Tribal cultural practices, recreational and commercial fisheries, local economies, and ecosystem health. Because salmon depend on river conditions throughout multiple life stages, they are often used as indicators of the overall health of river ecosystems and the effectiveness of environmental flow management.",
            },
            {
              type: "paragraph",
              text: "The tension between water operations and salmon conservation is particularly acute in the Sacramento River, where winter-run Chinook salmon are endangered and remain at high risk of extinction. Winter-run salmon historically spawned in cold, spring-fed headwaters and tributaries of the Sacramento River. Today, Shasta Dam blocks access to most of those habitats, and winter-run primarily spawn downstream of Shasta Dam during the warmest part of the year. Their egg survival now depends heavily on cold water stored in Shasta Reservoir and released downstream during summer.",
            },
            {
              type: "paragraph",
              text: (<>Reintroducing winter-run to cold-water habitat above Shasta Dam offers another potential pathway for recovery by giving fish access to habitat that is less dependent on reservoir releases. <GlossaryTermLink>COEQWAL</GlossaryTermLink> explores how this could change salmon outcomes alongside alternative flow-management strategies.</>),
            },
            {
              type: "paragraph",
              text: "Restoring important elements of natural flow patterns can benefit salmon and other freshwater species, but integrating environmental flows into a highly managed water system creates difficult choices. Climate change makes those choices harder. Shrinking snowpack, earlier snowmelt, intensifying drought, and higher temperatures affect both the amount and timing of river flows and the cold water available for salmon.",
            },
            {
              type: "image",
              src: "/images/themes/eco-fig-02.svg",
              alt: "Winter-run Chinook salmon depend on connected habitats throughout their life cycle",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Winter-run Chinook salmon depend on connected habitats
                    throughout their life cycle
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Historically, most winter-run Chinook salmon spawned in cold
                    headwater streams upstream of what is now Shasta Dam. Today,
                    most spawn below the dam. Young salmon then move through the
                    Sacramento River, floodplains, Delta, and Bay before
                    reaching the ocean, while returning adults make the journey
                    back upstream. Their survival depends on suitable flows,
                    temperatures, and habitat at each stage of this life cycle.
                  </Typography>
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/eco-fig-03.svg",
              alt: "Winter-run Chinook salmon need different river conditions throughout the year",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Winter-run Chinook salmon need different river conditions
                    throughout the year
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Winter-run chinook salmon depend on seasonal flows for
                    migration and rearing and on cold summer water for
                    successful spawning and egg survival. Because Shasta Dam
                    blocks access to historical cold-water habitat, reservoir
                    operations now play a critical role in maintaining suitable
                    downstream temperatures.
                  </Typography>
                </>
              ),
            },
          ],
        },
      },
      {
        id: "what-this-theme-focuses-on",
        content: {
          type: "mixed",
          gap: "40px",
          blocks: [
            {
              type: "paragraph",
              text: "**Seasonal flow and year-to-year variability** – California's rivers exhibit distinct seasonal patterns. Winter and spring rains and snowmelt increase flows, sometimes spreading onto floodplains and creating habitat for fish and other species. In summer and fall, flows naturally decline and water temperatures rise. Native species have evolved with these seasonal changes.",
            },
            {
              type: "paragraph",
              text: "California rivers vary considerably from year to year. Wet years, dry years, floods, and droughts are part of this natural variability, while modern water management often reduces or shifts these fluctuations to improve water-supply reliability and meet other objectives. Water allocated to rivers for ecosystem benefits are known as environmental flows. Environmental flows generally protect a minimum amount of water in rivers throughout the year. Functional environmental flows are designed to preserve key elements of these natural seasonal and year-to-year patterns.",
            },
            {
              type: "paragraph",
              text: "**Cold-water needs of Winter-run Chinook salmon** – Winter-run Chinook salmon differ from most other California salmon runs. They spawn during summer, when river temperatures are naturally warm, and historically relied on cold spring-fed habitats at higher elevations to survive. Today, Shasta Dam blocks access to much of this habitat, making winter-run salmon highly dependent on cold-water releases from Shasta Reservoir.",
            },
            {
              type: "paragraph",
              text: "As a result, managing reservoir storage is not only a water supply issue, it is also a fish survival issue. If Shasta's cold-water pool becomes depleted during summer, egg mortality can increase even when river-flow targets are met. For winter-run salmon, the temperature and timing of water releases can therefore be as important as the amount of water released.",
            },
            {
              type: "paragraph",
              text: (<>Reintroduction above Shasta Dam could reduce this dependence by restoring access to cold, spring-fed habitat. <GlossaryTermLink>COEQWAL</GlossaryTermLink> examines how reintroduction could affect winter-run outcomes under different management and climate conditions.</>),
            },
            {
              type: "paragraph",
              text: "**System connections and trade-offs** – Rivers are deeply interconnected with California's water supply system. Water released from reservoirs for environmental flows can affect the amount and timing of water remaining in storage or available for other uses. For winter-run salmon, there can also be trade-offs within environmental management itself: releasing more water to restore natural flow patterns may reduce the cold-water storage needed to protect eggs during summer. These connections mean that a strategy that benefits one ecological process or life stage may create different effects elsewhere in the system.",
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
                "River ecosystems are shaped not only by how much water flows, but when it flows and its temperature.",
                "Reservoirs provide important water storage benefits for people and farms, but they also alter natural flow patterns, temperatures, and habitat conditions.",
                "Minimum environmental-flow requirements generally maintain a baseline amount of water in rivers but may not preserve the seasonal and year-to-year variability important to ecosystem processes. Functional environmental flows are designed to restore key elements of that variability.",
                "Salmon depend on different conditions at different life stages. Winter-run Chinook salmon are especially dependent on cold-water releases from Shasta Reservoir.",
                "Improving environmental flows does not necessarily improve winter-run salmon outcomes. For winter-run, releasing more water at one time of year can reduce the cold-water storage needed at another.",
                "Flow management alone cannot fully restore river ecosystems. Habitat conditions, water temperature, landscape changes, invasive species, and access to historical habitat also influence ecological outcomes.",
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
              text: "This water issue explores strategies designed to improve river ecosystem conditions and winter-run Chinook salmon populations. Some scenarios establish functional environmental flows that preserve key elements of natural seasonal and year-to-year flow variability. Other strategies adjust reservoir operations to protect cold-water storage and flows that provide refuge for multiple life stages of winter-run salmon. Many of these scenarios are also evaluated with groundwater pumping limits and/or reintroduction of winter-run above Shasta Dam.",
            },
            {
              type: "paragraph",
              text: "This water issue focuses on the following scenarios:",
            },
            {
              type: "list",
              items: [
                "Functional environmental flows",
                "Functional environmental flows with reduced crop acreage",
                "Winter-run refuge flows",
                "Winter-run refuge flows with reduced crop acreage",
                "No flow requirements",
              ],
            },
            {
              type: "paragraph",
              text: "Scenarios with reintroduction of salmon above Shasta Reservoir include:",
            },
            {
              type: "list",
              items: [
                "Current operations with reintroduction",
                "Functional environmental flows with reintroduction",
                "Functional environmental flows with reduced crop acreage and reintroduction",
                "Winter-run refuge flows with reintroduction",
                "Winter-run refuge flows with reduced crop acreage and reintroduction",
              ],
            },
            {
              type: "paragraph",
              text: (
                <>
                  For more information about those scenarios, and additional
                  scenarios modeled with reintroduction alternatives, visit{" "}
                  <InlineNavLink to="/data">
                    Data and Documentation
                  </InlineNavLink>
                  .
                </>
              ),
            },
            {
              type: "paragraph",
              text: "Together, these scenarios examine how environmental flows, reservoir operations, groundwater management, and access to historical habitat influence river and salmon outcomes and create trade-offs elsewhere in the water system.",
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
              text: (
                <>
                  The <InlineNavLink to="explore">Explore Tool</InlineNavLink>{" "}
                  allows you to explore how scenario outcomes compare under
                  alternative management strategies and climate conditions.
                  There are complementary ways to visualize tradeoffs, equity,
                  and resilience of water management strategies. The examples
                  below illustrate results from select scenarios for this water
                  issue.
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/eco-fig-04.svg",
              alt: "Trade-offs radar chart",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Trade-offs
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How do different management strategies affect overall system
                    performance across multiple outcomes?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The radar chart in the Explore Tool summarizes performance
                    across nine key outcomes, revealing broad system-level
                    trade-offs within and between scenarios. This example
                    compares Current operations with two approaches to
                    protecting rivers and salmon: Functional environmental
                    flows, which seek to restore key elements of natural flow
                    patterns, and Winter-run refuge flows, which prioritize
                    cold-water releases from Shasta along with functional flows
                    shaped to benefit winter-run Chinook salmon. The Functional
                    environmental flows with reintroduction strategy is also
                    included to show how reintroduction of winter-run Chinook
                    salmon above Shasta Dam changes outcomes. The chart
                    specifically compares Current operations (black), Functional
                    environmental flows (red), Functional environmental flows
                    with reintroduction (yellow), and Winter-run refuge flows
                    (blue) under the historical hydroclimate. The points show
                    the average conditions of all locations of interest for each
                    outcome and are classified into four outcome levels:
                    optimal, acceptable, at-risk, and critical. See{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information on how these categories are defined.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The results show that Functional environmental flows
                    substantially improve the environmental flow outcome,
                    shifting average conditions from &ldquo;At-Risk&rdquo; under
                    current operations to &ldquo;Optimal&rdquo;. This
                    improvement is accompanied by lower reservoir storage and
                    poorer conditions for winter-run salmon, unless functional
                    environmental flows are paired with the reintroduction of
                    winter-run Chinook salmon above Shasta. The result reflects
                    an important challenge for winter-run: releasing water to
                    restore more natural flow patterns can reduce the cold-water
                    reserves in Shasta Reservoir needed to protect eggs during
                    summer. However, if winter-run can spawn above Shasta where
                    cool spring-fed tributaries support egg survival, then these
                    actions are complementary with functional flows that can
                    support instream rearing and outmigration habitat. As a
                    result, all winter-run lifestages are supported with the
                    Functional environmental flows with reintroduction scenario,
                    and move winter-run from a &ldquo;Critical&rdquo; to
                    &ldquo;At-Risk&rdquo; population.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Winter-run refuge flows scenario also moves the
                    winter-run population from &ldquo;Critical&rdquo; to
                    &ldquo;At-Risk&rdquo;, but does so by managing reservoir
                    operations to protect Shasta&apos;s cold-water pool. It then
                    allocates the remaining water to functional flows, adding
                    pulse flows to support rearing habitat and salmon
                    outmigration survival. While this scenario provides flows
                    for later in-river lifestages in the mainstem Sacramento
                    River, it has flow requirements at fewer locations than the
                    Functional environmental flows scenario. As a result, the
                    Winter-run refuge flows scenario improves reservoir storage
                    and winter-run salmon outcomes relative to Functional
                    environmental flows, but performs less well against the
                    broader environmental-flow objective.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The scenarios also affect water availability elsewhere in
                    the system. All scenarios increase freshwater available for
                    in-Delta uses, relative to Current operations, while the
                    Winter-run refuge flows produce a particularly large
                    improvement in freshwater available for Delta exports.
                    Agricultural revenue and community surface water deliveries
                    change relatively little at the system-wide scale, as do
                    groundwater storage and Delta estuary ecology.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Overall, these results show that strategies intended to
                    protect rivers and winter-run salmon can produce different
                    trade-offs depending on how water is managed. A strategy
                    that improves broader river-flow conditions may not
                    necessarily improve survival of winter-run salmon if it does
                    not preserve cold-water storage needed for their early life
                    stage. Reintroduction changes this relationship by reducing
                    winter-run dependence on downstream cold-water releases from
                    Shasta Reservoir.
                  </Typography>
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/eco-fig-05.svg",
              alt: "Distribution view map of environmental flow and salmon outcomes",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Equity
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Where do benefits and impacts occur, and who is most
                    affected?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    System-wide averages can hide important differences in
                    scenario impacts. River conditions, water availability,
                    ecosystem needs, and competing demands vary considerably
                    across the Central Valley, meaning that the same river
                    management strategy can create different benefits and
                    burdens in different places.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Distribution view in the Explore Tool shows results for
                    individual locations of interest. The figure summarizes how
                    outcomes shift at all locations under the Functional
                    environmental flows scenario relative to current operations.
                    Arrows indicate direction of change relative to current
                    operations and color represents optimal (green), acceptable
                    (blue), at-risk (orange), or critical (red) outcomes for the
                    scenario. Boxes represent locations for which the outcome
                    results remain the same.
                  </Typography>
                </>
              ),
              caption:
                "Compared with Current operations, Functional environmental flows have mixed effects on community surface water deliveries and agricultural revenues. Conditions improve at some locations, decline at others, and remain the same at most locations. Environmental flow outcomes substantially improve, while groundwater storage, freshwater for in-Delta uses, Delta estuary ecology, and winter-run salmon generally remain at the same outcome level. Reservoir storage experiences mixed effects. In the Sacramento Valley, more water is released for functional flows and other uses and results in lower storage; the San Joaquin Valley sees some increases in reservoir storage and some declines.\nOverall, the Distribution view reveals spatial patterns hidden by system-wide averages and helps identify where a management strategy creates benefits, where it creates burdens, and how evenly those effects are distributed.",
            },
            {
              type: "image",
              src: "/images/themes/eco-fig-06.svg",
              alt: "Resilience heatmap across hydroclimate scenarios",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Resilience
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How consistently do management strategies perform under
                    different climate futures?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Climate change is expected to place increasing stress on
                    California&apos;s water system. A management strategy that
                    performs well today may respond differently as droughts
                    become more frequent, temperatures rise, and water
                    availability changes. The Resilience heatmap in the Explore
                    Tool examines how management strategies perform across a
                    range of plausible hydroclimates, representing increasing
                    levels of stress to the water system. See{" "}
                    <InlineNavLink to="/data">
                      Data and documentation
                    </InlineNavLink>{" "}
                    for more information about hydroclimates.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Resilience heatmap summarizes environmental flow and
                    winter-run salmon outcomes for the Current operations,
                    Functional environmental flows, and Functional environmental
                    flows with reintroduction scenarios, under the historical
                    hydroclimate and under future hydroclimates representing
                    Moderate, Moderate-High, High and Extreme levels of stress.
                    Outcomes are categorized as optimal (green, 1.00 - 1.99),
                    acceptable (blue, 2.00 - 2.99), at-risk (orange, 3.00 -
                    3.99), or critical (red, 4.00 - 4.99), with higher numerical
                    values indicating worse performance.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Under Current operations, environmental flows are &ldquo;at
                    risk&rdquo; under historical climate and future climates
                    representing Moderate, Moderate-high, and High stress to the
                    water system. On average, environmental flows fall to
                    critical levels under Extreme climate stress. Implementing
                    functional environmental flows in Central Valley rivers
                    substantially improves environmental flow outcomes across
                    all climate futures. For the Functional environmental flows
                    and Functional environmental flows with reintroduction
                    scenarios, environmental flow outcomes remain
                    &ldquo;Acceptable&rdquo;, even under Extreme climate stress.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Under Current operations, winter-run salmon remain at
                    critical levels across the majority of hydroclimates. This
                    is also true for the Functional environmental flows
                    scenario, where winter-run remains at critical levels across
                    hydroclimates because functional flows deplete Shasta
                    cold-water reserves and provide less protection for the egg
                    lifestage. However, if functional flows are paired with
                    reintroduction of winter-run above Shasta, access to
                    cold-water habitat supports the egg lifestage and functional
                    flows support rearing and migration lifestages in the
                    Sacramento River. As a result, the winter-run population
                    responds positively and moves out of &ldquo;Critical&rdquo;
                    levels and into &ldquo;At-Risk&rdquo; levels for all
                    hydroclimates. The results suggest that the combination of
                    functional environmental flows and reintroduction can
                    improve conditions for both environmental flow metrics and
                    winter-run salmon under historical and future climates. This
                    also underscores the potential importance of complementary
                    approaches, such as reintroduction, for mitigating climate
                    impacts to winter-run salmon.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Overall, the heatmap shows how the effectiveness of
                    management strategies can change under different climate
                    futures and helps identify where benefits remain robust and
                    where they begin to break down as California&apos;s climate
                    changes.
                  </Typography>
                </>
              ),
            },
          ],
        },
      },
    ],
  },
  {
    id: "delta",
    label: "Balancing Needs\nin the Delta",
    shortLabel: registryLabel("delta"),
    description:
      "Whether the Delta can remain healthy for people, farms, fish, and wildlife as California balances water exports, salinity, and ecosystem needs",
    heroImage: "/images/themes/delta_hero.jpg",
    inquiry:
      "Can the Delta stay healthy for people, farms, fish, and wildlife, now and in the future?",
    sections: [
      {
        id: "intro",
        content: {
          type: "mixed",
          blocks: [
            {
              type: "paragraph",
              text: "Millions of Californians rely on freshwater from the Sacramento-San Joaquin Delta. Pumping facilities in the Delta divert water into canals for export to communities and farms elsewhere in California. At the same time, the Delta is a living place, home to communities, farms that grow food, and fish and birds that depend on rivers, wetlands, and a healthy estuary.",
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
              text: (<>The Sacramento–San Joaquin <GlossaryTermLink>Delta</GlossaryTermLink> sits at the heart of California's water system. Pumping facilities in and around the Delta convey water to cities and farms throughout the San Francisco Bay Area, San Joaquin Valley, Southern California, and other parts of the state. The Delta is also a highly altered ecosystem of wetlands, waterways, and important fish species. Families, farmers, fishing communities, and Tribal nations have deep ties to this landscape.</>),
            },
            {
              type: "paragraph",
              text: "Over time, dams, levees, reservoirs, and pumping plants have changed how water moves through the Delta and into the San Francisco Bay estuary. The Delta historically experienced large seasonal shifts in freshwater and salinity conditions. Today, upstream reservoir releases, water quality requirements, and export operations strongly influence these patterns. Wetlands have been converted to farmland, creating islands protected by levees, many of which now lie below sea level. Habitat alterations and invasive species have also contributed to major changes in fish populations and water quality conditions.",
            },
            {
              type: "paragraph",
              text: "A transformed Delta now faces additional pressures. Droughts are lasting longer. Heat waves are more intense. Water quality problems, including harmful algal blooms, are increasing. Sea levels are rising, changing how freshwater from rivers mixes with saltwater from the Bay and increasing risk of levee failures. These shifts stress ecosystems and uses of water inside and outside of the Delta.",
            },
            {
              type: "paragraph",
              text: "Understanding how the Delta functions as a place, water-conveyance hub, and living ecosystem helps inform decisions about its future.",
            },
            {
              type: "image",
              src: "/images/themes/delta-fig-01.svg",
              alt: "How river flows and water exports affect the Delta",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    How river flows and water exports affect the Delta
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Freshwater flowing into the Delta and water exported through
                    the Delta pumping facilities together influence how water
                    moves through Delta channels and where fresh and saline
                    water meet. When river flows are high and exports are low,
                    freshwater generally moves seaward and limits salinity
                    intrusion. When freshwater inflows decline or export pumping
                    increases, flow patterns can shift and saline water can move
                    farther inland.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    These interactions create important trade-offs among
                    freshwater available for export, water quality for in-Delta
                    water uses, and ecosystem conditions.
                  </Typography>
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/delta-fig-02.svg",
              alt: "Delta operations across four quadrants",
            },
          ],
        },
      },
      {
        id: "what-this-theme-focuses-on",
        content: {
          type: "mixed",
          gap: "40px",
          blocks: [
            {
              type: "paragraph",
              text: "**Seasonal flow, salinity, and water use** – The Delta changes with the seasons. In spring, snowmelt and reservoir releases fill rivers with fresh water, making the Delta less salty. In summer and fall, river flows decline, temperatures rise, and the Bay's saline waters can move farther inland. Salinity is shaped by freshwater inflows, sea level, tides, and the movement of water through the Delta's network of channels and wetlands. Reservoir releases help limit salinity intrusion during dry months, maintaining freshwater for in-Delta uses and for water exported from the Delta to farms and cities.",
            },
            {
              type: "paragraph",
              text: "**Health of the Delta estuary ecosystem** – The Delta is a highly altered, novel ecosystem that has been transformed by over a century of intensive land use and water operations. Much of the natural habitats in the Delta have been lost or degraded and the system now supports a multitude of native and non-native species.",
            },
            {
              type: "paragraph",
              text: "Changes in freshwater flows through the Delta from upstream reservoir releases and pumping operations affect currents, water quality, and habitat conditions for different species. But flow is only one influence on Delta ecology. Habitat, invasive species, water temperature, food-web conditions, and other factors also shape ecological outcomes. As a result, changing flows alone may not improve ecosystem health without complementary actions that address other limiting factors.",
            },
            {
              type: "paragraph",
              text: "**System connections and trade-offs** – The Delta is deeply connected to the rest of California's water system. Reservoir storage and releases, water exports, agricultural and community demands, environmental requirements, and sea-level rise all influence conditions in the Delta. Changes intended to benefit one part of the system can therefore create benefits or burdens elsewhere, sometimes far beyond the Delta itself.",
            },
            {
              type: "paragraph",
              text: "Some outcomes may be highly responsive to changes in management, such as water deliveries to farms, while others, such as the ecology of the Delta, may take longer to respond and can be affected by factors beyond water management alone. Balancing needs in the Delta therefore involves more than deciding how much water should flow through or be exported from the Delta.",
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
                "In-Delta water quality and salinity are sensitive to freshwater inflows, reservoir operations, exports, sea-level rise, tides, and climate conditions. Changes in these factors can affect freshwater for in-Delta uses and exports, as well as ecosystem conditions.",
                (<>Freshwater flow is important to Delta ecology, but Delta outflows alone do not address all factors limiting ecosystem health. Habitat, invasive species, water temperature, food-web conditions, and other factors not fully represented by <GlossaryTermLink>COEQWAL</GlossaryTermLink> also influence ecological outcomes.</>),
                (<>A <GlossaryTermLink>Delta Conveyance Project</GlossaryTermLink> scenario evaluates how the proposed project could affect modeled water-system outcomes, but does not capture the full range of potential social, cultural, economic, and environmental benefits and impacts associated with the project.</>),
                "Changes in operational rules do not always produce simple or direct responses. Even when operational rules change under a scenario, other requirements, such as water quality standards, may remain in place. As a result, management changes do not always translate directly into expected changes in Delta outflows, salinity, or ecosystem conditions.",
                "Delta conditions are influenced by both management and climate. The hydroclimates include changes in freshwater conditions and sea-level rise, which together can affect salinity, ecosystem conditions, in-Delta uses, and water exports.",
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
              text: "This water issue explores scenarios that affect the volume, timing, and quality of water moving through the Delta. These include alternative Delta outflow targets, changes in reservoir operations and salinity standards, and new conveyance infrastructure. This water issue specifically focuses on scenarios that:",
            },
            {
              type: "list",
              items: [
                "Reduce Delta outflow targets (35% of unimpaired flow)",
                "Maintain Delta outflow targets (45% of unimpaired flow)",
                "Increase Delta outflow targets (55% of unimpaired flow)",
                "Increase Delta outflow targets (65% of unimpaired flow)",
                "Increase Shasta carry-over storage",
                "Relax Delta fall salinity standards",
                "Delta Conveyance Project",
              ],
            },
            {
              type: "paragraph",
              text: "Together, these scenarios examine how different management actions influence conditions in the Delta and the broader performance of California's interconnected water system.",
            },
            {
              type: "paragraph",
              text: (
                <>
                  For more information about each of these scenarios, visit{" "}
                  <InlineNavLink to="/data">
                    Data and Documentation
                  </InlineNavLink>
                  .
                </>
              ),
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
              text: "The Explore Tool allows you to explore how scenario outcomes compare under alternative management strategies and climate conditions. There are complementary ways to visualize tradeoffs, equity, and resilience of water management strategies. The examples below illustrate results from select scenarios for this water issue.",
            },
            {
              type: "image",
              src: "/images/themes/delta-fig-03.svg",
              alt: "Trade-offs radar chart",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Trade-offs
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How do different management strategies affect overall system
                    performance across multiple outcomes?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The radar chart in the Explore Tool summarizes performance
                    across nine key outcomes, revealing broad system-level
                    trade-offs within and between scenarios. The chart displays
                    the average performance across all locations of interest for
                    each scenario, providing a system-wide view of how these
                    management strategies influence multiple outcomes
                    simultaneously. The chart specifically compares Current
                    operations (black), Increase Delta outflow targets (65% of
                    unimpaired flow) (blue), and Delta Conveyance Project (red)
                    under the historical hydroclimate. The points show the
                    average condition across all locations of interest for each
                    outcome, classified into four outcome levels: optimal,
                    acceptable, at-risk, and critical. See{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information on how these categories are defined.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The results show how the two strategies shift the balance of
                    outcomes within and beyond the Delta. Increasing Delta
                    outflow targets to 65% of unimpaired flow increases
                    freshwater moving through and out of the Delta through a
                    combination of increased upstream flows and reduced export
                    pumping. This substantially reduces freshwater available for
                    export while improving freshwater conditions for in-Delta
                    uses. By contrast, the Delta Conveyance Project diverts some
                    Sacramento River water through new intakes in the northern
                    Delta, increasing freshwater available for export while
                    producing relatively little change in modeled freshwater
                    conditions for in-Delta uses.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Both scenarios also affect outcomes elsewhere in the system.
                    Increasing Delta outflows reduces reservoir and groundwater
                    storage, while the Delta Conveyance Project improves both.
                    Community surface-water deliveries decline slightly under
                    both scenarios relative to Current operations, but remain at
                    or near the Optimal threshold. Environmental flows also
                    decline slightly, while the modeled outcome for winter-run
                    salmon improves slightly under both scenarios. Agricultural
                    revenue increases slightly under the increased-outflow
                    scenario but declines under the Delta Conveyance Project.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The modeled Delta estuary ecology outcome improves modestly
                    under the increased-outflow scenario. This does not mean
                    that freshwater flow is unimportant to Delta ecosystems.
                    Rather, the result reflects that ecological conditions are
                    also constrained by habitat, invasive species, food-web
                    conditions, and other factors that are not changed by this
                    scenario. Improving flows alongside habitat restoration and
                    other complementary actions could potentially produce
                    broader ecological benefits than changing flows alone.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    These modeled outcomes capture only some dimensions of the
                    proposed Delta Conveyance Project. They do not capture many
                    other important considerations, including effects on Delta
                    communities, Tribal priorities, agriculture, and ecosystems;
                    construction impacts and costs; or how benefits and burdens
                    would be distributed among regions.
                  </Typography>
                </>
              ),
            },
            {
              type: "image",
              src: "/images/themes/delta-fig-04.svg",
              alt: "Distribution view map of Delta outcomes",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Equity
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Where do benefits and impacts occur, and who is most
                    affected?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    System-wide averages can hide important differences in
                    scenario impacts. Communities, farms, ecosystems, and water
                    users within and outside the Delta depend on water moving
                    through the system in different ways. As a result, changes
                    in reservoir operations, Delta flows, salinity, or exports
                    can shift the benefits and impacts to different locations.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Distribution view in the Explore Tool shows results for
                    individual locations of interest. The figure summarizes how
                    outcomes shift across locations under the Increase Shasta
                    carry-over storage scenario relative to Current operations
                    under the historical hydroclimate. This scenario targets
                    approximately 20% more September storage in Shasta Reservoir
                    than under Current operations by adjusting water allocations
                    earlier in the year. Arrows indicate direction of change
                    relative to current operations and color represents optimal
                    (green), acceptable (blue), at-risk (orange), or critical
                    (red) outcomes for the scenario. Squares represent locations
                    that did not change condition relative to current
                    operations.
                  </Typography>
                </>
              ),
              caption:
                "The Distribution view shows that increasing Shasta carry-over storage has limited effects on most outcomes and locations. In many years, the additional amount of water needed to reach the September storage target may be relatively modest and can be accumulated through adjustments spread over several preceding months. Other demands and operating constraints can also limit how strongly this change propagates through the system. Community surface water deliveries and agricultural revenues decline at a small number of locations, while reservoir storage improves at two locations. Freshwater for Delta exports declines. Environmental flows, groundwater storage, Delta estuary ecology, and freshwater for in-Delta uses do not change.\nThese results show how a strategy intended to maintain more water in storage can create benefits and negative impacts in different parts of the system. The locations benefiting from increased reservoir storage are not necessarily the same locations experiencing declines in environmental flows, agricultural revenues, or community surface water deliveries.\nOverall, the Distribution view reveals patterns hidden by system-wide averages and helps identify where management strategies create benefits, where they create burdens, and how evenly those effects are distributed.",
            },
            {
              type: "image",
              src: "/images/themes/delta-fig-05.svg",
              alt: "Resilience heatmap across hydroclimate scenarios",
              captionBefore: (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "inherit" }}
                  >
                    Resilience
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    How consistently do management strategies perform under
                    different climate futures?
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Climate change is expected to place increasing stress on
                    California&apos;s water system. A management strategy that
                    performs well today may respond differently as droughts
                    become more frequent, temperatures rise, and water
                    availability changes. The Resilience heatmap in the Explore
                    Tool examines how management strategies perform across a
                    range of plausible hydroclimates, representing increasing
                    levels of stress to the water system. See{" "}
                    <InlineNavLink to="/data">
                      Data and Documentation
                    </InlineNavLink>{" "}
                    for more information about hydroclimates.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    The Resilience heatmap compares outcomes for Current
                    operations and Relaxing Delta salinity standards under the
                    historical hydroclimate and future hydroclimates
                    representing Moderate, Moderate-High, High and Extreme
                    levels of stress. This relaxed salinity scenario removes the
                    fall X2 salinity standard, which regulates how far saline
                    water can move into the Delta during fall by setting a
                    required location for the low-salinity zone. Outcomes are
                    categorized as optimal (green, 1.00 - 1.99), acceptable
                    (blue, 2.00 - 2.99), at-risk (orange, 3.00 - 3.99), or
                    critical (red, 4.00 - 4.99), with higher numerical values
                    indicating worse performance.
                  </Typography>
                </>
              ),
              caption: (
                <>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Relaxing the fall Delta salinity standard produces
                    relatively small changes in system outcomes under the
                    historical hydroclimate. All outcomes remain within the same
                    performance category. Delta freshwater exports improve
                    slightly, while freshwater for in-Delta uses falls from an
                    &ldquo;acceptable&rdquo; to &ldquo;at risk&rdquo; level
                    under the historical climate.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Across the hydroclimates, many outcomes become less
                    favorable as the climate becomes more stressful, but the
                    responses are not always linear. Some outcomes improve under
                    particular hydroclimates even as overall climate stress
                    increases. For example, Delta estuary ecology performs
                    better under the Moderate future than under historical
                    conditions, for both scenarios. Some outcomes, including
                    environmental flows, Delta estuary ecology, Delta exports,
                    freshwater for in-Delta uses, and winter-run salmon, fall to
                    at-risk or critical levels with increasing climate stress,
                    while others, such as community surface water deliveries and
                    agricultural revenues, remain at acceptable levels. These
                    patterns show that individual outcomes can respond
                    differently to the particular combination of conditions
                    represented by each hydroclimate.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    Differences between Current operations and Relaxing Delta
                    salinity standards generally remain modest across the
                    hydroclimates examined. In this comparison, changes
                    associated with the hydroclimate are generally larger than
                    the differences between the two management strategies,
                    suggesting that climate has a stronger influence on overall
                    system performance than relaxing the fall salinity standard
                    alone.
                  </Typography>
                </>
              ),
            },
          ],
        },
      },
    ],
  },
]
