"use client"

import { useCallback, useState, useEffect } from "react"
import { useMap, Marker, Popup } from "@repo/map"
import { Box, Typography } from "@repo/ui/mui"
import { useCalSimToggle } from "./CalSimContext"

interface CalSimNode {
  id: string
  name: string
  node_type_name: string
  is_reservoir: boolean
  capacity_taf?: number
  riv_name?: string
  connected_arcs: number
  map_category: string
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_COEQWAL_API_URL || 'https://api.coeqwal.org'

export default function CalSimMarkers() {
  const { isCalSimVisible } = useCalSimToggle()
  const { mapRef } = useMap()
  const [nodes, setNodes] = useState<CalSimNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<CalSimNode | null>(null)

  // Helper functions for node styling
  const getNodeSize = (category: string) => {
    switch (category) {
      case 'reservoir': return 16
      case 'pump_station': return 12
      case 'water_treatment': return 10
      default: return 8
    }
  }

  const getNodeColor = (category: string) => {
    switch (category) {
      case 'reservoir': return '#2563eb'
      case 'pump_station': return '#dc2626'
      case 'water_treatment': return '#059669'
      default: return '#6b7280'
    }
  }

  const loadCalSimNodes = useCallback(async () => {
    if (!mapRef.current) return

    const map = mapRef.current.getMap()
    if (!map) return

    const bounds = map.getBounds()
    if (!bounds) return
    
    const zoom = Math.round(map.getZoom())
    const bbox = [
      bounds.getWest(), 
      bounds.getSouth(),
      bounds.getEast(), 
      bounds.getNorth()
    ].join(',')
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/nodes/spatial?bbox=${bbox}&zoom=${zoom}&limit=500`
      )
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("API Response:", data)
      
      const nodes = data.nodes || data || []
      console.log("Nodes to render:", nodes)
      
      // Transform and filter nodes with valid geometry
      const validNodes = nodes.map((node: any) => {
        let geometry = node.geometry
        if (typeof geometry === 'string') {
          try {
            geometry = JSON.parse(geometry)
          } catch (error) {
            console.warn("Failed to parse geometry for node:", node.name, error)
            return null
          }
        }
        
        return {
          ...node,
          geometry
        }
      }).filter((node: any): node is CalSimNode => {
        if (!node || !node.geometry || !node.geometry.coordinates || !Array.isArray(node.geometry.coordinates)) {
          console.warn("Invalid node geometry after parsing:", node?.name)
          return false
        }
        const [lng, lat] = node.geometry.coordinates
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          console.warn("Invalid coordinates:", node.name, lng, lat)
          return false
        }
        return true
      })

      console.log(`Rendering ${validNodes.length} valid nodes out of ${nodes.length} total`)
      setNodes(validNodes)
      
    } catch (error) {
      console.error("Failed to load CalSim nodes from API:", error)
      console.error("API URL being used:", `${API_BASE_URL}/api/nodes/spatial?bbox=${bbox}&zoom=${zoom}&limit=500`)
      
      // Fallback to mock data
      const mockNodes: CalSimNode[] = [
        {
          id: "node_1",
          name: "Shasta Reservoir", 
          node_type_name: "Reservoir",
          is_reservoir: true,
          capacity_taf: 4552,
          riv_name: "Sacramento River",
          connected_arcs: 3,
          map_category: "reservoir",
          geometry: {
            type: "Point",
            coordinates: [-122.37, 40.71]
          }
        }
      ]
      setNodes(mockNodes)
    }
  }, [mapRef])

  // Load CalSim nodes when toggle is enabled
  useEffect(() => {
    if (isCalSimVisible) {
      loadCalSimNodes()
    } else {
      setNodes([])
      setHoveredNode(null)
    }
  }, [isCalSimVisible, loadCalSimNodes])

  // Handle node click for network traversal
  const handleNodeClick = useCallback(async (node: CalSimNode) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/nodes/${node.id}/network?direction=both&include_arcs=true`
      )
      
      if (!response.ok) {
        throw new Error(`Network API request failed: ${response.status}`)
      }
      
      const network = await response.json()
      console.log("Network data for", node.name, ":", network)
      
      // TODO: Implement arc highlighting
      
    } catch (error) {
      console.error("Failed to load network for node:", node.name, error)
    }
  }, [])

  // Don't render anything if CalSim is not visible
  if (!isCalSimVisible || !nodes.length) {
    return null
  }

  return (
    <>
      {nodes.map((node) => (
        <Marker
          key={node.id}
          longitude={node.geometry.coordinates[0]}
          latitude={node.geometry.coordinates[1]}
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            console.log("Marker clicked:", node.name)
            handleNodeClick(node)
          }}
        >
          <Box
            onMouseEnter={() => {
              console.log("Marker hovered:", node.name)
              setHoveredNode(node)
            }}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={(e) => {
              e.stopPropagation()
              console.log("Box clicked:", node.name)
              handleNodeClick(node)
            }}
            sx={{
              width: getNodeSize(node.map_category),
              height: getNodeSize(node.map_category),
              borderRadius: "50%",
              backgroundColor: getNodeColor(node.map_category),
              border: "2px solid white",
              cursor: "pointer",
              transition: "all 0.2s ease",
              pointerEvents: "auto",
              zIndex: 9999,
              position: "relative",
              "&:hover": {
                transform: "scale(1.2)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              },
            }}
          />
          
          {/* Tooltip popup */}
          {hoveredNode?.id === node.id && (
            <Popup
              longitude={node.geometry.coordinates[0]}
              latitude={node.geometry.coordinates[1]}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              offset={[0, -10]}
            >
              <Box sx={{ padding: 1, minWidth: 200 }}>
                <Typography variant="h6" sx={{ mb: 0.5, fontSize: "0.9rem" }}>
                  {node.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
                  <strong>Type:</strong> {node.node_type_name}
                </Typography>
                {node.is_reservoir && node.capacity_taf && (
                  <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
                    <strong>Capacity:</strong> {node.capacity_taf.toLocaleString()} TAF
                  </Typography>
                )}
                {node.riv_name && (
                  <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
                    <strong>River:</strong> {node.riv_name}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                  <strong>Connected Arcs:</strong> {node.connected_arcs}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.75rem", fontStyle: "italic", mt: 0.5, color: "text.secondary" }}>
                  Click to see network connections
                </Typography>
              </Box>
            </Popup>
          )}
        </Marker>
      ))}
    </>
  )
}
