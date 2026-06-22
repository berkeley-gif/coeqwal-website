"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function Background() {
  return (
    <NarrativeFrameSection
      id="frame-1"
      ariaLabel="California water system introduction"
      height="260vh"
      title={"How California’s water system flows"}
      groups={[
        {
          enter: [0.08, 0.18],
          hold: [0.18, 0.38],
          paragraphs: [
            {
              sentences: [
                "California’s water begins in the mountain headwaters, flows through rivers and tributaries, and moves downstream toward the ocean.",
                "Along the way, dams, reservoirs, canals, and pumps store, redirect, and deliver water across the state.",
              ],
            },
          ],
        },
        {
          enter: [0.32, 0.42],
          hold: [0.42, 0.72],
          paragraphs: [
            {
              sentences: [
                "Everyone depends on this system.",
                "Agriculture relies on water for crops.",
                "Cities depend on it for drinking and commercial uses.",
                "Rivers, wetlands, and fish need sufficient flows to function and thrive.",
                "People also depend on the health of our rivers for cultural practices, subsistence fishing, recreation, and access to clean water.",
              ],
            },
            {
              sentences: [
                "Laws and regulations determine how water is shared, how much is diverted to farms and cities, how much remains in rivers, who receives water first, and who bears the greatest impacts during shortages.",
              ],
            },
            {
              sentences: [
                "Yet the benefits of this system are not shared equally.",
                "Some water users have reliable access year after year, while others face chronic shortages or degraded water quality.",
              ],
            },
            {
              sentences: [
                "To understand water equity in California today, it’s important to recognize that these inequities are deeply rooted in the state’s history.",
              ],
            },
          ],
        },
      ]}
    />
  )
}