"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function Resolution() {
  return (
    <NarrativeFrameSection
      id="frame-7"
      ariaLabel="How COEQWAL addresses equity"
      height="260vh"
      title={"How COEQWAL addresses equity"}
      groups={[
        {
          enter: [0.08, 0.18],
          hold: [0.18, 0.36],
          paragraphs: [
            {
              sentences: [
                "So far, we’ve looked at how inequity in California water have developed over time.",
                "While COEQWAL cannot undo historical inequities, it can make them visible, clarify their impacts, and support more informed and equitable decisions moving forward.",
              ],
            },
          ],
        },
        {
          enter: [0.3, 0.46],
          hold: [0.46, 0.66],
          paragraphs: [
            {
              sentences: [
                "Another challenge is that researchers often evaluate impacts on different communities in different ways, using measures like flows, agricultural productivity, salinity, and species populations.",
                "Because these are so different, it can be difficult to compare them, understand trade-offs, or see how impacts are distributed across people and ecosystems.",
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
                "COEQWAL was created to respond to these challenges.",
                "It is a platform and process designed to make California’s water trade-offs visible, comparable, and accessible.",
              ],
            },
            {
              sentences: [
                "Trade-offs are unavoidable in water management, and balancing the needs of all is not easy, but impacts do not have to fall hardest on the same groups.",
                "COEQWAL helps make those trade-offs visible as decisions are considered.",
              ],
            },
          ],
        },
      ]}
    />
  )
}