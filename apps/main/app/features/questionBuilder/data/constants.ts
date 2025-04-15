export const OPERATION_THEMES = [
  {
    id: "baseline",
    title: "Current operations and emerging policies",
    options: [
      "Current operations",
      "Current operations with Temporary Urgent Change Petitions (TUCPs)",
      "Limiting groundwater pumping in the San Joaquin valley (SGMA compliance)",
    ],
  },
  {
    id: "flows",
    title: "Changing flows in Central Valley rivers",
    options: [
      "Increasing flows in tributaries and Delta outflow (Alternative 1)",
    ],
  },
  {
    id: "drinking-water",
    title: "Prioritizing drinking water",
    options: [
      "Meeting critical needs in vulnerable communities",
      "Meeting functional thresholds in vulnerable communities",
      "Prioritizing drinking water in vulnerable communities",
    ],
  },
  {
    id: "regulations",
    title: "Regulation alternatives",
    options: [
      "Relaxing Delta salinity requirements",
      "Relaxing Delta outflow requirements",
      "Relaxing Shasta reservoir carryover requirements",
      "Relaxing Old and Middle River (Sacramento basin) requirements",
    ],
  },
  {
    id: "infrastructure",
    title: "Changing infrastructure",
    options: [
      {
        id: "delta-conveyance",
        label: "Delta conveyance tunnel",
        subtypes: [
          { id: "dct-3000cfs", label: "3000cfs" },
          { id: "dct-4500cfs", label: "4500cfs" },
          { id: "dct-6000cfs", label: "6000cfs" },
        ],
      },
    ],
  },
]

export const OUTCOME_CATEGORIES = [
  {
    id: "type",
    title: "By type",
    options: [
      {
        id: "deliveries",
        label: "deliveries",
        subtypes: [
          { id: "agricultural-deliveries", label: "agricultural" },
          { id: "municipal-deliveries", label: "municipal" },
          { id: "wetland-deliveries", label: "managed wetland" },
        ],
      },
      "flows",
      "Delta outflow",
      "storage",
      "groundwater levels",
    ],
  },
  {
    id: "region",
    title: "By region",
    options: [
      "Sacramento Valley",
      "Delta",
      "San Joaquin Valley",
      "Southern California",
      "Coastal regions",
      "All regions",
    ],
    hasMap: true,
  },
  {
    id: "metric",
    title: "By metric",
    options: [
      "Needs-based equity",
      "Burden-sharing equity",
      "Economic burden",
      "Drinking water shortages",
      "Supply ratio",
      "Probability of Winter run Chinook salmon quasi-extinction",
      "Probability of achieving the doubling goal",
      "Percent change in Winter run Chinook salmon spawner abundance",
      "Net present value of production",
    ],
  },
]

export const CLIMATE_OPTIONS = [
  "current conditions",
  "a hotter and dryer future climate",
  "highly variable future climate conditions",
]
