export const CANONICAL_OUTCOME_TYPES = [
  { id: "deliveries", label: "deliveries" },
  { id: "deliveries_agricultural", label: "agricultural deliveries" },
  { id: "deliveries_urban", label: "municipal deliveries" },
  { id: "deliveries_refuge", label: "managed wetland deliveries" },
  { id: "storage", label: "storage" },
  { id: "channel_flows", label: "channel flows" },
  { id: "streamflow", label: "streamflow" },
  { id: "Delta outflow", label: "Delta outflow" },
  { id: "Delta salinity", label: "Delta salinity" },
  { id: "groundwater_levels", label: "groundwater levels" },
  { id: "deep_percolation", label: "deep percolation" },
  { id: "groundwater_pumping", label: "groundwater pumping" },
  {
    id: "groundwater_pumping_agricultural",
    label: "agricultural groundwater pumping",
  },
  { id: "groundwater_pumping_urban", label: "urban groundwater pumping" },
  { id: "shortage", label: "shortage" },
]

export const CANONICAL_REGIONS = [
  { id: "Sacramento Valley", label: "Sacramento Valley" },
  { id: "Delta", label: "Delta" },
  { id: "San Joaquin Valley", label: "San Joaquin Valley" },
]

export const CANONICAL_CLIMATE_OPTIONS = [
  { id: "hist_adj", label: "current conditions" },
  { id: "cc50", label: "moderately hotter and dryer future" },
  { id: "cc95", label: "severely hotter and dryer future" },
]

export const OPERATION_THEMES = [
  {
    id: "baseline",
    title: "Current operations and emerging policies",
    options: [
      {
        id: "current-operations",
        label: "Current operations",
        shortText: "current operations",
        isSingular: false,
        active: true,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj", "cc50", "cc95"],
        },
      },
      {
        id: "tucp-operations",
        label:
          "Current operations with Temporary Urgent Change Petitions (TUCPs)",
        shortText: "TUCPs",
        isSingular: false,
        active: true,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
      {
        id: "sgma-compliance",
        label:
          "Limiting groundwater pumping in the San Joaquin valley (SGMA compliance)",
        shortText: "SGMA compliance",
        isSingular: true,
        active: true,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
    ],
  },
  {
    id: "flows",
    title: "Changing flows in Central Valley rivers",
    options: [
      {
        id: "increased-flows-alt1",
        label:
          "Increasing flows in tributaries and Delta outflow (Alternative 1)",
        shortText: "increased flows",
        isSingular: true,
        active: true,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
    ],
  },
  {
    id: "drinking-water",
    title: "Prioritizing drinking water",
    options: [
      {
        id: "critical-needs",
        label: "Meeting critical needs in vulnerable communities",
        shortText: "critical needs",
        isSingular: true,
        active: false,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
      {
        id: "functional-thresholds",
        label: "Meeting functional thresholds in vulnerable communities",
        shortText: "func. thresholds",
        isSingular: false,
        active: false,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
      {
        id: "drinking-water-priority",
        label: "Prioritizing drinking water in vulnerable communities",
        shortText: "drinking priority",
        isSingular: true,
        active: false,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
    ],
  },
  {
    id: "regulations",
    title: "Regulation alternatives",
    options: [
      {
        id: "relax-salinity",
        label: "Relaxing Delta salinity requirements",
        shortText: "salinity reqs",
        isSingular: true,
        active: false,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
      {
        id: "relax-outflow",
        label: "Relaxing Delta outflow requirements",
        shortText: "outflow reqs",
        isSingular: true,
        active: false,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
      {
        id: "relax-shasta-carryover",
        label: "Relaxing Shasta reservoir carryover requirements",
        shortText: "Shasta carryover",
        isSingular: true,
        active: false,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
      {
        id: "relax-omr",
        label: "Relaxing Old and Middle River (Sacramento basin) requirements",
        shortText: "OMR reqs",
        isSingular: true,
        active: false,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
    ],
  },
  {
    id: "infrastructure",
    title: "Changing infrastructure",
    options: [
      {
        id: "delta-conveyance",
        label: "Delta conveyance tunnel",
        shortText: "conveyance tunnel",
        isSingular: true,
        active: false,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj", "cc50", "cc95"],
        },
        subtypes: [
          {
            id: "dct-3000cfs",
            label: "3000cfs",
            shortText: "3000cfs tunnel",
            isSingular: true,
            active: false,
          },
          {
            id: "dct-4500cfs",
            label: "4500cfs",
            shortText: "4500cfs tunnel",
            isSingular: true,
            active: false,
          },
          {
            id: "dct-6000cfs",
            label: "6000cfs",
            shortText: "6000cfs tunnel",
            isSingular: true,
            active: false,
          },
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
          { id: "deliveries_agricultural", label: "agricultural" },
          { id: "deliveries_urban", label: "municipal" },
          { id: "deliveries_refuge", label: "managed wetland" },
        ],
      },
      ...CANONICAL_OUTCOME_TYPES.filter(
        (outcome) =>
          ![
            "deliveries",
            "deliveries_agricultural",
            "deliveries_urban",
            "deliveries_refuge",
          ].includes(outcome.id),
      ),
    ],
  },
  {
    id: "region",
    title: "By region",
    options: [...CANONICAL_REGIONS],
    hasMap: true,
  },
  {
    id: "metric",
    title: "By metric",
    options: [
      { id: "Needs-based equity", label: "Needs-based equity" },
      { id: "Burden-sharing equity", label: "Burden-sharing equity" },
      { id: "Economic burden", label: "Economic burden" },
      { id: "Drinking water shortages", label: "Drinking water shortages" },
      { id: "Supply ratio", label: "Supply ratio" },
      {
        id: "Probability of Winter run Chinook salmon quasi-extinction",
        label: "Probability of Winter run Chinook salmon quasi-extinction",
      },
      {
        id: "Probability of achieving the doubling goal",
        label: "Probability of achieving the doubling goal",
      },
      {
        id: "Percent change in Winter run Chinook salmon spawner abundance",
        label: "Percent change in Winter run Chinook salmon spawner abundance",
      },
      {
        id: "Net present value of production",
        label: "Net present value of production",
      },
    ],
  },
]

export const CLIMATE_OPTIONS = [...CANONICAL_CLIMATE_OPTIONS]
