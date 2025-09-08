"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { useMap, Marker, Popup, Source, Layer } from "@repo/map"
import { Box, Typography } from "@repo/ui/mui"
import { useCalSimToggle } from "./CalSimContext"
import { LocationOnIcon } from "@repo/ui/mui"

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
    strategy?: "geopackage_direct" | "xml_with_geometry" | "xml_without_geometry" | "systematic_three_pass"
    has_geometry?: boolean
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
    approach?: string
    pass1_geopackage?: number
    pass2_xml_with_geometry?: number
    pass3_xml_without_geometry?: number
    no_depth_limit?: boolean
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
  has_geometry?: boolean
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
  has_geometry?: boolean
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
      // Skip features without geometry (logical connections)
      if (!feature.geometry || !feature.geometry.coordinates) {
        return
      }
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
        has_geometry: feature.properties.has_geometry,
      })
    } else if (feature.properties.type === "arc") {
      // Skip arcs without geometry (logical connections)
      if (!feature.geometry || !feature.geometry.coordinates) {
        return
      }
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
        has_geometry: feature.properties.has_geometry,
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
  const [networkMetadata, setNetworkMetadata] = useState<any>(null)
  const [showReservoirMarkers, setShowReservoirMarkers] = useState(false)
  const [majorReservoirIds, setMajorReservoirIds] = useState<Set<string>>(new Set())
  
  // Intersection observer to detect when second panel is in view
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log("❌ Window undefined - server side")
      return
    }
    
    console.log("🔍 Setting up intersection observer...")
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        console.log(`📊 Intersection observer triggered with ${entries.length} entries`)
        entries.forEach((entry) => {
          const panelId = entry.target.id
          const isIntersecting = entry.isIntersecting
          const intersectionRatio = entry.intersectionRatio
          
          console.log(`📍 Panel ${panelId}: intersecting=${isIntersecting}, ratio=${intersectionRatio.toFixed(2)}`)
          
          if (panelId === 'scenarios-overlay2' && isIntersecting) {
            setShowReservoirMarkers(true)
            console.log(`🎯 Panel ${panelId} (with image) in view - showing reservoir markers!`)
            
            // Load nodes if not already loaded (for reservoir markers)
            if (allNodes.length === 0) {
              console.log("📡 Loading nodes for reservoir markers...")
              loadCalSimNodes()
            }
          } else if (panelId === 'scenarios-overlay2' && !isIntersecting) {
            setShowReservoirMarkers(false)
            console.log("🎯 Panel scenarios-overlay2 out of view - hiding reservoir markers")
          }
        })
      },
      { 
        threshold: [0, 0.05, 0.1], // Lower thresholds for earlier triggering
        rootMargin: '200px 0px 200px 0px' // Trigger even earlier - 200px before panel
      }
    )
    
    // Observe both scenario panels
    const panel1 = document.getElementById('scenarios-overlay')
    const panel2 = document.getElementById('scenarios-overlay2')
    
    if (panel1 && observerRef.current) {
      observerRef.current.observe(panel1)
      console.log("📍 Observing scenarios-overlay")
    }
    
    if (panel2 && observerRef.current) {
      observerRef.current.observe(panel2)
      console.log("📍 Observing scenarios-overlay2 (with image)")
    }
    
    if (!panel1 && !panel2) {
      console.warn("⚠️ Could not find scenario panels to observe")
      // For testing, show markers after 3 seconds
      setTimeout(() => {
        setShowReservoirMarkers(true)
        console.log("🎯 Test mode - showing reservoir markers after 3s")
      }, 3000)
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Helper functions for node styling with connectivity emphasis
  const getNodeSize = (category: string, isConnected = false, isSelected = false) => {
    let baseSize = 8
    switch (category) {
      case "reservoir":
        baseSize = 16
        break
      case "pump_station":
        baseSize = 12
        break
      case "water_treatment":
        baseSize = 10
        break
      default:
        baseSize = 8
    }
    
    // Emphasize connected and selected nodes for water journey visibility
    if (isSelected) return baseSize * 1.5 // Much larger for selected
    if (isConnected) return baseSize * 1.3 // Larger for connected (part of water flow)
    return baseSize * 0.8 // Smaller for disconnected to emphasize the flow
  }

  const getNodeColor = (
    node: NetworkNode,
    isConnected = false,
    isSelected = false,
  ) => {
    if (isSelected) return "#ff6b35" // Bright orange for selected
    if (isConnected) {
      // Color by strategy/pass
      switch (node.strategy) {
        case "geopackage_direct":
          return "#00e676" // Bright green for geopackage (most reliable)
        case "xml_with_geometry":
          return "#00bcd4" // Cyan for XML with geometry
        case "xml_without_geometry":
          return "#9c27b0" // Purple for logical XML connections
        default:
          return "#00e676" // Default green
      }
    }

    // Bright colors for element types (not muted) - reservoirs now blue
    const baseColor = (() => {
      const category = getMapCategory(node.element_type)
      switch (category) {
        case "reservoir":
          return "#2563eb" // Keep bright blue for reservoirs (consistent with legend)
        case "pump_station":
          return "#dc2626" // Bright red for pump stations
        case "water_treatment":
          return "#059669" // Bright green for treatment
        case "channel":
          return "#8b5cf6" // Bright purple for channels
        default:
          return "#6b7280" // Gray for others
      }
    })()

  return baseColor
}

// Fetch the top 9 major reservoirs by capacity
const fetchMajorReservoirs = useCallback(async () => {
  try {
    console.log("🏞️ Fetching top 9 major reservoirs by capacity...")
    const response = await fetch(
      `${API_BASE_URL}/api/network/elements/search?element_type=STR&sort_by=capacity_taf&sort_order=desc&limit=9`
    )
    
    if (!response.ok) {
      throw new Error(`Major reservoirs API failed: ${response.status}`)
    }
    
    const data = await response.json()
    console.log("✅ Major reservoirs response:", data)
    console.log("📊 Response structure:", Object.keys(data))
    
    // Extract short_codes from the GeoJSON FeatureCollection response
    const reservoirIds = new Set<string>()
    
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      console.log(`📊 Processing ${data.features.length} GeoJSON features`)
      data.features.forEach((feature: any) => {
        console.log("🔍 Processing feature:", feature)
        if (feature.properties) {
          const shortCode = feature.properties.short_code || feature.properties.shortCode || feature.properties.code || feature.properties.id
          if (shortCode) {
            reservoirIds.add(shortCode)
            console.log(`🏞️ Major reservoir: ${shortCode} - ${feature.properties.display_name || feature.properties.name || 'Unknown'}`)
          }
        }
      })
    } else {
      console.warn("⚠️ Expected GeoJSON FeatureCollection, got:", data)
    }
    
    setMajorReservoirIds(reservoirIds)
    console.log(`✅ Loaded ${reservoirIds.size} major reservoir IDs`)
    return reservoirIds
    
  } catch (error) {
    console.error("❌ Failed to fetch major reservoirs:", error)
    return new Set<string>()
  }
}, [])

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
    [allNodes, majorReservoirIds],
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
      let filteredNodes = nodes.filter((node) => {
        if (node.element_type === 'STR') {
          // Filter to major reservoirs using API-provided IDs
          const isMajorReservoir = majorReservoirIds.has(node.short_code)
          if (isMajorReservoir) {
            console.log(`✅ Major reservoir MATCH: ${node.short_code} - "${node.display_name}"`)
          }
          return isMajorReservoir
        }
        // Keep all non-reservoir nodes
        return true
      })

      if (zoom >= 8) {
        // High zoom: show all filtered nodes
        return filteredNodes
      } else if (zoom >= 6) {
        // Medium zoom: show important nodes only
        return filteredNodes.filter(
          (node) =>
            ["STR", "PS", "WTP", "WWTP"].includes(node.element_type) ||
            node.connectivity_status === "connected",
        )
      } else {
        // Low zoom: show only major infrastructure (including filtered reservoirs)
        return filteredNodes.filter((node) => ["STR", "PS"].includes(node.element_type))
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

    try {
      const fetchStart = performance.now()
      // Use ultra-fast nodes API
      const fastUrl = `${API_BASE_URL}/api/network/nodes/fast?bbox=${bbox}&limit=2000`
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
      
      // Log reservoir information
      const reservoirs = validNodes.filter(node => node.element_type === 'STR')
      console.log(`🏞️ Found ${reservoirs.length} total reservoirs in data`)
      
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
      // First fetch major reservoirs, then load nodes
      fetchMajorReservoirs().then(() => {
        loadCalSimNodes()
      })
    } else {
      // Clean up all CalSim-related state
      setAllNodes([])
      setVisibleNodes([])
      setHoveredNode(null)
      setSelectedNode(null)
      setNetworkArcs([])
      setConnectedNodeIds(new Set())
      setIsLoadingNetwork(false)
      setNetworkMetadata(null)
      setMajorReservoirIds(new Set())
    }
  }, [isCalSimVisible, loadCalSimNodes, fetchMajorReservoirs])

  // SYSTEMATIC network traversal using 3-pass approach
  const handleNodeClick = useCallback(
    async (node: NetworkNode) => {
      if (selectedNode?.id === node.id) {
        setSelectedNode(null)
        setNetworkArcs([])
        setConnectedNodeIds(new Set())
        setNetworkMetadata(null)
        console.log("Toggled off network for node:", node.name)
        return
      }

      setSelectedNode(node)
      setIsLoadingNetwork(true)

      console.log(
        `🔍 Loading SYSTEMATIC 3-pass network for ${node.short_code} (${node.name})`,
      )

      try {
        // Use the systematic 3-pass API (no depth limits)
        const systematicUrl = `${API_BASE_URL}/api/network/traverse/${node.short_code}/systematic?direction=both`
        console.log(`📡 Fetching SYSTEMATIC 3-pass API: ${systematicUrl}`)

        const systematicResponse = await fetch(systematicUrl)

        if (!systematicResponse.ok) {
          console.warn(`Systematic API failed: ${systematicResponse.status}, trying fallback...`)
          
          // FALLBACK: Try the simple API if systematic fails
          const fallbackUrl = `${API_BASE_URL}/api/network/traverse/${node.short_code}/simple?direction=both&max_depth=15`
          console.log(`📡 Fallback to simple API: ${fallbackUrl}`)
          
          const fallbackResponse = await fetch(fallbackUrl)
          if (!fallbackResponse.ok) {
            throw new Error(`Both APIs failed: Systematic ${systematicResponse.status}, Simple ${fallbackResponse.status}`)
          }
          
          const fallbackData = await fallbackResponse.json()
          if (!isGeoJSONResponse(fallbackData)) {
            throw new Error("Invalid GeoJSON response format from fallback")
          }
          
          const networkData = convertGeoJSONToNetwork(fallbackData)
          console.log(`✅ Fallback network loaded: ${networkData.nodes.length} nodes, ${networkData.arcs.length} arcs`)
          
          // Process fallback data same as systematic data
          const { upstreamMap, downstreamMap } = buildNetworkMaps(networkData.arcs)
          const upstreamNodes = findUpstreamNodes(node.id, upstreamMap)
          const downstreamNodes = findDownstreamNodes(node.id, downstreamMap)
          const allConnectedNodes = new Set([...upstreamNodes, ...downstreamNodes])

          setNetworkArcs(networkData.arcs)
          setConnectedNodeIds(allConnectedNodes)
          setNetworkMetadata(fallbackData.metadata)
          
          console.log(`🌊 FALLBACK WATER JOURNEY from ${node.name}:`)
          console.log(`  💧 Water sources (upstream): ${upstreamNodes.size}`)
          console.log(`  🚰 Water delivery (downstream): ${downstreamNodes.size}`)
          console.log(`  🔗 Total network: ${allConnectedNodes.size} facilities`)
          console.log(`  🛤️ Connections: ${networkData.arcs.length} pathways`)
          
          return
        }

        const systematicData = await systematicResponse.json()

        if (!isGeoJSONResponse(systematicData)) {
          throw new Error("Invalid GeoJSON response format")
        }

        const networkData = convertGeoJSONToNetwork(systematicData)

        console.log(
          `✅ SYSTEMATIC 3-pass network loaded: ${networkData.nodes.length} nodes, ${networkData.arcs.length} arcs`,
        )
        console.log(`📊 Approach: ${systematicData.metadata.approach || 'systematic_three_pass'}`)
        
        // Log the 3-pass breakdown
        if (systematicData.metadata) {
          console.log(`📊 Pass 1 (Geopackage): ${systematicData.metadata.pass1_geopackage || 0} connections`)
          console.log(`📊 Pass 2 (XML + Geometry): ${systematicData.metadata.pass2_xml_with_geometry || 0} connections`)
          console.log(`📊 Pass 3 (XML Logical): ${systematicData.metadata.pass3_xml_without_geometry || 0} connections`)
          console.log(`📊 No depth limit: ${systematicData.metadata.no_depth_limit ? 'Yes' : 'No'}`)
        }

        // Build network maps for traversal using all nodes (not just visible ones)
        const { upstreamMap, downstreamMap } = buildNetworkMaps(networkData.arcs)

        // Find all connected nodes
        const upstreamNodes = findUpstreamNodes(node.id, upstreamMap)
        const downstreamNodes = findDownstreamNodes(node.id, downstreamMap)
        const allConnectedNodes = new Set([
          ...upstreamNodes,
          ...downstreamNodes,
        ])

        setNetworkArcs(networkData.arcs)
        setConnectedNodeIds(allConnectedNodes)
        setNetworkMetadata(systematicData.metadata)

        console.log(`🌊 SYSTEMATIC WATER JOURNEY from ${node.name}:`)
        console.log(`  💧 Water sources (upstream): ${upstreamNodes.size}`)
        console.log(`  🚰 Water delivery points (downstream): ${downstreamNodes.size}`)
        console.log(`  🔗 Total water network: ${allConnectedNodes.size} facilities`)
        console.log(`  🛤️ Water pathways: ${networkData.arcs.length} connections`)
        console.log(`  🎯 Approach: 3-pass systematic (no depth limits)`)
        
        // Add water flow story context
        if (node.element_type === 'STR') {
          console.log(`💧 This reservoir can deliver water to ${downstreamNodes.size} facilities`)
        } else if (node.element_type === 'PS') {
          console.log(`⚡ This pump station moves water between ${allConnectedNodes.size} facilities`)
        } else if (['WTP', 'WWTP'].includes(node.element_type)) {
          console.log(`🧹 This treatment facility processes water from ${upstreamNodes.size} sources`)
        }
        
        // Performance analysis
        if (allConnectedNodes.size < 5) {
          console.warn(`⚠️ Low connectivity (${allConnectedNodes.size} nodes). This suggests:`)
          console.warn(`   - Pass 1 (geopackage): ${systematicData.metadata?.pass1_geopackage || 0} connections`)
          console.warn(`   - Pass 2 (XML + geo): ${systematicData.metadata?.pass2_xml_with_geometry || 0} connections`)  
          console.warn(`   - Pass 3 (XML logical): ${systematicData.metadata?.pass3_xml_without_geometry || 0} connections`)
          console.warn(`   - Element ${node.short_code} may have limited connectivity in all data sources`)
        } else if (allConnectedNodes.size > 50) {
          console.log(`🎉 Excellent systematic connectivity! Found ${allConnectedNodes.size} connected facilities`)
        }
        
      } catch (error) {
        console.error(
          "Failed to load systematic network for node:",
          node.name,
          error,
        )
        setSelectedNode(null)
        setNetworkArcs([])
        setConnectedNodeIds(new Set())
        setNetworkMetadata(null)
      } finally {
        setIsLoadingNetwork(false)
      }
    },
    [selectedNode, buildNetworkMaps, findUpstreamNodes, findDownstreamNodes],
  )

  // Don't render markers if CalSim is not visible, but allow reservoir markers when panel is in view
  if (!isCalSimVisible && !showReservoirMarkers) {
    return null
  }
  
  // If CalSim is off but reservoir markers should show, render only major reservoir markers
  if (!isCalSimVisible && showReservoirMarkers) {
    console.log("🎯 CalSim off, but showing reservoir markers due to scroll")
    
    const reservoirs = allNodes.filter(node => {
      if (node.element_type !== 'STR') return false
      return majorReservoirIds.has(node.short_code)
    })
    
    console.log(`🏞️ Rendering ${reservoirs.length} major reservoir markers (CalSim off mode)`)
    
    return (
      <>
        {reservoirs.map((reservoir) => (
          <Marker
            key={`reservoir-scroll-${reservoir.id}`}
            longitude={reservoir.coordinates[0]}
            latitude={reservoir.coordinates[1]}
          >
            <Box
              sx={{
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={() => {
                console.log("Scroll reservoir marker clicked:", reservoir.name)
                handleNodeClick(reservoir)
              }}
            >
              <LocationOnIcon
                sx={{
                  fontSize: '2rem',
                  color: '#CD5C5C', // Red from theme
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                  },
                  transition: 'all 0.2s ease',
                }}
              />
            </Box>
          </Marker>
        ))}
      </>
    )
  }

  const renderStart = performance.now()
  console.log(
    `🎨 Starting to render ${visibleNodes.length}/${allNodes.length} CalSim markers at zoom ${currentZoom.toFixed(1)}`,
  )

  const jsx = (
    <>
      {/* Systematic network arcs visualization with strategy-based styling */}
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
                strategy: arc.strategy || "systematic",
                has_geometry: arc.has_geometry || true,
              },
              geometry: arc.geometry,
            })),
          } as GeoJSON.FeatureCollection}
        >
          {/* White outline for visibility */}
          <Layer
            id="calsim-network-arcs-outline"
            type="line"
            paint={{
              "line-color": "#ffffff",
              "line-width": 10,
              "line-opacity": 0.9,
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
          {/* Main arc layer with strategy-based styling */}
          <Layer
            id="calsim-network-arcs-layer"
            type="line"
            paint={{
              "line-color": [
                "case",
                ["==", ["get", "strategy"], "geopackage_direct"],
                "#00e676", // Bright green for geopackage (most reliable)
                ["==", ["get", "strategy"], "xml_with_geometry"], 
                "#00bcd4", // Cyan for XML with geometry
                ["==", ["get", "strategy"], "xml_without_geometry"],
                "#9c27b0", // Purple for logical XML connections
                "#2196f3", // Blue for other connections
              ],
              "line-width": [
                "case",
                ["==", ["get", "strategy"], "geopackage_direct"],
                8, // Thickest for geopackage (most reliable)
                ["==", ["get", "strategy"], "xml_with_geometry"],
                6, // Medium for XML with geometry
                ["==", ["get", "strategy"], "xml_without_geometry"],
                4, // Thinner for logical connections
                5, // Default thickness
              ],
              "line-opacity": [
                "case",
                ["==", ["get", "strategy"], "geopackage_direct"],
                1.0, // Full opacity for most reliable
                ["==", ["get", "strategy"], "xml_with_geometry"],
                0.9,
                ["==", ["get", "strategy"], "xml_without_geometry"],
                0.7, // More transparent for logical
                0.8, // Default opacity
              ],
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
        </Source>
      )}

      {/* Special reservoir markers when second panel is in view */}
      {showReservoirMarkers && (() => {
        console.log(`🔍 showReservoirMarkers=${showReservoirMarkers}, allNodes.length=${allNodes.length}`)
        
        const reservoirs = allNodes.filter(node => {
          if (node.element_type !== 'STR') return false
          return majorReservoirIds.has(node.short_code)
        })
        
        console.log(`🏞️ Found ${reservoirs.length} major reservoirs out of ${allNodes.length} total nodes`)
        
        if (reservoirs.length === 0) {
          console.warn("⚠️ No major reservoirs found in allNodes")
          console.log("📊 Sample node element_types:", allNodes.slice(0, 5).map(n => n.element_type))
        } else {
          console.log("✅ Major reservoirs:", reservoirs.map(r => `${r.short_code} (${r.name})`))
        }
        
        return reservoirs.map((reservoir) => (
          <Marker
            key={`reservoir-${reservoir.id}`}
            longitude={reservoir.coordinates[0]}
            latitude={reservoir.coordinates[1]}
          >
            <Box
              sx={{
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={() => {
                console.log("Reservoir marker clicked:", reservoir.name)
                handleNodeClick(reservoir)
              }}
            >
              <LocationOnIcon
                sx={{
                  fontSize: '2rem',
                  color: '#CD5C5C', // Red from theme.palette.categories.tier4
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                  },
                  transition: 'all 0.2s ease',
                }}
              />
            </Box>
          </Marker>
        ))
      })()}

      {/* CalSim node markers */}
      {visibleNodes.map((node) => {
        const isReservoir = node.element_type === 'STR'
        
        return (
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
            {isReservoir ? (
              // Reservoirs use LocationOnIcon
              <Box
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  handleNodeClick(node)
                }}
                sx={{
                  cursor: "pointer",
                  position: "relative",
                  opacity: isLoadingNetwork && selectedNode?.id === node.id ? 0.7 : 1,
                }}
              >
                <LocationOnIcon
                  sx={{
                    fontSize: getNodeSize(
                      getMapCategory(node.element_type),
                      connectedNodeIds.has(node.id),
                      selectedNode?.id === node.id
                    ) * 1.5, // Slightly larger than circle markers
                    color: getNodeColor(
                      node,
                      connectedNodeIds.has(node.id),
                      selectedNode?.id === node.id,
                    ),
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    '&:hover': {
                      transform: 'scale(1.2)',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                    },
                    transition: 'all 0.2s ease',
                    // Add border effect for selected/connected states
                    ...(selectedNode?.id === node.id && {
                      filter: 'drop-shadow(0 0 0 3px #ff6b35) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }),
                    ...(connectedNodeIds.has(node.id) && selectedNode?.id !== node.id && {
                      filter: 'drop-shadow(0 0 0 2px #ffeb3b) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }),
                  }}
                />
              </Box>
            ) : (
              // Other nodes use circle markers
              <Box
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  handleNodeClick(node)
                }}
                sx={{
                  width: getNodeSize(
                    getMapCategory(node.element_type),
                    connectedNodeIds.has(node.id),
                    selectedNode?.id === node.id
                  ),
                  height: getNodeSize(
                    getMapCategory(node.element_type),
                    connectedNodeIds.has(node.id),
                    selectedNode?.id === node.id
                  ),
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
            )}
          </Marker>
        )
      })}

      {/* Enhanced tooltip with systematic metadata */}
      {hoveredNode && (
        <Popup
          longitude={hoveredNode.coordinates[0]}
          latitude={hoveredNode.coordinates[1]}
          closeButton={false}
          closeOnClick={false}
          maxWidth="350px"
          className="calsim-tooltip"
        >
          <Box sx={{ padding: 1, minWidth: 200, maxWidth: 350 }}>
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
                  <strong>Part of systematic water network</strong>
                </Typography>
              )}
            {hoveredNode.strategy && (
              <Typography
                variant="body2"
                sx={{ fontSize: "0.75rem", color: "success.main" }}
              >
                <strong>Connection:</strong> {
                  hoveredNode.strategy === 'geopackage_direct' ? 'Geopackage (Pass 1)' :
                  hoveredNode.strategy === 'xml_with_geometry' ? 'XML + Geometry (Pass 2)' :
                  hoveredNode.strategy === 'xml_without_geometry' ? 'XML Logical (Pass 3)' :
                  hoveredNode.strategy
                }
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
                ? "Loading systematic 3-pass network (no depth limit)..."
                : selectedNode?.id === hoveredNode.id
                  ? `Showing ${connectedNodeIds.size} connected nodes, ${networkArcs.length} arcs (systematic 3-pass network)`
                  : connectedNodeIds.has(hoveredNode.id)
                    ? "Connected to systematic water network"
                    : "Click to trace systematic water journey (3-pass approach)"}
            </Typography>
            {/* Show network metadata for selected node */}
            {selectedNode?.id === hoveredNode.id && networkMetadata && (
              <Typography
                variant="body2"
                sx={{ fontSize: "0.7rem", mt: 0.5, color: "info.main" }}
              >
                <strong>Network Stats:</strong> Pass1: {networkMetadata.pass1_geopackage || 0}, 
                Pass2: {networkMetadata.pass2_xml_with_geometry || 0}, 
                Pass3: {networkMetadata.pass3_xml_without_geometry || 0}
              </Typography>
            )}
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
