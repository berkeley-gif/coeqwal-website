"use client"

import { useState, useRef, useEffect } from "react"
import type { GeocodingFeature, GeocodingOptions } from "../types"
import { useGeocoding } from "../hooks/useGeocoding"

export interface GeocoderControlProps extends GeocodingOptions {
  /** Mapbox access token (optional - will use token from map context if not provided) */
  accessToken?: string
  /** Placeholder text for search input */
  placeholder?: string
  /** Callback when a result is selected */
  onSelect?: (feature: GeocodingFeature) => void
  /** Custom styles for the container */
  style?: React.CSSProperties
  /** Custom className for the container */
  className?: string
  /** Position of the control on the map */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  /** Whether to show the clear button */
  showClear?: boolean
}

/**
 * Ready-to-use geocoder search control component
 * 
 * @example
 * ```tsx
 * import { BOUNDING_BOXES } from '@repo/map'
 * 
 * <Map mapboxToken={token}>
 *   <GeocoderControl
 *     // accessToken is optional - pulls from map context
 *     position="top-right"
 *     placeholder="Search California..."
 *     bbox={BOUNDING_BOXES.CALIFORNIA}
 *     flyTo={true}
 *     onSelect={(feature) => console.log('Selected:', feature.place_name)}
 *   />
 * </Map>
 * ```
 */
export function GeocoderControl({
  accessToken,
  placeholder = "Search for a place...",
  onSelect,
  style,
  className,
  position = "top-right",
  showClear = true,
  ...geocodingOptions
}: GeocoderControlProps) {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const geocoding = useGeocoding({
    accessToken,
    ...geocodingOptions,
  })

  // Handle search with debouncing
  useEffect(() => {
    if (!query.trim()) {
      geocoding.clear()
      return
    }

    const timeoutId = setTimeout(() => {
      geocoding.search(query)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show results when we have them
  useEffect(() => {
    setShowResults(geocoding.results.length > 0)
  }, [geocoding.results])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (feature: GeocodingFeature) => {
    setQuery(feature.place_name)
    setShowResults(false)
    geocoding.selectResult(feature)
    onSelect?.(feature)
  }

  const handleClear = () => {
    setQuery("")
    geocoding.clear()
    setShowResults(false)
    inputRef.current?.focus()
  }

  // Position styles
  const positionStyles: Record<string, React.CSSProperties> = {
    "top-left": { top: 10, left: 10 },
    "top-right": { top: 10, right: 10 },
    "bottom-left": { bottom: 10, left: 10 },
    "bottom-right": { bottom: 10, right: 10 },
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        zIndex: 1,
        ...positionStyles[position],
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 320,
          maxWidth: "calc(100vw - 20px)",
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              width: "100%",
              padding: "10px 36px 10px 12px",
              fontSize: "14px",
              border: "none",
              borderRadius: "4px",
              boxShadow: "0 0 10px 2px rgba(0,0,0,0.1)",
              outline: "none",
              backgroundColor: "white",
            }}
            onFocus={() => {
              if (geocoding.results.length > 0) {
                setShowResults(true)
              }
            }}
          />

          {/* Clear/Loading indicator */}
          <div
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {geocoding.loading && (
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid #ddd",
                  borderTopColor: "#666",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }}
              />
            )}

            {showClear && query && !geocoding.loading && (
              <button
                onClick={handleClear}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  color: "#666",
                  fontSize: "18px",
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Results Dropdown */}
        {showResults && geocoding.results.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              backgroundColor: "white",
              borderRadius: "4px",
              boxShadow: "0 0 10px 2px rgba(0,0,0,0.1)",
              maxHeight: 300,
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            {geocoding.results.map((feature, index) => (
              <button
                key={feature.id || index}
                onClick={() => handleSelect(feature)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  borderBottom:
                    index < geocoding.results.length - 1
                      ? "1px solid #eee"
                      : "none",
                  backgroundColor: "white",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f5f5"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white"
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 2 }}>
                  {feature.text}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {feature.place_name}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {geocoding.error && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              padding: "10px 12px",
              backgroundColor: "#fee",
              color: "#c33",
              borderRadius: "4px",
              fontSize: "13px",
              boxShadow: "0 0 10px 2px rgba(0,0,0,0.1)",
            }}
          >
            {geocoding.error.message}
          </div>
        )}
      </div>

      {/* Loading animation CSS (injected as style tag) */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

