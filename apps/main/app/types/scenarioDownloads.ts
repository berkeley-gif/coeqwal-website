// Types for scenario file downloads and API responses

export interface ScenarioFile {
  key: string
  filename: string
}

export interface ScenarioFiles {
  zip?: ScenarioFile | null
  output_csv?: ScenarioFile | null
  sv_csv?: ScenarioFile | null
}

export interface Scenario {
  scenario_id: string
  files: ScenarioFiles
}

export interface ScenariosResponse {
  scenarios: Scenario[]
}
