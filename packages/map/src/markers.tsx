"use client"

import React, { useState, useCallback } from "react"
import {
  Marker as ReactMapGLMarker,
  Popup as ReactMapGLPopup,
} from "react-map-gl/mapbox"
import { useMap } from "../context/MapContext"

// Re-export the base components
export const Marker = ReactMapGLMarker
export const Popup = ReactMapGLPopup

/**
 * MarkerProperties
 */
export interface MarkerProperties {
  longitude: number
  latitude: number
  id?: string | number
  color?: string
  size?: number
  title?: string
  description?: string
  // Additional properties for tooltips
  Comment?: string
  nodeCode?: string
  properties?: {
    Comment?: string
    "node-code"?: string
    [key: string]: unknown
  }
}

/**
 * Custom marker that scales based on zoom level
 */
export function ScaledMarker({
  longitude,
  latitude,
  baseSize = 10,
  color = "rgba(239, 152, 39, 0.8)",
  onClick,
  title,
  id,
  children,
}: {
  longitude: number
  latitude: number
  baseSize?: number
  color?: string
  onClick?: (e: React.MouseEvent) => void
  title?: string
  id?: string | number
  children?: React.ReactNode
}) {
  // Get the current map state to calculate scaled size
  const { mapRef } = useMap()
  const zoom = mapRef.current?.getMap()?.getZoom() || 8

  // Calculate scaled size based on zoom level
  const getScaledSize = useCallback((baseSize: number, zoom: number) => {
    const min = 4
    const max = 12
    const minScale = 0.8
    const maxScale = 1.2

    const clampedZoom = Math.max(min, Math.min(zoom, max))
    const ratio = (clampedZoom - min) / (max - min)
    const scaleFactor = minScale + ratio * (maxScale - minScale)
    return Math.round(baseSize * scaleFactor)
  }, [])

  const scaledSize = getScaledSize(baseSize, zoom)

  return (
    <Marker longitude={longitude} latitude={latitude}>
      <div
        style={{
          backgroundColor: color,
          width: `${scaledSize}px`,
          height: `${scaledSize}px`,
          borderRadius: "50%",
          border: "1px solid white",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.8)",
          cursor: "pointer",
        }}
        title={title}
        onClick={onClick}
        data-marker-id={id}
      >
        {children}
      </div>
    </Marker>
  )
}

/**
 * Custom marker with attached popup for displaying info
 */
export function MarkerWithPopup({ marker }: { marker: MarkerProperties }) {
  const [isPopupVisible, setIsPopupVisible] = useState(false)

  // Format popup content
  const tooltipId = marker.id || ""
  const tooltipComment = marker.Comment || marker.properties?.Comment || ""
  const tooltipNodeCode =
    marker.nodeCode || marker.properties?.["node-code"] || ""
  const tooltipContent = `ID: ${tooltipId}\nComment: ${tooltipComment}\nNode Code: ${tooltipNodeCode}`

  return (
    <>
      <ScaledMarker
        longitude={marker.longitude}
        latitude={marker.latitude}
        color={marker.color}
        baseSize={marker.size || 10}
        id={marker.id}
        title={marker.title || tooltipContent}
        onClick={(e) => {
          e.stopPropagation()
          setIsPopupVisible(!isPopupVisible)
        }}
      />

      {isPopupVisible && (
        <Popup
          longitude={marker.longitude}
          latitude={marker.latitude}
          closeButton={true}
          closeOnClick={false}
          onClose={() => setIsPopupVisible(false)}
          anchor="bottom"
          offset={15}
          style={{ zIndex: 10 }}
        >
          <div style={{ padding: "5px", fontFamily: "Arial, sans-serif" }}>
            <h3
              style={{
                margin: "0 0 8px 0",
                color: "#154F89",
                fontSize: "16px",
              }}
            >
              {marker.id}
            </h3>
            {tooltipComment && (
              <div style={{ margin: "4px 0", fontSize: "13px" }}>
                <strong>Comment:</strong> {tooltipComment}
              </div>
            )}
            {tooltipNodeCode && (
              <div style={{ margin: "4px 0", fontSize: "13px" }}>
                <strong>Node Type:</strong> {tooltipNodeCode}
              </div>
            )}
            {marker.description && (
              <div style={{ margin: "4px 0", fontSize: "13px" }}>
                {marker.description}
              </div>
            )}
          </div>
        </Popup>
      )}
    </>
  )
}

/**
 * MarkersLayer renders a collection of markers with optional popups
 */
export function MarkersLayer({
  markers = [],
  showPopups = true,
}: {
  markers: MarkerProperties[]
  showPopups?: boolean
}) {
  if (!markers || markers.length === 0) return null

  return (
    <>
      {markers.map((marker, index) =>
        showPopups ? (
          <MarkerWithPopup
            key={`marker-${marker.id || index}`}
            marker={marker}
          />
        ) : (
          <ScaledMarker
            key={`marker-${marker.id || index}`}
            longitude={marker.longitude}
            latitude={marker.latitude}
            color={marker.color}
            baseSize={marker.size || 10}
            title={marker.title}
          />
        ),
      )}
    </>
  )
}
