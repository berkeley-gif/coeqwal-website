"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function Tiers() {
  return (
    <NarrativeFrameSection
      id="frame-8"
      ariaLabel="A common yardstick for distributional equity tiers"
      height="340vh"
      title={"A common yardstick for distributional equity: Tiers"}
      groups={[
        {
          enter: [0.08, 0.18],
          hold: [0.18, 0.34],
          paragraphs: [
            {
              sentences: [
                "Within this broader approach to equity, COEQWAL uses a tier-based interpretive framework to understand distributional equity, how benefits and impacts are shared across people, places, and ecosystems.",
              ],
            },
            {
              sentences: [
                "Each COEQWAL scenario evaluates key outcomes that people and ecosystems experience directly, including community water system deliveries, agricultural revenues, river ecology, Bay-Delta estuary conditions, winter-run salmon abundance, freshwater availability for in-Delta uses and exports, reservoir storage, and groundwater storage.",
              ],
            },
          ],
        },
        {
          enter: [0.3, 0.44],
          hold: [0.44, 0.6],
          paragraphs: [
            {
              sentences: [
                "These outcomes are measured in different ways, flows, agricultural productivity, salinity, and species populations, each with their own units, scales, and thresholds.",
                "Because of this, it is difficult to compare outcomes across sectors, understand overall system performance, or see who benefits, who is at risk, and how impacts are distributed across communities and ecosystems.",
              ],
            },
          ],
        },
        {
          enter: [0.48, 0.62],
          hold: [0.62, 0.78],
          paragraphs: [
            {
              sentences: [
                "To address this, COEQWAL translates these diverse outcomes into a shared interpretive scale, creating a common yardstick that allows users to compare conditions across sectors, locations, and communities.",
              ],
            },
            {
              sentences: [
                "You can think of tiers as a way of reading conditions along the system, showing where communities and ecosystems are thriving, functioning, at risk, or in critical condition.",
              ],
            },
          ],
        },
        {
          enter: [0.66, 0.8],
          hold: [0.8, 0.94],
          paragraphs: [
            {
              sentences: [
                "This framework is designed specifically to support distributional equity.",
                "It does not replace other forms of equity; it complements them by making patterns of distribution visible.",
                "The same scenario can produce very different conditions depending on where you are and what you depend on.",
              ],
            },
            {
              sentences: [
                "Each tier reflects how often conditions meet defined thresholds over time, rather than a single snapshot.",
                "This captures reliability, persistence, and exposure to risk, key dimensions of both resilience and equity.",
              ],
            },
          ],
        },
        {
          enter: [0.84, 0.94],
          hold: [0.94, 1],
          paragraphs: [
            {
              sentences: [
                "By comparing tier outcomes across sectors and locations, users can see who benefits from a given scenario, who faces increased risks, and how those patterns shift under different decisions.",
              ],
            },
          ],
        },
      ]}
    />
  )
}