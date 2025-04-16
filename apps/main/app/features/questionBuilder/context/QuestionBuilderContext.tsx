"use client"

import React, { createContext, useReducer, useContext, ReactNode } from "react"
import { CLIMATE_OPTIONS } from "../data/constants"

// Define the state interface
export interface QuestionBuilderState {
  swapped: boolean
  includeClimate: boolean
  selectedClimate: string
  selectedOperations: string[]
  operationDirections: Record<string, "increase" | "decrease">
  selectedOutcomes: string[]
  outcomesBySection: Record<string, string[]>
  showMap: boolean
}

// Define actions
type Action =
  | { type: "TOGGLE_CLIMATE" }
  | { type: "TOGGLE_SWAP" }
  | { type: "TOGGLE_MAP" }
  | { type: "SET_CLIMATE"; payload: string }
  | { type: "SELECT_OPERATION"; payload: string }
  | { type: "DESELECT_OPERATION"; payload: string }
  | {
      type: "SET_OPERATION_DIRECTION"
      payload: { operation: string; direction: "increase" | "decrease" }
    }
  | { type: "SELECT_OUTCOME"; payload: { option: string; section: string } }
  | { type: "DESELECT_OUTCOME"; payload: { option: string; section: string } }
  | { type: "RESET" }

// Initial state
const initialState: QuestionBuilderState = {
  swapped: false,
  includeClimate: false,
  selectedClimate: CLIMATE_OPTIONS[0]?.id || "hist_adj",
  selectedOperations: [],
  operationDirections: {},
  selectedOutcomes: [],
  outcomesBySection: {
    type: [],
    region: [],
    sector: [],
    metric: [],
  },
  showMap: false,
}

// Create reducer
const questionBuilderReducer = (
  state: QuestionBuilderState,
  action: Action,
): QuestionBuilderState => {
  switch (action.type) {
    case "TOGGLE_CLIMATE":
      return {
        ...state,
        includeClimate: !state.includeClimate,
      }
    case "TOGGLE_SWAP":
      return {
        ...state,
        swapped: !state.swapped,
      }
    case "TOGGLE_MAP":
      return {
        ...state,
        showMap: !state.showMap,
      }
    case "SET_CLIMATE":
      return {
        ...state,
        selectedClimate: action.payload,
      }
    case "SELECT_OPERATION":
      return {
        ...state,
        selectedOperations: [...state.selectedOperations, action.payload],
      }
    case "DESELECT_OPERATION":
      return {
        ...state,
        selectedOperations: state.selectedOperations.filter(
          (item) => item !== action.payload,
        ),
      }
    case "SET_OPERATION_DIRECTION": {
      const { operation, direction } = action.payload
      return {
        ...state,
        operationDirections: {
          ...state.operationDirections,
          [operation]: direction,
        },
      }
    }
    case "SELECT_OUTCOME": {
      const { option, section } = action.payload
      const updatedOutcomesBySection = { ...state.outcomesBySection }
      updatedOutcomesBySection[section] = [
        ...(updatedOutcomesBySection[section] || []),
        option,
      ]

      return {
        ...state,
        selectedOutcomes: [...state.selectedOutcomes, option],
        outcomesBySection: updatedOutcomesBySection,
      }
    }
    case "DESELECT_OUTCOME": {
      const { option, section } = action.payload
      const updatedOutcomesBySection = { ...state.outcomesBySection }
      updatedOutcomesBySection[section] = (
        updatedOutcomesBySection[section] || []
      ).filter((item) => item !== option)

      return {
        ...state,
        selectedOutcomes: state.selectedOutcomes.filter(
          (item) => item !== option,
        ),
        outcomesBySection: updatedOutcomesBySection,
      }
    }
    case "RESET":
      return initialState
    default:
      return state
  }
}

// Define context types
interface QuestionBuilderContextType {
  state: QuestionBuilderState
  dispatch: React.Dispatch<Action>
}

// Create context
const QuestionBuilderContext = createContext<
  QuestionBuilderContextType | undefined
>(undefined)

// Provider component
interface QuestionBuilderProviderProps {
  children: ReactNode
}

export const QuestionBuilderProvider: React.FC<
  QuestionBuilderProviderProps
> = ({ children }) => {
  const [state, dispatch] = useReducer(questionBuilderReducer, initialState)

  return (
    <QuestionBuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </QuestionBuilderContext.Provider>
  )
}

// Custom hook for using the context
export const useQuestionBuilder = () => {
  const context = useContext(QuestionBuilderContext)
  if (!context) {
    throw new Error(
      "useQuestionBuilder must be used within a QuestionBuilderProvider",
    )
  }
  return context
}

// Action creators for cleaner usage
export const questionBuilderActions = {
  toggleClimate: () => ({ type: "TOGGLE_CLIMATE" }) as const,
  toggleSwap: () => ({ type: "TOGGLE_SWAP" }) as const,
  toggleMap: () => ({ type: "TOGGLE_MAP" }) as const,
  setClimate: (climate: string) =>
    ({ type: "SET_CLIMATE", payload: climate }) as const,
  selectOperation: (operation: string) =>
    ({ type: "SELECT_OPERATION", payload: operation }) as const,
  deselectOperation: (operation: string) =>
    ({ type: "DESELECT_OPERATION", payload: operation }) as const,
  setOperationDirection: (
    operation: string,
    direction: "increase" | "decrease",
  ) =>
    ({
      type: "SET_OPERATION_DIRECTION",
      payload: { operation, direction },
    }) as const,
  selectOutcome: (option: string, section: string) =>
    ({
      type: "SELECT_OUTCOME",
      payload: { option, section },
    }) as const,
  deselectOutcome: (option: string, section: string) =>
    ({
      type: "DESELECT_OUTCOME",
      payload: { option, section },
    }) as const,
  reset: () => ({ type: "RESET" }) as const,
}
