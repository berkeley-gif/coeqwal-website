"use client"

import { useCallback, useState, useEffect } from "react"
import { useMap, Marker, Popup, Source, Layer } from "@repo/map"
import { Box, Typography } from "@repo/ui/mui"
import { useCalSimToggle } from "./CalSimContext"

// ==============================================
// TYPESCRIPT INTERFACES
// ==============================================

// GeoJSON API interfaces
export interface NetworkGeoJSONFeature {
  type: "Feature"
  geometry: {
    type: "Point" | "MultiLineString" | "LineString"
    coordinates: [number, number] | [number, number][] | [number, number][][]
  }
  properties: {
    id: number
    short_code: string
    type: "node" | "arc"
    connectivity_status: "connected" | "unconnected"
    element_type: string
    subtype?: string

    // Node-specific properties
    river_name?: string
    river_mile?: number
    display_name?: string

    // Arc-specific properties
    arc_name?: string
    shape_length?: number
    from_node?: string
    to_node?: string

    // Traversal-specific properties
    depth?: number
    strategy?: "direct" | "proximity" | "river_sequence"
  }
}

export interface NetworkGeoJSONResponse {
  type: "FeatureCollection"
  features: NetworkGeoJSONFeature[]
  metadata: {
    total_features: number
    bbox?: [number, number, number, number]
    includes_arcs?: boolean
    includes_nodes?: boolean
    start_element?: string
    direction?: string
    max_depth?: number
    strategies_used?: string[]
  }
}

export interface NetworkNode {
  id: number
  short_code: string
  name: string
  coordinates: [number, number]

  // Core properties
  element_type: string
  subtype?: string
  river_name?: string
  river_mile?: number
  connectivity_status: "connected" | "unconnected"
  display_name: string

  // Traversal properties
  depth?: number
  strategy?: string
}

export interface NetworkArc {
  id: number
  short_code: string
  name: string
  geometry: {
    type: "MultiLineString" | "LineString"
    coordinates: number[][] | number[][][]
  }

  // Core properties
  element_type: string
  subtype?: string
  arc_name?: string
  shape_length?: number
  from_node: string
  to_node: string
  connectivity_status: "connected" | "unconnected"
  display_name: string

  // Traversal properties
  depth?: number
  strategy?: string
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_COEQWAL_API_URL || "https://api.coeqwal.org"

// ==============================================
// TYPE GUARDS AND CONVERSION UTILITIES
// ==============================================

export function isGeoJSONResponse(
  response: unknown,
): response is NetworkGeoJSONResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "type" in response &&
    (response as NetworkGeoJSONResponse).type === "FeatureCollection" &&
    "features" in response &&
    Array.isArray((response as NetworkGeoJSONResponse).features)
  )
}

export function convertGeoJSONToNetwork(
  geoJsonResponse: NetworkGeoJSONResponse,
): { nodes: NetworkNode[]; arcs: NetworkArc[] } {
  const nodes: NetworkNode[] = []
  const arcs: NetworkArc[] = []

  geoJsonResponse.features.forEach((feature) => {
    if (feature.properties.type === "node") {
      const coords = feature.geometry.coordinates as [number, number]
      nodes.push({
        id: feature.properties.id,
        short_code: feature.properties.short_code,
        name: feature.properties.display_name || feature.properties.short_code,
        coordinates: coords,
        element_type: feature.properties.element_type,
        subtype: feature.properties.subtype,
        river_name: feature.properties.river_name,
        river_mile: feature.properties.river_mile,
        connectivity_status: feature.properties.connectivity_status,
        display_name:
          feature.properties.display_name || feature.properties.short_code,
        depth: feature.properties.depth,
        strategy: feature.properties.strategy,
      })
    } else if (feature.properties.type === "arc") {
      arcs.push({
        id: feature.properties.id,
        short_code: feature.properties.short_code,
        name: feature.properties.display_name || feature.properties.short_code,
        geometry: feature.geometry as NetworkArc["geometry"],
        element_type: feature.properties.element_type,
        subtype: feature.properties.subtype,
        arc_name: feature.properties.arc_name,
        shape_length: feature.properties.shape_length,
        from_node: feature.properties.from_node || "",
        to_node: feature.properties.to_node || "",
        connectivity_status: feature.properties.connectivity_status,
        display_name:
          feature.properties.display_name || feature.properties.short_code,
        depth: feature.properties.depth,
        strategy: feature.properties.strategy,
      })
    }
  })

  return { nodes, arcs }
}

