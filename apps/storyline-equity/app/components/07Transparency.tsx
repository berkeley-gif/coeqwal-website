"use client"

import NarrativeFrameSection from "./helpers/narrativeFrame"

export default function Transparency() {
  return (
    <NarrativeFrameSection
      id="frame-6"
      ariaLabel="Why transparency matters"
      height="320vh"
      title={"Why transparency matters"}
      groups={[
        {
          enter: [0.08, 0.18],
          hold: [0.18, 0.36],
          paragraphs: [
            {
              sentences: [
                "Today, water managers rely on complex technical models, such as CalSim, to guide allocation decisions.",
                "These tools are powerful, but they are also highly technical and difficult for non-experts to interpret.",
              ],
            },
          ],
        },
        {
          enter: [0.3, 0.46],
          hold: [0.46, 0.64],
          paragraphs: [
            {
              sentences: [
                "As a result, many communities cannot easily see how decisions are made, what assumptions shape outcomes, or whose priorities are embedded in the models.",
                "For example, a rule that allows more water to be diverted during dry periods may increase supplies for farms and cities, while reducing river flows needed for fish and ecosystems.",
              ],
            },
          ],
        },
        {
          enter: [0.52, 0.68],
          hold: [0.68, 0.84],
          paragraphs: [
            {
              sentences: [
                "It also becomes difficult to understand how conditions differ across the system, from upstream sources to downstream communities and ecosystems.",
              ],
            },
            {
              sentences: [
                "Without transparency, communities are marginalized from planning and negotiation.",
                "Their needs, values, and vulnerabilities remain invisible, even as decisions directly affect their water security.",
              ],
            },
          ],
        },
        {
          enter: [0.74, 0.88],
          hold: [0.88, 0.98],
          paragraphs: [
            {
              sentences: [
                "Understanding California’s water system, both historically and technically, is essential for building a future that is resilient, fair, and shared.",
              ],
            },
          ],
        },
      ]}
    />
  )
}