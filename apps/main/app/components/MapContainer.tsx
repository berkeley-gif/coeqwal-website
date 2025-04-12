"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Map } from "@repo/map"
import { useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"

export default function MapContainer() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  
  const { mapRef } = useMap()
  
  // State for the map view
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  });

  // Test button with context mapRef
  const testFlyTo = useCallback(() => {
    if (mapRef.current) {
      console.log("Testing flyTo via context");
      mapRef.current.flyTo(-121.5, 38.05, 10);
    }
  }, [mapRef]);
  
  useEffect(() => {
    // Add a test button to the DOM
    const button = document.createElement("button");
    button.textContent = "Test Direct flyTo";
    button.style.position = "fixed";
    button.style.top = "10px";
    button.style.left = "10px";
    button.style.zIndex = "9999";
    button.onclick = testFlyTo;
    document.body.appendChild(button);
    
    return function cleanup() {
      document.body.removeChild(button);
    };
  }, [testFlyTo]);

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative", pointerEvents: "auto" }}>
      <Map
        mapboxToken={mapboxToken}
        viewState={viewState}
        onViewStateChange={setViewState}
        mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
        scrollZoom={true}
        interactive={true}
        dragPan={true}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  )
}
