"use client"

import { useCallback, useState, useEffect } from "react"
import { useMap, Marker, Popup, Source, Layer } from "@repo/map"
import { Box, Typography } from "@repo/ui/mui"
import { useCalSimToggle } from "./CalSimContext"

interface CalSimNode {
  id: number
  short_code: string
  name: string
  description: string | null
  node_type: string
  node_type_name: string
  hydrologic_region: string | null
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
  latitude: number | null
  longitude: number | null
  riv_mi: number | null
  riv_name: string | null
  is_reservoir: boolean
  capacity_taf: number | null
  operational_purpose: string | null
  associated_river: string | null
  map_category: string
  connected_arcs: number
  is_interactive: boolean
}

interface CalSimArc {
  id: number
  short_code: string
  name: string
  from_node_id: number
  to_node_id: number
  from_node_code: string
  to_node_code: string
  geometry: {
    type: "MultiLineString"
    coordinates: number[][][]
  }
  arc_type: string
}

interface NetworkResponse {
  source_node_id: number
  direction: string
  max_depth: number
  nodes: CalSimNode[]
  arcs: CalSimArc[]
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_COEQWAL_API_URL || "https://api.coeqwal.org"

export default function CalSimMarkers() {
  const { isCalSimVisible } = useCalSimToggle()
  const { mapRef, fitBounds } = useMap()
  const [nodes, setNodes] = useState<CalSimNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<CalSimNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<CalSimNode | null>(null)
  const [networkArcs, setNetworkArcs] = useState<CalSimArc[]>([])
  const [connectedNodeIds, setConnectedNodeIds] = useState<Set<number>>(new Set())
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false)

  // Helper functions for node styling
  const getNodeSize = (category: string) => {
    switch (category) {
      case "reservoir":
        return 16
      case "pump_station":
        return 12
      case "water_treatment":
        return 10
      default:
        return 8
    }
  }

  const getNodeColor = (category: string, isConnected = false, isSelected = false) => {
    if (isSelected) {
      return "#ff6b35" // Orange for selected node, for now
    }
    if (isConnected) {
      return "#ffeb3b" // Yellow for connected nodes, for now
    }
    
    // Default colors by category
    switch (category) {
      case "reservoir":
        return "#2563eb"
      case "pump_station":
        return "#dc2626"
      case "water_treatment":
        return "#059669"
      default:
        return "#6b7280"
    }
  }

  // Network traversal functions
  const buildNetworkMaps = useCallback((arcs: CalSimArc[]) => {
    const upstreamMap = new Map<number, number[]>() // target -> [sources]
    const downstreamMap = new Map<number, number[]>() // source -> [targets]
    
    arcs.forEach(arc => {
      // Build upstream map
      if (!upstreamMap.has(arc.to_node_id)) {
        upstreamMap.set(arc.to_node_id, [])
      }
      upstreamMap.get(arc.to_node_id)!.push(arc.from_node_id)
      
      // Build downstream map
      if (!downstreamMap.has(arc.from_node_id)) {
        downstreamMap.set(arc.from_node_id, [])
      }
      downstreamMap.get(arc.from_node_id)!.push(arc.to_node_id)
    })
    
    return { upstreamMap, downstreamMap }
  }, [])

  // Find all upstream nodes from a given node
  const findUpstreamNodes = useCallback((nodeId: number, upstreamMap: Map<number, number[]>, visited = new Set<number>()): Set<number> => {
    if (visited.has(nodeId)) return visited
    visited.add(nodeId)
    
    const upstreamNodes = upstreamMap.get(nodeId) || []
    upstreamNodes.forEach(upstreamNode => {
      findUpstreamNodes(upstreamNode, upstreamMap, visited)
    })
    
    return visited
  }, [])

