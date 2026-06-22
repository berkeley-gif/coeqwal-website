"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function ClimateResilience() {
  return (
    <NarrativeFrameSection
      id="frame-5"
      ariaLabel="Climate change and resilience"
      height="280vh"
      title={"How inequity persists under climate change"}
      groups={[
        {
          enter: [0.08, 0.18],
          hold: [0.18, 0.36],
          paragraphs: [
            {
              sentences: [
                "Over time, the worldviews, rights, and values of the people of California have changed.",
                "Environmental protections such as the Endangered Species Act and Clean Water Act, recognition of the human right to water, and implementation of the Sustainable Groundwater Management Act all represent meaningful progress toward a more equitable water management system.",
              ],
            },
          ],
        },
        {
          enter: [0.3, 0.46],
          hold: [0.46, 0.68],
          paragraphs: [
            {
              sentences: [
                "Yet inequities remain embedded in our institutions, infrastructure, and water-allocation decisions.",
                "Water rights, contracts, and operational rules lock us into historical values that do not reflect those of present-day society.",
              ],
            },
          ],
        },
        {
          enter: [0.54, 0.7],
          hold: [0.7, 0.9],
          paragraphs: [
            {
              sentences: [
                "As climate change disrupts our water system, bringing more intense droughts and floods, the most vulnerable are likely to bear the burden.",
              ],
            },
            {
              sentences: [
                "As conditions in headwaters, tributaries, and rivers become more variable, these stresses ripple through the system, often intensifying inequities downstream.",
                "Some communities and sectors are buffered by infrastructure, contracts, or senior rights.",
                "Others, often Tribes, rural communities, and ecosystems, face repeated crises.",
                "Water is rarely sufficient to meet every need at once.",
                "The central question is not whether trade-offs exist, but why the same groups so often bear the costs.",
              ],
            },
          ],
        },
      ]}
    />
  )
}