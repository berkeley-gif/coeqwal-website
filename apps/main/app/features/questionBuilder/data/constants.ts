export const OPERATION_THEMES = [
  {
    id: "sgma",
    title: "Theme 1: Sustainable Groundwater Management Act (SGMA) compliance",
    options: [
      "Groundwater pumping limits in the San Joaquin valley",
      "Modified crop mix statewide",
      "Reduced crop acreage in the San Joaquin valley",
      "Combinations of modified/reduced crop acreage with groundwater pumping",
      "Increased Sacramento basin pumping",
    ],
  },
  {
    id: "flows",
    title: "Theme 2: Changing flow regimes in Central Valley rivers",
    options: [
      {
        id: "removing-flow-reqs",
        label: "Removing tributary flow requirements",
        subtypes: [
          { id: "sjr-flow-reqs", label: "San Joaquin River" },
          { id: "sac-flow-reqs", label: "Sacramento River" },
        ],
      },
      "Functional flows based on a seasonal water budget",
      "Supporting a Sacramento River salmon flow scenario",
      "Alt 3",
    ],
  },
  {
    id: "drinking-water",
    title: "Theme 3: Prioritizing drinking water availability",
    options: [
      "Meeting critical needs in vulnerable communities",
      "Meeting functional thresholds in vulnerable communities",
      "Prioritizing drinking water in vulnerable communities",
    ],
  },
  {
    id: "regulations",
    title: "Theme 4: Alternatives to current regulations",
    options: [
      "Relaxing Delta salinity requirements",
      "Relaxing Delta outflow requirements",
      "Relaxing Shasta reservoir carryover requirements",
      "Relaxing Old and Middle River (Sacramento basin) requirements",
    ],
  },
  {
    id: "infrastructure",
    title: "Theme 5: Infrastructure",
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