function getMapCategory(elementType: string): string {
  switch (elementType.toUpperCase()) {
    case "STR":
      return "reservoir"
    case "PS":
      return "pump_station"
    case "WTP":
      return "water_treatment"
    case "WWTP":
      return "water_treatment"
    case "CH":
      return "channel"
    default:
      return "other"
  }
}

export default function CalSimMarkers() {
  const { isCalSimVisible } = useCalSimToggle()
  const { mapRef } = useMap()
  const [allNodes, setAllNodes] = useState<NetworkNode[]>([])
  const [visibleNodes, setVisibleNodes] = useState<NetworkNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [networkArcs, setNetworkArcs] = useState<NetworkArc[]>([])
  const [connectedNodeIds, setConnectedNodeIds] = useState<Set<number>>(
    new Set(),
  )
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false)
  const [currentZoom, setCurrentZoom] = useState<number>(0)

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

  const getNodeColor = (
    node: NetworkNode,
    isConnected = false,
    isSelected = false,
  ) => {
    if (isSelected) return "#ff6b35"
    if (isConnected) return "#ffeb3b"

    // Color by element type
    const baseColor = (() => {
      const category = getMapCategory(node.element_type)
      switch (category) {
        case "reservoir":
          return "#2563eb"
        case "pump_station":
          return "#dc2626"
        case "water_treatment":
          return "#059669"
        case "channel":
          return "#8b5cf6"
        default:
          return "#6b7280"
      }
    })()

    return baseColor
  }

  // Network traversal functions for new API
  const buildNetworkMaps = useCallback(
    (arcs: NetworkArc[]) => {
      const upstreamMap = new Map<number, number[]>()
      const downstreamMap = new Map<number, number[]>()

      arcs.forEach((arc) => {
        // Find nodes by short_code from all nodes
        const fromNodeId = allNodes.find(
          (n) => n.short_code === arc.from_node,
        )?.id
        const toNodeId = allNodes.find((n) => n.short_code === arc.to_node)?.id

        if (fromNodeId && toNodeId) {
          // Build upstream map
          if (!upstreamMap.has(toNodeId)) {
            upstreamMap.set(toNodeId, [])
          }
          upstreamMap.get(toNodeId)!.push(fromNodeId)

          // Build downstream map
          if (!downstreamMap.has(fromNodeId)) {
            downstreamMap.set(fromNodeId, [])
          }
          downstreamMap.get(fromNodeId)!.push(toNodeId)
        }
      })

      return { upstreamMap, downstreamMap }
    },
    [allNodes],
  )

  // Find all upstream nodes from a given node
  const findUpstreamNodes = useCallback(
    (
      nodeId: number,
      upstreamMap: Map<number, number[]>,
      visited = new Set<number>(),
    ): Set<number> => {
      if (visited.has(nodeId)) return visited
      visited.add(nodeId)

      const upstreamNodes = upstreamMap.get(nodeId) || []
      upstreamNodes.forEach((upstreamNode) => {
        findUpstreamNodes(upstreamNode, upstreamMap, visited)
      })

      return visited
    },
    [],
  )

  // Find all downstream nodes from a given node
  const findDownstreamNodes = useCallback(
    (
      nodeId: number,
      downstreamMap: Map<number, number[]>,
      visited = new Set<number>(),
    ): Set<number> => {
      if (visited.has(nodeId)) return visited
      visited.add(nodeId)

      const downstreamNodes = downstreamMap.get(nodeId) || []
      downstreamNodes.forEach((downstreamNode) => {
        findDownstreamNodes(downstreamNode, downstreamMap, visited)
      })

      return visited
    },
    [],
  )

  // Filter nodes based on zoom level for performance
  const filterNodesByZoom = useCallback(
    (nodes: NetworkNode[], zoom: number): NetworkNode[] => {
      if (zoom >= 8) {
        // High zoom: show all nodes
        return nodes
      } else if (zoom >= 6) {
        // Medium zoom: show important nodes only
        return nodes.filter(
          (node) =>
            ["STR", "PS", "WTP", "WWTP"].includes(node.element_type) ||
            node.connectivity_status === "connected",
        )
      } else {
        // Low zoom: show only major infrastructure
        return nodes.filter((node) => ["STR", "PS"].includes(node.element_type))
      }
    },
    [],
  )

  const loadCalSimNodes = useCallback(async () => {
    const startTime = performance.now()
    console.log("🚀 Starting CalSim node loading...")

    if (!mapRef.current) return

    const map = mapRef.current.getMap()
    if (!map) return

    const bounds = map.getBounds()
    if (!bounds) return

    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ].join(",")

    const zoom = map.getZoom()
    setCurrentZoom(zoom)

    const zoom = map.getZoom()
    setCurrentZoom(zoom)

    try {
      const fetchStart = performance.now()
      // Use ultra-fast nodes API
      const fastUrl = `${API_BASE_URL}/api/network/nodes/fast?bbox=${bbox}&limit=1000`
      console.log("⚡ Fetching ULTRA-FAST nodes API...")
      console.log("🎯 URL:", fastUrl)

      const geoJsonResponse = await fetch(fastUrl)
      const fetchEnd = performance.now()
      console.log(`⏱️ API fetch took: ${(fetchEnd - fetchStart).toFixed(0)}ms`)

      if (fetchEnd - fetchStart > 5000) {
        console.warn("🐌 API is very slow! Consider:")
        console.warn("  1. Adding database indexes")
        console.warn("  2. Implementing API caching")
        console.warn("  3. Using smaller bbox or limits")
        console.warn("  4. Adding server-side filtering")
      }

      if (!geoJsonResponse.ok) {
        throw new Error(`GeoJSON API failed: ${geoJsonResponse.status}`)
      }

      const parseStart = performance.now()
      const geoJsonData = await geoJsonResponse.json()
      const parseEnd = performance.now()
      console.log(
        `⏱️ JSON parsing took: ${(parseEnd - parseStart).toFixed(0)}ms`,
      )

      if (!isGeoJSONResponse(geoJsonData)) {
        throw new Error("Invalid GeoJSON response format")
      }

      const convertStart = performance.now()
      const { nodes } = convertGeoJSONToNetwork(geoJsonData)
      const convertEnd = performance.now()
      console.log(
        `⏱️ Data conversion took: ${(convertEnd - convertStart).toFixed(0)}ms`,
      )

      // Filter nodes with valid coordinates
      const filterStart = performance.now()
      const validNodes = nodes.filter((node): node is NetworkNode => {
        if (!node?.coordinates) return false
        const [lng, lat] = node.coordinates
        return (
          typeof lng === "number" &&
          typeof lat === "number" &&
          !isNaN(lng) &&
          !isNaN(lat)
        )
      })
      const filterEnd = performance.now()
      console.log(
        `⏱️ Coordinate filtering took: ${(filterEnd - filterStart).toFixed(0)}ms`,
      )

      // Store all nodes and filter for current zoom
      const stateStart = performance.now()
      setAllNodes(validNodes)
      const filteredNodes = filterNodesByZoom(validNodes, zoom)
      setVisibleNodes(filteredNodes)

      const stateEnd = performance.now()
      console.log(
        `⏱️ State updates took: ${(stateEnd - stateStart).toFixed(0)}ms`,
      )

      const totalTime = performance.now() - startTime
      console.log(`✅ Total loading time: ${totalTime.toFixed(0)}ms`)
      console.log(
        `📊 Showing ${filteredNodes.length}/${validNodes.length} nodes at zoom ${zoom.toFixed(1)}`,
      )

      // Debug filtering
      if (filteredNodes.length < validNodes.length) {
        console.log(
          `🔍 Filtered out ${validNodes.length - filteredNodes.length} nodes for performance`,
        )
      } else {
        console.log(
          `📊 All nodes shown (no filtering applied at this zoom level)`,
        )
      }
    } catch (error) {
      console.error("❌ Failed to load CalSim nodes:", error)
      setAllNodes([])
      setVisibleNodes([])
    }
  }, [mapRef, filterNodesByZoom])

  // Update visible nodes when zoom changes
  useEffect(() => {
    if (!mapRef.current || !allNodes.length) return

    const map = mapRef.current.getMap()
    if (!map) return

    const handleZoomEnd = () => {
      const zoom = map.getZoom()
      setCurrentZoom(zoom)
      const filteredNodes = filterNodesByZoom(allNodes, zoom)
      setVisibleNodes(filteredNodes)
      console.log(
        `🔍 Zoom changed to ${zoom.toFixed(1)}: showing ${filteredNodes.length}/${allNodes.length} nodes`,
      )
    }

    map.on("zoomend", handleZoomEnd)
    return () => {
      map.off("zoomend", handleZoomEnd)
    }
  }, [allNodes, filterNodesByZoom, mapRef])

  // Load CalSim nodes when toggle is enabled
  useEffect(() => {
    if (isCalSimVisible) {
      loadCalSimNodes()
    } else {
      // Clean up all CalSim-related state
      setAllNodes([])
      setVisibleNodes([])
      setHoveredNode(null)
      setSelectedNode(null)
      setNetworkArcs([])
      setConnectedNodeIds(new Set())
      setIsLoadingNetwork(false)
    }
  }, [isCalSimVisible, loadCalSimNodes])

  // Enhanced network traversal using only the new API
  const handleNodeClick = useCallback(
    async (node: NetworkNode) => {
      if (selectedNode?.id === node.id) {
        setSelectedNode(null)
        setNetworkArcs([])
        setConnectedNodeIds(new Set())
        console.log("Toggled off network for node:", node.name)
        return
      }

      setSelectedNode(node)
      setIsLoadingNetwork(true)

      console.log(
        `🔍 Loading enhanced network for ${node.short_code} (${node.name})`,
      )

      try {
        // Use the enhanced network traversal API directly
        const enhancedUrl = `${API_BASE_URL}/api/network/traverse/${node.short_code}/enhanced?direction=both&max_depth=8`
        console.log(`📡 Fetching: ${enhancedUrl}`)

        const enhancedResponse = await fetch(enhancedUrl)

        if (!enhancedResponse.ok) {
          throw new Error(
            `Enhanced network API failed: ${enhancedResponse.status}`,
          )
        }

        const enhancedData = await enhancedResponse.json()

        if (!isGeoJSONResponse(enhancedData)) {
          throw new Error("Invalid GeoJSON response format")
        }

        const networkData = convertGeoJSONToNetwork(enhancedData)

        console.log(
          `✅ Enhanced network loaded: ${networkData.nodes.length} nodes, ${networkData.arcs.length} arcs`,
        )

        // Build network maps for traversal using all nodes (not just visible ones)
        const { upstreamMap, downstreamMap } = buildNetworkMaps(
          networkData.arcs,
        )

        // Find all connected nodes
        const upstreamNodes = findUpstreamNodes(node.id, upstreamMap)
        const downstreamNodes = findDownstreamNodes(node.id, downstreamMap)
        const allConnectedNodes = new Set([
          ...upstreamNodes,
          ...downstreamNodes,
        ])

        setNetworkArcs(networkData.arcs)
        setConnectedNodeIds(allConnectedNodes)

        console.log(`🌊 Enhanced Network for ${node.name}:`)
        console.log(`  🔼 Upstream nodes: ${upstreamNodes.size}`)
        console.log(`  🔽 Downstream nodes: ${downstreamNodes.size}`)
        console.log(`  🔗 Total connected nodes: ${allConnectedNodes.size}`)
        console.log(`  ➡️ Connected arcs: ${networkData.arcs.length}`)
        console.log(
          `  🎯 Strategies used: ${enhancedData.metadata.strategies_used?.join(", ") || "N/A"}`,
        )
      } catch (error) {
        console.error(
          "Failed to load enhanced network for node:",
          node.name,
          error,
        )
        setSelectedNode(null)
        setNetworkArcs([])
        setConnectedNodeIds(new Set())
      } finally {
        setIsLoadingNetwork(false)
      }
    },
    [selectedNode, buildNetworkMaps, findUpstreamNodes, findDownstreamNodes],
  )

  // Don't render anything if CalSim is not visible
  if (!isCalSimVisible || !visibleNodes.length) {
    return null
  }

  const renderStart = performance.now()
  console.log(
    `🎨 Starting to render ${visibleNodes.length}/${allNodes.length} CalSim markers at zoom ${currentZoom.toFixed(1)}`,
  )

  const jsx = (
    <>
      {/* Enhanced network arcs visualization with depth-based styling */}
      {networkArcs.length > 0 && (
        <Source
          id="calsim-network-arcs"
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: networkArcs.map((arc) => ({
              type: "Feature" as const,
              properties: {
                id: arc.id,
                name: arc.name,
                short_code: arc.short_code,
                arc_type: arc.element_type,
                from_node: arc.from_node,
                to_node: arc.to_node,
                depth: arc.depth || 1,
                strategy: arc.strategy || "direct",
              },
              geometry: arc.geometry,
            })),
          } as GeoJSON.FeatureCollection}
        >
          {/* White outline */}
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
          {/* Colored main layer with depth-based and strategy-based styling */}
          <Layer
            id="calsim-network-arcs-layer"
            type="line"
            paint={{
              "line-color": [
                "case",
                ["==", ["get", "strategy"], "enhanced"],
                "#00ff00", // Green for enhanced connections
                ["==", ["get", "strategy"], "proximity"],
                "#ffff00", // Yellow for proximity connections
                ["==", ["get", "strategy"], "river_sequence"],
                "#00ffff", // Cyan for river sequence
                "#ff0000", // Red for direct connections
              ],
              "line-width": [
                "case",
                ["<=", ["get", "depth"], 2],
                18, // Thicker for closer connections
                ["<=", ["get", "depth"], 4],
                15,
                12, // Thinner for distant connections
              ],
              "line-opacity": [
                "case",
                ["<=", ["get", "depth"], 2],
                1.0, // Full opacity for close connections
                ["<=", ["get", "depth"], 4],
                0.8,
                0.6, // More transparent for distant connections
              ],
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
        </Source>
      )}

      {/* CalSim node markers using map package interface */}
      {visibleNodes.map((node) => {
        const renderStart = performance.now()
        const marker = (
          <Marker
            key={node.id}
            longitude={node.coordinates[0]}
            latitude={node.coordinates[1]}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              console.log("Marker clicked:", node.name)
              handleNodeClick(node)
            }}
          >
            <Box
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={(e) => {
                e.stopPropagation()
                handleNodeClick(node)
              }}
              sx={{
                width: getNodeSize(getMapCategory(node.element_type)),
                height: getNodeSize(getMapCategory(node.element_type)),
                borderRadius: "50%",
                backgroundColor: getNodeColor(
                  node,
                  connectedNodeIds.has(node.id),
                  selectedNode?.id === node.id,
                ),
                border:
                  selectedNode?.id === node.id
                    ? "3px solid #ff6b35"
                    : connectedNodeIds.has(node.id)
                      ? "3px solid #ffeb3b"
                      : isLoadingNetwork && selectedNode?.id === node.id
                        ? "3px solid #ffb366"
                        : "2px solid white",
                cursor: "pointer",
                transition: "all 0.2s ease",
                pointerEvents: "auto",
                zIndex: 9999,
                position: "relative",
                opacity:
                  isLoadingNetwork && selectedNode?.id === node.id ? 0.7 : 1,
                "&:hover": {
                  transform: "scale(1.2)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                },
              }}
            />
          </Marker>
        )
        const renderEnd = performance.now()
        if (renderEnd - renderStart > 5) {
          console.log(
            `⚠️ Slow marker render for ${node.short_code}: ${(renderEnd - renderStart).toFixed(0)}ms`,
          )
        }
        return marker
      })}

      {/* Custom enhanced popup for detailed information */}
      {hoveredNode && (
        <Popup
          longitude={hoveredNode.coordinates[0]}
          latitude={hoveredNode.coordinates[1]}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={[0, -10]}
        >
          <Box sx={{ padding: 1, minWidth: 200 }}>
            <Typography variant="h6" sx={{ mb: 0.5, fontSize: "0.9rem" }}>
              {hoveredNode.display_name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 0.25, fontSize: "0.75rem", color: "text.secondary" }}
            >
              {hoveredNode.short_code} • ID: {hoveredNode.id}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
              <strong>Type:</strong> {hoveredNode.element_type}
              {hoveredNode.subtype ? `-${hoveredNode.subtype}` : ""}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
              <strong>Status:</strong> {hoveredNode.connectivity_status}
            </Typography>
            {hoveredNode.river_name && (
              <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
                <strong>River:</strong> {hoveredNode.river_name}
                {hoveredNode.river_mile && ` (Mile ${hoveredNode.river_mile})`}
              </Typography>
            )}
            {connectedNodeIds.has(hoveredNode.id) &&
              selectedNode?.id !== hoveredNode.id && (
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.8rem", color: "warning.main" }}
                >
                  <strong>Part of active network</strong>
                </Typography>
              )}
            {hoveredNode.strategy && (
              <Typography
                variant="body2"
                sx={{ fontSize: "0.75rem", color: "success.main" }}
              >
                <strong>Connection Strategy:</strong> {hoveredNode.strategy}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.75rem",
                fontStyle: "italic",
                mt: 0.5,
                color:
                  selectedNode?.id === hoveredNode.id
                    ? "primary.main"
                    : connectedNodeIds.has(hoveredNode.id)
                      ? "warning.main"
                      : isLoadingNetwork && selectedNode?.id === hoveredNode.id
                        ? "warning.main"
                        : "text.secondary",
              }}
            >
              {isLoadingNetwork && selectedNode?.id === hoveredNode.id
                ? "Loading enhanced network connections..."
                : selectedNode?.id === hoveredNode.id
                  ? `Showing ${connectedNodeIds.size} connected nodes, ${networkArcs.length} arcs (enhanced network)`
                  : connectedNodeIds.has(hoveredNode.id)
                    ? "Connected to selected network"
                    : "Click for enhanced network analysis"}
            </Typography>
          </Box>
        </Popup>
      )}
    </>
  )

  const renderEnd = performance.now()
  console.log(
    `⏱️ Render JSX creation took: ${(renderEnd - renderStart).toFixed(0)}ms`,
  )

  return jsx
}
