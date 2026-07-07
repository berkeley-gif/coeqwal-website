// =============================================================================
// Story type
// =============================================================================

export interface Story {
  /** Stable identifier (e.g. "delta") */
  id: string
  /** Display label, may contain \n for line-breaks in circle layouts */
  label: string
  /** One-sentence description of what this theme covers */
  description: string
  /** Link */
  href: string
  /** Whether it's dimmed */
  dimmed: boolean
}

export const WATER_STORIES: Story[] = [
  {
    id: "how-water-moves-through-california",
    label: "How water moves through California",
    description: "How water moves through California a longer description goes here",
    href: "https://flow.coeqwal.org",
    dimmed: false
  },
  {
    id: "how-climate-change-affects-California-water",
    label: "How climate change affects California water",
    description: "How climate change affects California water a longer description goes here",
    href: "https://climate.coeqwal.org",
    dimmed: false
  },
  {
    id: "how-water-is-managed-in-california",
    label: "How water is managed in California",
    description: "How water is managed in California a longer description goes here",
    href: "",
    dimmed: true
  },
  {
    id: "how-equity-shapes-California-water",
    label: "How equity shapes California water",
    description: "How equity shapes California water a longer description goes here",
    href: "",
    dimmed: true
  },
]