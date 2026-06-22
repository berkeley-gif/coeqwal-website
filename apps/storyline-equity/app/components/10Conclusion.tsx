"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function Conclusion() {
  return (
    <NarrativeFrameSection
      id="frame-9"
      ariaLabel="Putting equity into practice"
      height="240vh"
      title={"Putting equity into practice"}
      groups={[
        {
          enter: [0.08, 0.18],
          hold: [0.18, 0.36],
          paragraphs: [
            {
              sentences: [
                "COEQWAL is a platform that brings a distributional equity lens to real-world water decisions.",
                "Making trade-offs visible through a shared framework, it gives communities, Tribes, and decision-makers a clearer understanding of who benefits, who is strained, and what alternatives exist.",
                "COEQWAL creates a transparent, shared space where choices can be weighed using the same evidence.",
              ],
            },
          ],
        },
        {
          enter: [0.3, 0.48],
          hold: [0.48, 0.78],
          paragraphs: [
            {
              sentences: [
                "By translating complex model outputs into clear, comparable tiers, COEQWAL provides a shared language for understanding impacts, evaluating trade-offs, and advocating for more equitable water futures.",
                "When the impacts on Tribes, rural communities, and ecosystems become visible, their needs can move from the margins to the center of decision-making.",
                "With COEQWAL, users can carry clear, credible insights into hearings, planning meetings, and negotiations, advocating for water futures that are not only resilient but also fairer and more just.",
              ],
            },
          ],
        },
      ]}
    />
  )
}