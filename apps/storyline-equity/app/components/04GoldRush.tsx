"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function GoldRush() {
  return (
    <NarrativeFrameSection
      id="frame-3"
      ariaLabel="Gold Rush water rights and inequity"
      height="300vh"
      title={"How inequity started"}
      groups={[
        {
          enter: [0.08, 0.38],
          hold: [0.38, 0.58],
          paragraphs: [
            {
              sentences: [
                "The mid-19th century marked a turning point in California’s water history.",
                "During the Gold Rush, European settlers introduced new legal and political systems that fundamentally redefined who could access land and water.",
              ],
            },
            {
              sentences: [
                "The 1850 Act for the Government and Protection of Indians instituted forced removal, cultural suppression, and the large-scale dispossession of Indigenous lands and waters.",
                "At the same time, settlers established their own system of water rights.",
              ],
            },
            {
              sentences: [
                "Indigenous water needs and practices were not recognized under these laws.",
                "Only white men could claim and hold water rights.",
              ],
            }
          ],
        },
        {
          enter: [0.44, 0.68],
          hold: [0.68, 0.92],
          paragraphs: [
            {
              sentences: [
                "This period established a lasting hierarchy of ‘legitimate’ water users.",
                "Today’s water rights reflect values and priorities of the Gold Rush: rapid resource extraction, expansion of agriculture, and maximizing out-of-stream water use to support settlement and economic growth, primarily for white landowners.",
                "Systems of exclusion and racism continue to deny Indigenous communities and others equal rights, recognition, and access to water.",
                "While these priorities drove development, they locked in patterns of water allocation that have been difficult to change, even as societal values and understandings of equity have evolved.",
              ],
            },
          ],
        },
      ]}
    />
  )
}