  // Find all downstream nodes from a given node
  const findDownstreamNodes = useCallback((nodeId: number, downstreamMap: Map<number, number[]>, visited = new Set<number>()): Set<number> => {
    if (visited.has(nodeId)) return visited
    visited.add(nodeId)
    
    const downstreamNodes = downstreamMap.get(nodeId) || []
    downstreamNodes.forEach(downstreamNode => {
      findDownstreamNodes(downstreamNode, downstreamMap, visited)
    })
    
    return visited
  }, [])


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
      bounds.getNorth(),
    ].join(",")

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/nodes/spatial?bbox=${bbox}&zoom=${zoom}&limit=500`,
      )

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("API Response:", data)

      const nodes = data.nodes || data || []
      console.log("Nodes to render:", nodes)

      // Filter nodes with valid geometry (API now sends parsed JSON objects)
      const validNodes = nodes.filter((node: unknown): node is CalSimNode => {
        if (!node || typeof node !== "object") {
          return false
        }
        
        const nodeObj = node as Record<string, unknown>
        
        if (!("geometry" in nodeObj) || !nodeObj.geometry) {
          console.warn("Node missing geometry:", nodeObj.name)
          return false
        }
        
        const geometry = nodeObj.geometry
        
        // Geometry should now be a parsed object, not a string
        if (typeof geometry === "string") {
          console.warn("Unexpected: geometry is still a string for node:", nodeObj.name)
          return false
        }
        
        if (typeof geometry !== "object" || !("coordinates" in geometry)) {
          console.warn("Invalid geometry object for node:", nodeObj.name, "geometry:", geometry)
          return false
        }
        
        const coords = (geometry as { coordinates: [number, number] }).coordinates
        if (!Array.isArray(coords) || coords.length !== 2) {
          console.warn("Invalid coordinates for node:", nodeObj.name, "coordinates:", coords)
          return false
        }
        
        const [lng, lat] = coords
        if (typeof lng !== "number" || typeof lat !== "number" || isNaN(lng) || isNaN(lat)) {
          console.warn("Invalid coordinate values for node:", nodeObj.name, "lng:", lng, "lat:", lat)
          return false
        }
        
        return true
      })

      console.log(
        `Rendering ${validNodes.length} valid nodes out of ${nodes.length} total`,
      )
      setNodes(validNodes)
    } catch (error) {
      console.error("Failed to load CalSim nodes from API:", error)
      console.error(
        "API URL being used:",
        `${API_BASE_URL}/api/nodes/spatial?bbox=${bbox}&zoom=${zoom}&limit=500`,
      )

      // Fallback to mock data
      const mockNodes: CalSimNode[] = [
        {
          id: 1,
          short_code: "SHSTA",
          name: "Shasta Reservoir",
          description: "Shasta Dam and Reservoir",
          node_type: "STR-SIM",
          node_type_name: "storage - simulated",
          hydrologic_region: "SAC",
          geometry: {
            type: "Point",
            coordinates: [-122.37, 40.71],
          },
          latitude: 40.71,
          longitude: -122.37,
          riv_mi: 309.52,
          riv_name: "Sacramento River",
          is_reservoir: true,
          capacity_taf: 4552,
          operational_purpose: null,
          associated_river: "Sacramento River",
          map_category: "reservoir",
          connected_arcs: 3,
          is_interactive: true,
        },
      ]
      setNodes(mockNodes)
    }
  }, [mapRef])

  // Load CalSim nodes when toggle is enabled
  useEffect(() => {
    if (isCalSimVisible) {
      loadCalSimNodes()
    } else {
      // Clean up all CalSim-related state (declarative components will handle cleanup)
      setNodes([])
      setHoveredNode(null)
      setSelectedNode(null)
      setNetworkArcs([])
      setConnectedNodeIds(new Set())
      setIsLoadingNetwork(false)
    }
  }, [isCalSimVisible, loadCalSimNodes])

  // Handle node click for network traversal
  const handleNodeClick = useCallback(async (node: CalSimNode) => {
    // If clicking the same node, toggle off the network
    if (selectedNode?.id === node.id) {
      setSelectedNode(null)
      setNetworkArcs([])
      setConnectedNodeIds(new Set())
      console.log("Toggled off network for node:", node.name)
      return
    }

    setSelectedNode(node)
    setIsLoadingNetwork(true)
    
    const apiUrl = `${API_BASE_URL}/api/nodes/${node.id}/network?direction=both&include_arcs=true`
    console.log("Fetching network data for node:", node.name, "ID:", node.id)
    console.log("API URL:", apiUrl)
    
    try {
      const response = await fetch(apiUrl)
      
      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetails = `${response.status} ${response.statusText}`
        try {
          const errorBody = await response.text()
          if (errorBody) {
            errorDetails += ` - ${errorBody}`
          }
        } catch {
          // Ignore if we can't read the error body
        }
        throw new Error(`Network API request failed: ${errorDetails}`)
      }

      const network: NetworkResponse = await response.json()
      console.log("Network data for", node.name, ":", network)
      console.log(`Found ${network.nodes.length} connected nodes and ${network.arcs.length} arcs`)

      // Build network maps for traversal
      const { upstreamMap, downstreamMap } = buildNetworkMaps(network.arcs)
      
      // Find all connected nodes (upstream + downstream + selected node)
      const upstreamNodes = findUpstreamNodes(node.id, upstreamMap)
      const downstreamNodes = findDownstreamNodes(node.id, downstreamMap)
      const allConnectedNodes = new Set([...upstreamNodes, ...downstreamNodes])
      
      // Filter arcs to only show those connecting highlighted nodes
      const connectedArcs = network.arcs.filter(arc => 
        allConnectedNodes.has(arc.from_node_id) && allConnectedNodes.has(arc.to_node_id)
      )
      
      // Store the network arcs and connected nodes
      setNetworkArcs(connectedArcs)
      setConnectedNodeIds(allConnectedNodes)
      
      console.log(`Node ${node.name} network:`)
      console.log(`  Upstream nodes: ${upstreamNodes.size}`)
      console.log(`  Downstream nodes: ${downstreamNodes.size}`) 
      console.log(`  Total connected nodes: ${allConnectedNodes.size}`)
      console.log(`  Connected arcs: ${connectedArcs.length}/${network.arcs.length}`)
      console.log("Arc data:", network.arcs[0])
      
      // Debug: Try to zoom to the arc area to make sure it's visible
      if (connectedArcs.length > 0 && mapRef.current) {
        const arc = connectedArcs[0]
        if (arc?.geometry?.coordinates?.[0]) {
          const coords = arc.geometry.coordinates[0] // First line of MultiLineString
          if (coords && coords.length > 0) {
            const startCoord = coords[0]
            const endCoord = coords[coords.length - 1]
            
            if (startCoord && endCoord && startCoord.length >= 2 && endCoord.length >= 2) {
              const [startLng, startLat] = startCoord
              const [endLng, endLat] = endCoord
              
              if (typeof startLng === 'number' && typeof startLat === 'number' && 
                  typeof endLng === 'number' && typeof endLat === 'number') {
                // Calculate bounds for the arc
                const arcBounds: [[number, number], [number, number]] = [
                  [Math.min(startLng, endLng) - 0.01, Math.min(startLat, endLat) - 0.01],
                  [Math.max(startLng, endLng) + 0.01, Math.max(startLat, endLat) + 0.01]
                ]
                
                console.log("Fitting map to arc bounds:", arcBounds)
                console.log("Arc coordinates:", coords.slice(0, 3), "...", coords.slice(-3))
                fitBounds(arcBounds, 0, 0, 50) // Add padding
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load network for node:", node.name, "ID:", node.id, error)
      console.error("API URL that failed:", apiUrl)
      
      // Show user-friendly message for known API issues
      if (error instanceof Error && error.message.includes("Database error")) {
        console.warn("Network API is currently experiencing database issues. Feature temporarily unavailable.")
        // TODO: Show user notification that network visualization is temporarily unavailable
      }
      
      // Reset state on error
      setSelectedNode(null)
      setNetworkArcs([])
      setConnectedNodeIds(new Set())
    } finally {
      setIsLoadingNetwork(false)
    }
  }, [selectedNode, buildNetworkMaps, findUpstreamNodes, findDownstreamNodes, mapRef, fitBounds])

  // Don't render anything if CalSim is not visible
  if (!isCalSimVisible || !nodes.length) {
    return null
  }

  console.log(`Rendering ${nodes.length} CalSim markers, isVisible: ${isCalSimVisible}`)

  return (
    <>
      {/* Network arcs visualization using declarative approach */}
      {networkArcs.length > 0 && (
        <Source
          id="calsim-network-arcs"
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: networkArcs.map((arc) => ({
              type: "Feature",
              properties: {
                id: arc.id,
                name: arc.name,
                short_code: arc.short_code,
                arc_type: arc.arc_type,
                from_node_id: arc.from_node_id,
                to_node_id: arc.to_node_id,
                from_node_code: arc.from_node_code,
                to_node_code: arc.to_node_code,
              },
              geometry: arc.geometry,
            })),
          }}
        >
          {/* White outline layer */}
          <Layer
            id="calsim-network-arcs-outline"
            type="line"
            paint={{
              "line-color": "#ffffff",
              "line-width": 20,
              "line-opacity": 1,
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
          {/* Red main layer */}
          <Layer
            id="calsim-network-arcs-layer"
            type="line"
            paint={{
              "line-color": "#ff0000",
              "line-width": 15,
              "line-opacity": 1,
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
        </Source>
      )}

      {/* CalSim node markers */}
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
              backgroundColor: getNodeColor(
                node.map_category,
                connectedNodeIds.has(node.id), // Is this node connected to the selected network?
                selectedNode?.id === node.id    // Is this the selected node?
              ),
              border: selectedNode?.id === node.id 
                ? "3px solid #ff6b35" // Orange border for selected node
                : connectedNodeIds.has(node.id)
                ? "3px solid #ffeb3b" // Yellow border for connected nodes, for now
                : isLoadingNetwork && selectedNode?.id === node.id
                ? "3px solid #ffb366" // Light orange for loading
                : "2px solid white",
              cursor: "pointer",
              transition: "all 0.2s ease",
              pointerEvents: "auto",
              zIndex: 9999,
              position: "relative",
              opacity: isLoadingNetwork && selectedNode?.id === node.id ? 0.7 : 1,
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
                <Typography
                  variant="body2"
                  sx={{ mb: 0.25, fontSize: "0.75rem", color: "text.secondary" }}
                >
                  {node.short_code} • ID: {node.id}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.25, fontSize: "0.8rem" }}
                >
                  <strong>Type:</strong> {node.node_type_name}
                </Typography>
                {node.hydrologic_region && (
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.25, fontSize: "0.8rem" }}
                  >
                    <strong>Region:</strong> {node.hydrologic_region}
                  </Typography>
                )}
                {node.is_reservoir && node.capacity_taf && (
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.25, fontSize: "0.8rem" }}
                  >
                    <strong>Capacity:</strong>{" "}
                    {node.capacity_taf.toLocaleString()} TAF
                  </Typography>
                )}
                {node.riv_name && (
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.25, fontSize: "0.8rem" }}
                  >
                    <strong>River:</strong> {node.riv_name}
                    {node.riv_mi && ` (Mile ${node.riv_mi})`}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                  <strong>Connected Arcs:</strong> {node.connected_arcs}
                </Typography>
                {connectedNodeIds.has(node.id) && selectedNode?.id !== node.id && (
                  <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "warning.main" }}>
                    <strong>Part of active network</strong>
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                    mt: 0.5,
                    color: selectedNode?.id === node.id 
                      ? "primary.main" 
                      : connectedNodeIds.has(node.id)
                      ? "warning.main"
                      : isLoadingNetwork && selectedNode?.id === node.id
                      ? "warning.main"
                      : "text.secondary",
                  }}
                >
                  {isLoadingNetwork && selectedNode?.id === node.id
                    ? "Loading full network..."
                    : selectedNode?.id === node.id
                    ? `Showing ${connectedNodeIds.size} connected nodes, ${networkArcs.length} arcs (click to hide)`
                    : connectedNodeIds.has(node.id)
                    ? "Connected to active network"
                    : "Click to show full network"}
                </Typography>
              </Box>
            </Popup>
          )}
        </Marker>
      ))}
    </>
  )
}
