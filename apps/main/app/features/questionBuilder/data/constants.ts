export const CANONICAL_OUTCOME_TYPES = [
  { id: "deliveries", label: "deliveries", labelEs: "entregas" },
  {
    id: "deliveries_agricultural",
    label: "agricultural deliveries",
    labelEs: "entregas agrícolas",
  },
  {
    id: "deliveries_urban",
    label: "municipal deliveries",
    labelEs: "entregas municipales",
  },
  {
    id: "deliveries_refuge",
    label: "managed wetland deliveries",
    labelEs: "entregas para humedales gestionados",
  },
  { id: "storage", label: "storage", labelEs: "almacenamiento" },
  { id: "channel_flows", label: "channel flows", labelEs: "flujos de canal" },
  { id: "streamflow", label: "streamflow", labelEs: "caudal" },
  {
    id: "Delta outflow",
    label: "Delta outflow",
    labelEs: "flujo de salida del Delta",
  },
  {
    id: "Delta salinity",
    label: "Delta salinity",
    labelEs: "salinidad del Delta",
  },
  {
    id: "groundwater_levels",
    label: "groundwater levels",
    labelEs: "niveles de agua subterránea",
  },
  {
    id: "deep_percolation",
    label: "deep percolation",
    labelEs: "percolación profunda",
  },
  {
    id: "groundwater_pumping",
    label: "groundwater pumping",
    labelEs: "bombeo de agua subterránea",
  },
  {
    id: "groundwater_pumping_agricultural",
    label: "agricultural groundwater pumping",
    labelEs: "bombeo agrícola de agua subterránea",
  },
  {
    id: "groundwater_pumping_urban",
    label: "urban groundwater pumping",
    labelEs: "bombeo urbano de agua subterránea",
  },
  { id: "shortage", label: "shortage", labelEs: "escasez" },
]

export const CANONICAL_REGIONS = [
  {
    id: "Sacramento Valley",
    label: "Sacramento Valley",
    labelEs: "Valle de Sacramento",
  },
  { id: "Delta", label: "Delta", labelEs: "Delta" },
  {
    id: "San Joaquin Valley",
    label: "San Joaquin Valley",
    labelEs: "Valle de San Joaquín",
  },
]

export const CANONICAL_CLIMATE_OPTIONS = [
  {
    id: "hist_adj",
    label: "current conditions",
    labelEs: "condiciones actuales",
  },
  {
    id: "cc50",
    label: "moderate change: +1.5°C warming, 3% less rain",
    labelEs: "cambio moderado: +1.5°C de calentamiento, 3% menos lluvia",
  },
  {
    id: "cc95",
    label: "severe change: +1.8°C warming, 9% less rain",
    labelEs: "cambio severo: +1.8°C de calentamiento, 9% menos lluvia",
  },
]

