import { useState, useEffect, useRef } from "react"

export function useFetchData<T>(url: string, processData: (data: T) => void) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const previousDataRef = useRef<T | null>(null) // Store the previous data

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch data from ${url}`)
        }
        const result = await response.json()

        // Only process data if it has changed
        if (
          JSON.stringify(previousDataRef.current) !== JSON.stringify(result)
        ) {
          previousDataRef.current = result // Update the reference
          setData(result)
          processData(result)
        }
      } catch (err) {
        setError(`Error fetching data: ${err}`)
        console.error("Error fetching data:", err)
      }
    }

    fetchData()
  }, [url, processData])

  return { data, error }
}
