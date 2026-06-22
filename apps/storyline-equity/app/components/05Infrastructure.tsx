"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function Infrastructure() {
  return (
    <NarrativeFrameSection
      id="frame-4"
      ariaLabel="Institutions and infrastructure shaped inequity"
      height="280vh"
      title={"How infrastructure shaped inequity"}
      groups={[
        {
          enter: [0.08, 0.18],
          hold: [0.18, 0.38],
          paragraphs: [
            {
              sentences: [
                "In the 20th century, California’s massive investments in water infrastructure reinforced inequities.",
                "Large-scale projects such as the Central Valley Project and the State Water Project transformed rivers into highly engineered systems designed to store and deliver water.",
              ],
            },
            {
              sentences: [
                "These dams, reservoirs, and canals expanded water supplies for agricultural water districts and growing cities, fueling economic growth and population expansion.",
                "Over time, these systems reshaped how water flows through the landscape, redirecting rivers, interrupting natural pathways, and prioritizing some uses over others.",
              ],
            },
          ],
        },
        {
          enter: [0.34, 0.48],
          hold: [0.48, 0.66],
          paragraphs: [
            {
              sentences: [
                "But these systems further preserved and intensified inequities in water access.",
                "Senior water-rights holders, largely large farms and landowners, were guaranteed supplies.",
                "Meanwhile, many Tribes, small rural communities, and disadvantaged areas were left behind.",
              ],
            },
          ],
        },
        {
          enter: [0.56, 0.72],
          hold: [0.72, 0.92],
          paragraphs: [
            {
              sentences: [
                "The environmental costs were also largely overlooked.",
                "Dams blocked more than 95% of the historical habitat used by salmon.",
                "Rivers were dewatered and fragmented.",
                "California’s freshwater ecosystems have suffered from degradation of water quality, loss of wetlands, fish population declines, and the extinction of species.",
              ],
            },
          ],
        },
      ]}
    />
  )
}