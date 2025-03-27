import React, { createContext, useContext, useState, useEffect } from "react"

// Interface for the JSON data
interface Properties {
  OBJECTID: string
  Riv_Mi: string
  Riv_Name: string
  Comment: string
  WaterSource: string
  Nrest_Gage: string
  Strm_Code: string
  RM_II_Assigned: string
  HR: string
  NodeDescription: string
  "node-code": string
}

interface VariablesRoles {
  "RIVER-SEEPAGE": string
  CHANNEL: string
  UNDEFINED: string
  "STREAM-STAGE": string
  "GW-ELEV": string
  "STREAM-GAIN": string
  SPILL: string
}

interface Stories {
  FLOW: Record<string, string>
  GROUNDWATER: Record<string, string>
}

interface RawNodeItem {
  id: string
  coordinates: [string, string]
  properties: Properties
  variables_roles: VariablesRoles
  stories: Stories
}

// Interface for the processed data
interface NodeItem {
  id: string
  coordinates: [number, number] // Coordinates as numbers
  properties: Properties // Use the specific Properties interface
  variables_roles: VariablesRoles // Use the specific VariablesRoles interface
  stories: Stories // Use the specific Stories interface
}

const DataContext = createContext<NodeItem[]>([])

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<NodeItem[]>([])

  useEffect(() => {
    fetch("/data/nodes_stories.json")
      .then((response) => response.json())
      .then((jsonData: RawNodeItem[]) => {
        const nodeArray = jsonData.map((item) => ({
          id: item.id,
          coordinates: [
            parseFloat(item.coordinates[0]),
            parseFloat(item.coordinates[1]),
          ] as [number, number],
          properties: item.properties,
          variables_roles: item.variables_roles,
          stories: item.stories,
        }))
        console.log("Fetched data:", nodeArray)
        setData(nodeArray)
      })
      .catch((error) => console.error("Error loading JSON data:", error))
  }, [])

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
