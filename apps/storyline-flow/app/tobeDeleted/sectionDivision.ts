export const DIVISION = [
  {
    name: "California's Water",
    sections: ["opener", "precipitation", "variability", "snowpack"],
  },
  {
    name: "Natural Water Flow",
    sections: ["flow", "valley", "wetland", "delta", "transition"],
  },
  {
    name: "Humans",
    sections: ["goldrush", "irrigation", "drinking"],
  },
  {
    name: "Water Transformation",
    sections: ["transformation", "city", "agriculture", "economy"],
  },
  {
    name: "What Has Happened?",
    sections: [
      "turning",
      "impact-salmon",
      "impact-delta",
      "impact-groundwater",
      "impact-water",
      "impact-climate",
      "resolution",
      "tension",
    ],
  },
]

export const PRELOAD_MAP: Record<string, string[]> = {
  opener: ["precipitation", "variability"],
  precipitation: ["opener", "variability", "snowpack"],
  variability: ["precipitation", "snowpack"],
  snowpack: ["precipitation", "flow", "valley"],
  flow: ["snowpack", "valley", "delta"],
  valley: ["flow", "delta", "transition"],
  delta: ["flow", "valley", "transition", "goldrush"],
  transition: ["delta", "goldrush", "irrigation"],
  goldrush: ["transition", "irrigation", "drinking"],
  irrigation: ["goldrush", "drinking"],
  drinking: ["goldrush", "irrigation", "transformation"],
  transformation: ["drinking", "city", "agriculture", "economy"],
  city: ["transformation", "agriculture", "economy"],
  agriculture: ["transformation", "city", "economy"],
  economy: ["transformation", "city", "agriculture", "impact-salmon"],
  "impact-salmon": ["economy", "impact-delta", "impact-groundwater"],
  "impact-delta": ["economy", "impact-salmon", "impact-groundwater"],
  "impact-groundwater": [
    "impact-groundwater",
    "impact-water",
    "impact-climate",
  ],
  "impact-water": ["impact-groundwater", "impact-climate", "conclusion"],
}
