"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function HistoricalContext() {
  return (
    <NarrativeFrameSection
      id="frame-2"
      ariaLabel="Historical context for water equity"
      height="280vh"
      title={"How Indigenous communities managed water"}
      groups={[
        {
          enter: [0.08, 0.18],
          hold: [0.18, 0.35],
          paragraphs: [
            {
              sentences: [
                "For thousands of years, Indigenous communities across California lived in relationship with water’s natural cycles.",
                "Tribes adapted to seasonal variability, moving across their territories to follow abundant plants, fish, and wildlife, and developing sophisticated practices for sustainably harvesting salmon and farming in arid regions.",
              ],
            },
          ],
        },
        {
          enter: [0.28, 0.42],
          hold: [0.42, 0.62],
          paragraphs: [
            {
              sentences: [
                "Water was managed collectively and locally, guided by ecological knowledge, cultural values, and long-term stewardship.",
              ],
            },
            {
              sentences: [
                "Together, these approaches reflected a way of living in which people, water, plants, and animals are deeply connected and cared for in a relationship.",
                "They emphasized shared access, balance, and sustainability, rather than ownership or exclusive control.",
              ],
            },
          ],
        },
        {
          enter: [0.52, 0.68],
          hold: [0.68, 0.88],
          paragraphs: [
            {
              sentences: [
                "This relationship with water was dramatically disrupted with the arrival of European settlers.",
                "Their systems, laws, and values reshaped California’s landscapes and set inequities in motion.",
              ],
            },
          ],
        },
      ]}
    />
  )
}