// Define the card type
export interface LearnCardType {
  title: string
  content: string
  image?: string
  type: "resource" | "article" | "video"
}

// Learn cards data
export const learnCards: LearnCardType[] = [
  {
    title: "How water moves through California",
    content:
      "Most of California's water falls as rain and snow. This precipitation is highly variable both across the state and from year to year.",
    image: "/images/DBK_Yuba_River_aerials_0346_05_14_2009.jpg",
    type: "resource",
  },
  {
    title: "How California's water is managed",
    content:
      "An introduction to the complex water infrastructure across the state.",
    image: "/images/DWR_2023_05_12_ZZ_0008_Aqueduct_Split.jpg",
    type: "article",
  },
  {
    title: "Climate change and California water",
    content:
      "Learn about the impacts of climate change on the future of California water.",
    image: "/images/DWR_2024_04_11_AN_0010_Orchard_Rip_Groundwater_DRONE.jpg",
    type: "video",
  },
  {
    title: "Equity in California water",
    content:
      "An overview of key water policies and regulations shaping water management decisions.",
    type: "resource",
  },
]

// Sample scenario cards data
export const scenarioCards: LearnCardType[] = [
  {
    title: "Current Operations",
    content: "Lorem ipsum",
    image: "/images/DWR_2023_05_12_ZZ_0008_Aqueduct_Split.jpg",
    type: "resource",
  },
  {
    title: "What if we limit groundwater pumping?",
    content: "Lorem ipsum",
    image: "/images/DWR_2024_04_11_AN_0010_Orchard_Rip_Groundwater_DRONE.jpg",
    type: "article",
  },
  {
    title: "What if we changed how water flows in our streams?",
    content: "Lorem ipsum",
    image: "/images/DBK_Yuba_River_aerials_0346_05_14_2009.jpg",
    type: "resource",
  },
  {
    title: "What if we prioritized drinking water?",
    content: "Lorem ipsum",
    type: "video",
  },
]

// Operation ID mappings for scenario cards
export const operationMappings = [
  "delta-operations",
  "climate-change",
  "water-storage",
  "groundwater",
]

// Section mappings for learn cards
export const sectionMappings = [
  "california-water",
  "delta-operations",
  "groundwater",
  "water-policy",
]