export const OPERATION_THEMES = [
  {
    id: "baseline",
    title: "Current operations and emerging policies",
    titleEs: "Operaciones actuales y políticas emergentes",
    options: [
      {
        id: "current-operations",
        label: "Current operations",
        labelEs: "Operaciones actuales",
        shortText: "current operations",
        shortTextEs: "operaciones actuales",
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
        labelEs:
          "Operaciones actuales con Peticiones de Cambio Urgente Temporal (TUCPs)",
        shortText: "TUCPs",
        shortTextEs: "TUCPs",
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
        labelEs:
          "Limitación del bombeo de agua subterránea en el valle de San Joaquín (cumplimiento de SGMA)",
        shortText: "SGMA compliance",
        shortTextEs: "cumplimiento de SGMA",
        isSingular: true,
        active: true,
        compatibleWith: {
          outcomeTypes: CANONICAL_OUTCOME_TYPES.map((type) => type.id),
          regions: CANONICAL_REGIONS.map((region) => region.id),
          climateOptions: ["hist_adj"],
        },
      },
      {
        id: "tucp-sgma-operations",
        label: "Current operations with TUCPs and SGMA",
        labelEs: "Operaciones actuales con TUCPs y SGMA",
        shortText: "TUCPs and SGMA",
        shortTextEs: "TUCPs y SGMA",
        isSingular: false,
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
    titleEs: "Cambio de flujos en los ríos del Valle Central",
    options: [
      {
        id: "increased-flows-alt1",
        label:
          "Increasing flows in tributaries and Delta outflow (Alternative 1)",
        labelEs:
          "Aumento de flujos en afluentes y flujo de salida del Delta (Alternativa 1)",
        shortText: "increasing flows",
        shortTextEs: "flujos aumentados",
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
    titleEs: "Priorización del agua potable",
    options: [
      {
        id: "critical-needs",
        label: "Meeting critical needs in vulnerable communities",
        labelEs: "Satisfacer necesidades críticas en comunidades vulnerables",
        shortText: "critical needs",
        shortTextEs: "necesidades críticas",
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
        labelEs: "Cumplir umbrales funcionales en comunidades vulnerables",
        shortText: "func. thresholds",
        shortTextEs: "umbrales func.",
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
        labelEs: "Priorizar el agua potable en comunidades vulnerables",
        shortText: "drinking priority",
        shortTextEs: "prioridad de agua potable",
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
    titleEs: "Alternativas de regulación",
    options: [
      {
        id: "relax-salinity",
        label: "Relaxing Delta salinity requirements",
        labelEs: "Relajar los requisitos de salinidad del Delta",
        shortText: "salinity reqs",
        shortTextEs: "requisitos de salinidad",
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
        labelEs: "Relajar los requisitos de flujo de salida del Delta",
        shortText: "outflow reqs",
        shortTextEs: "requisitos de flujo",
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
        labelEs: "Relajar los requisitos de reserva del embalse de Shasta",
        shortText: "Shasta carryover",
        shortTextEs: "reserva de Shasta",
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
        labelEs:
          "Relajar los requisitos de Old y Middle River (cuenca del Sacramento)",
        shortText: "OMR reqs",
        shortTextEs: "requisitos de OMR",
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
    titleEs: "Cambio de infraestructura",
    options: [
      {
        id: "delta-conveyance",
        label: "Delta conveyance tunnel",
        labelEs: "Túnel de transporte del Delta",
        shortText: "conveyance tunnel",
        shortTextEs: "túnel de transporte",
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
            labelEs: "3000cfs",
            shortText: "3000cfs tunnel",
            shortTextEs: "túnel de 3000cfs",
            isSingular: true,
            active: false,
          },
          {
            id: "dct-4500cfs",
            label: "4500cfs",
            labelEs: "4500cfs",
            shortText: "4500cfs tunnel",
            shortTextEs: "túnel de 4500cfs",
            isSingular: true,
            active: false,
          },
          {
            id: "dct-6000cfs",
            label: "6000cfs",
            labelEs: "6000cfs",
            shortText: "6000cfs tunnel",
            shortTextEs: "túnel de 6000cfs",
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
    titleEs: "Por tipo",
    options: [
      {
        id: "reservoir_storage",
        label: "Reservoir storage",
        labelEs: "Suministro y almacenamiento",
        shortText: "reservoir storage",
        shortTextEs: "suministro & almacenamiento",
      },
      {
        id: "delta_ecosystem",
        label: "Delta ecosystem",
        labelEs: "Salud del Delta",
        shortText: "Delta ecosystem",
        shortTextEs: "salud del Delta",
      },
      {
        id: "delivery_reliability",
        label: "Water delivery reliability",
        labelEs: "Fiabilidad de entrega",
        shortText: "water delivery reliability",
        shortTextEs: "fiabilidad",
      },
      {
        id: "equity",
        label: "Equity",
        labelEs: "Equidad",
        shortText: "equity",
        shortTextEs: "equidad",
      },
      {
        id: "stream_flows",
        label: "Stream flows",
        labelEs: "Flujos",
        shortText: "stream flows",
        shortTextEs: "flujos",
      },
      {
        id: "groundwater",
        label: "Groundwater levels",
        labelEs: "Agua subterránea",
        shortText: "groundwater levels",
        shortTextEs: "agua subterránea",
      },
    ],
  },
  {
    id: "region",
    title: "By region",
    titleEs: "Por región",
    options: [...CANONICAL_REGIONS],
    hasMap: true,
  },
]

export const CLIMATE_OPTIONS = [...CANONICAL_CLIMATE_OPTIONS]
