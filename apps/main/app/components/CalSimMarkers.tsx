"use client"

import { useCallback, useState, useEffect, useRef, useMemo } from "react"
import { useMap, Marker, Popup, Source, Layer } from "@repo/map"
import { Box, Typography } from "@repo/ui/mui"
import { useCalSimToggle } from "./CalSimContext"
import { LocationOnIcon } from "@repo/ui/mui"

// ==============================================
// TYPESCRIPT INTERFACES
// ==============================================

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
    river_name?: string
    river_mile?: number
    display_name?: string
    arc_name?: string
    shape_length?: number
    from_node?: string
    to_node?: string
    depth?: number
    strategy?: "geopackage_clean" | "systematic_three_pass"
    has_geometry?: boolean
    capacity_taf?: number
    rank?: number
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
    connectivity_rate?: string
    foundation?: string
  }
}

export interface NetworkNode {
  id: number
  short_code: string
  name: string
    coordinates: [number, number]
  element_type: string
  subtype?: string
  river_name?: string
  river_mile?: number
  connectivity_status: "connected" | "unconnected"
  display_name: string
  depth?: number
  strategy?: string
  has_geometry?: boolean
  capacity_taf?: number
  rank?: number
}

export interface NetworkArc {
  id: number
  short_code: string
  name: string
  geometry: {
    type: "MultiLineString" | "LineString"
    coordinates: number[][] | number[][][]
  }
  element_type: string
  subtype?: string
  arc_name?: string
  shape_length?: number
  from_node: string
  to_node: string
  connectivity_status: "connected" | "unconnected"
  display_name: string
  depth?: number
  strategy?: string
  has_geometry?: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_COEQWAL_API_URL || "https://api.coeqwal.org"

export function isGeoJSONResponse(response: unknown): response is NetworkGeoJSONResponse {
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
        display_name: feature.properties.display_name || feature.properties.short_code,
        depth: feature.properties.depth,
        strategy: feature.properties.strategy,
        has_geometry: feature.properties.has_geometry,
        capacity_taf: feature.properties.capacity_taf,
        rank: feature.properties.rank,
      })
    } else if (feature.properties.type === "arc") {
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
        display_name: feature.properties.display_name || feature.properties.short_code,
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
  
  // Generate unique instance ID to prevent duplicate keys across multiple component instances
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current
  const [allNodes, setAllNodes] = useState<NetworkNode[]>([])
  const [visibleNodes, setVisibleNodes] = useState<NetworkNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [networkArcs, setNetworkArcs] = useState<NetworkArc[]>([])
  const [connectedNodeIds, setConnectedNodeIds] = useState<Set<number>>(new Set())
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false)
  const [networkMetadata, setNetworkMetadata] = useState<NetworkGeoJSONResponse['metadata'] | null>(null)
  const [showReservoirMarkers, setShowReservoirMarkers] = useState(false)
  // Move constants outside component to prevent recreation on every render
  const majorReservoirData = useMemo(() => new Map([
    ['SHSTA', { name: 'Shasta', capacity_taf: 4552.0, rank: 1 }],
    ['OROVL', { name: 'Oroville', capacity_taf: 3537.0, rank: 2 }],
    ['TRNTY', { name: 'Trinity', capacity_taf: 2448.0, rank: 3 }],
    ['MELON', { name: 'New Melones', capacity_taf: 2400.0, rank: 4 }],
    ['SLUIS', { name: 'San Luis', capacity_taf: 2041.0, rank: 5 }],
    ['PEDRO', { name: 'New Don Pedro', capacity_taf: 2030.0, rank: 6 }],
    ['BRYSA', { name: 'Berryessa', capacity_taf: 1602.0, rank: 7 }],
    ['ALMNR', { name: 'Almanor', capacity_taf: 1143.0, rank: 8 }],
    ['MCLRE', { name: 'McClure', capacity_taf: 1025.0, rank: 9 }],
  ]), [])
  
  // Calculate scaling factors for reservoir markers based on TAF values
  const reservoirScaling = useMemo(() => {
    const capacities = Array.from(majorReservoirData.values()).map(r => r.capacity_taf)
    const maxCapacity = Math.max(...capacities)
    const minCapacity = Math.min(...capacities)
    
    // Define size range for markers (in rem)
    const minMarkerSize = 4.5  // Minimum size for smallest reservoir
    const maxMarkerSize = 7    // Maximum size for largest reservoir
    
    // Define circle size range (in rem)
    const minCircleSize = 2    // Minimum circle size
    const maxCircleSize = 3.5  // Maximum circle size
    
    return {
      getMarkerSize: (capacity_taf: number, isSelected: boolean) => {
        const normalizedSize = minMarkerSize + 
          ((capacity_taf - minCapacity) / (maxCapacity - minCapacity)) * 
          (maxMarkerSize - minMarkerSize)
        return isSelected ? normalizedSize * 1.15 : normalizedSize
      },
      getCircleSize: (capacity_taf: number, isSelected: boolean) => {
        const normalizedSize = minCircleSize + 
          ((capacity_taf - minCapacity) / (maxCapacity - minCapacity)) * 
          (maxCircleSize - minCircleSize)
        return isSelected ? normalizedSize * 1.15 : normalizedSize
      },
      getFontSize: (capacity_taf: number) => {
        // Font size scales with circle size but stays readable
        const baseSize = 0.65 + 
          ((capacity_taf - minCapacity) / (maxCapacity - minCapacity)) * 0.25
        return `${baseSize}rem`
      }
    }
  }, [majorReservoirData])
  
  const majorReservoirCodes = useMemo(() => new Set(majorReservoirData.keys()), [majorReservoirData])
  
  // Intersection observer to detect when second panel is in view
  const observerRef = useRef<IntersectionObserver | null>(null)

  // No separate reservoir fetching - using infrastructure trails API only

  // Helper functions for styling
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
    
    if (isSelected) return baseSize * 1.5
    if (isConnected) return baseSize * 1.3
    return baseSize * 0.8
  }

  const getNodeColor = (node: NetworkNode, isConnected = false, isSelected = false) => {
    if (isSelected) return "#ff6b35"
    if (isConnected) return "#00e676"

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
  }

  // Network traversal functions
  const buildNetworkMaps = useCallback(
    (arcs: NetworkArc[]) => {
      const upstreamMap = new Map<number, number[]>()
      const downstreamMap = new Map<number, number[]>()

      arcs.forEach((arc) => {
        const fromNodeId = allNodes.find((n) => n.short_code === arc.from_node)?.id
        const toNodeId = allNodes.find((n) => n.short_code === arc.to_node)?.id

        if (fromNodeId && toNodeId) {
          if (!upstreamMap.has(toNodeId)) {
            upstreamMap.set(toNodeId, [])
          }
          upstreamMap.get(toNodeId)!.push(fromNodeId)

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

  const findUpstreamNodes = useCallback(
    (nodeId: number, upstreamMap: Map<number, number[]>, visited = new Set<number>()): Set<number> => {
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

  const findDownstreamNodes = useCallback(
    (nodeId: number, downstreamMap: Map<number, number[]>, visited = new Set<number>()): Set<number> => {
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

  // Filter nodes to show major reservoirs prominently
  const filterNodesByZoom = useCallback(
    (nodes: NetworkNode[], zoom: number): NetworkNode[] => {
      // Always prioritize major reservoirs
      // Infrastructure trails API now includes the 9 major reservoirs
      // No additional filtering needed - it's already curated

      // Apply zoom filtering
      if (zoom >= 8) {
        return nodes
      } else if (zoom >= 6) {
        return nodes.filter(
          (node) =>
            ["STR", "PS", "WTP", "WWTP"].includes(node.element_type) ||
            node.connectivity_status === "connected",
        )
      } else {
        return nodes.filter((node) => ["STR", "PS"].includes(node.element_type))
      }
    },
    [],
  )

  // Load CalSim nodes using the new clean geopackage API
  const loadCalSimNodes = useCallback(async () => {
    const startTime = performance.now()
    console.log("🚀 Starting CalSim node loading with CLEAN GEOPACKAGE API...")

    if (!mapRef.current) return

    const map = mapRef.current.getMap()
    if (!map) return

    const bounds = map.getBounds()
    if (!bounds) return

    const zoom = map.getZoom()

    try {
      const fetchStart = performance.now()
      // Use the infrastructure trails API to get curated infrastructure nodes
      const trailsUrl = `${API_BASE_URL}/api/network/trails/overview?trail_type=infrastructure`
      console.log("⚡ Fetching INFRASTRUCTURE TRAILS API...")
      console.log("🎯 URL:", trailsUrl)

      const geoJsonResponse = await fetch(trailsUrl)
      const fetchEnd = performance.now()
      console.log(`⏱️ Infrastructure trails API fetch took: ${(fetchEnd - fetchStart).toFixed(0)}ms`)

      if (!geoJsonResponse.ok) {
        throw new Error(`All nodes API failed: ${geoJsonResponse.status}`)
      }

      const geoJsonData = await geoJsonResponse.json()
      console.log("📊 Infrastructure trails response:", geoJsonData.metadata)

      if (!isGeoJSONResponse(geoJsonData)) {
        throw new Error("Invalid GeoJSON response format")
      }

      const { nodes } = convertGeoJSONToNetwork(geoJsonData)
      const validNodes = nodes.filter((node): node is NetworkNode => {
        if (!node?.coordinates) return false
        const [lng, lat] = node.coordinates
        return typeof lng === "number" && typeof lat === "number" && !isNaN(lng) && !isNaN(lat)
      })

      // Deduplicate nodes by ID to fix API duplicate issue
      const uniqueNodesMap = new Map<number, NetworkNode>()
      validNodes.forEach(node => {
        if (!uniqueNodesMap.has(node.id)) {
          uniqueNodesMap.set(node.id, node)
        }
      })
      const deduplicatedNodes = Array.from(uniqueNodesMap.values())

      console.log(`📊 Infrastructure trails loaded: ${validNodes.length} total → ${deduplicatedNodes.length} unique nodes`)

      setAllNodes(deduplicatedNodes)
      const filteredNodes = filterNodesByZoom(deduplicatedNodes, zoom)
      setVisibleNodes(filteredNodes)

      const totalTime = performance.now() - startTime
      console.log(`✅ Infrastructure trails loading complete: ${totalTime.toFixed(0)}ms`)
      console.log(`📊 Loaded ${deduplicatedNodes.length} infrastructure nodes, showing ${filteredNodes.length} at zoom ${zoom.toFixed(1)}`)
      
      const reservoirs = deduplicatedNodes.filter(node => node.element_type === 'STR')
      console.log(`🏞️ Found ${reservoirs.length} total reservoirs`)
      
    } catch (error) {
      console.error("❌ Failed to load CalSim nodes:", error)
      setAllNodes([])
      setVisibleNodes([])
    }
  }, [mapRef, filterNodesByZoom])

  // Setup intersection observer after loadCalSimNodes is defined
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const panelId = entry.target.id
          const isIntersecting = entry.isIntersecting
          
          if (panelId === 'scenarios-overlay2' && isIntersecting) {
            setShowReservoirMarkers(true)
            console.log(`🎯 Panel in view - showing reservoir markers!`)
            
            loadCalSimNodes()
          } else if (panelId === 'scenarios-overlay2' && !isIntersecting) {
            setShowReservoirMarkers(false)
          }
        })
      },
      { threshold: [0.1], rootMargin: '100px' }
    )
    
    const panel2 = document.getElementById('scenarios-overlay2')
    if (panel2 && observerRef.current) {
      observerRef.current.observe(panel2)
    }
    
    if (!panel2) {
      setTimeout(() => {
        setShowReservoirMarkers(true)
        loadCalSimNodes()
      }, 2000)
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadCalSimNodes])

  // Load nodes when CalSim toggle is enabled
  useEffect(() => {
    if (isCalSimVisible) {
      loadCalSimNodes()
    } else {
      setAllNodes([])
      setVisibleNodes([])
      setHoveredNode(null)
      setSelectedNode(null)
      setNetworkArcs([])
      setConnectedNodeIds(new Set())
      setIsLoadingNetwork(false)
      setNetworkMetadata(null)
    }
  }, [isCalSimVisible, loadCalSimNodes])

  // NEW: Clean geopackage network traversal
  const handleNodeClick = useCallback(
    async (node: NetworkNode) => {
    if (selectedNode?.id === node.id) {
      setSelectedNode(null)
      setNetworkArcs([])
      setConnectedNodeIds(new Set())
        setNetworkMetadata(null)
      return
    }

    setSelectedNode(node)
    setIsLoadingNetwork(true)
    
      console.log(`🔍 Loading CLEAN GEOPACKAGE network for ${node.short_code} (${node.name})`)

      try {
        // NEW: Use clean geopackage traversal API
        const geopackageUrl = `${API_BASE_URL}/api/network/traverse/${node.short_code}/geopackage?direction=both&max_depth=15`
        console.log(`📡 Fetching CLEAN GEOPACKAGE API: ${geopackageUrl}`)

        const geopackageResponse = await fetch(geopackageUrl)

        if (!geopackageResponse.ok) {
          console.warn(`Clean geopackage API failed: ${geopackageResponse.status}, trying fallback...`)
          
          // FALLBACK: Try systematic API
          const fallbackUrl = `${API_BASE_URL}/api/network/traverse/${node.short_code}/systematic?direction=both`
          const fallbackResponse = await fetch(fallbackUrl)
          
          if (!fallbackResponse.ok) {
            throw new Error(`Both APIs failed: Geopackage ${geopackageResponse.status}, Systematic ${fallbackResponse.status}`)
          }
          
          const fallbackData = await fallbackResponse.json()
          if (!isGeoJSONResponse(fallbackData)) {
            throw new Error("Invalid GeoJSON response format from fallback")
          }
          
          const networkData = convertGeoJSONToNetwork(fallbackData)
          const { upstreamMap, downstreamMap } = buildNetworkMaps(networkData.arcs)
      const upstreamNodes = findUpstreamNodes(node.id, upstreamMap)
      const downstreamNodes = findDownstreamNodes(node.id, downstreamMap)
      const allConnectedNodes = new Set([...upstreamNodes, ...downstreamNodes])
      
          setNetworkArcs(networkData.arcs)
      setConnectedNodeIds(allConnectedNodes)
          setNetworkMetadata(fallbackData.metadata)
          
          console.log(`🌊 FALLBACK network: ${allConnectedNodes.size} facilities, ${networkData.arcs.length} pathways`)
          return
        }

        const geopackageData = await geopackageResponse.json()

        if (!isGeoJSONResponse(geopackageData)) {
          throw new Error("Invalid GeoJSON response format")
        }

        const networkData = convertGeoJSONToNetwork(geopackageData)

        console.log(`✅ CLEAN GEOPACKAGE network loaded: ${networkData.nodes.length} nodes, ${networkData.arcs.length} arcs`)
        console.log(`📊 Foundation: ${geopackageData.metadata.foundation || 'clean_geopackage'}`)
        console.log(`📊 Connectivity: ${geopackageData.metadata.connectivity_rate || 'N/A'}`)

        const { upstreamMap, downstreamMap } = buildNetworkMaps(networkData.arcs)
        const upstreamNodes = findUpstreamNodes(node.id, upstreamMap)
        const downstreamNodes = findDownstreamNodes(node.id, downstreamMap)
        const allConnectedNodes = new Set([...upstreamNodes, ...downstreamNodes])

        setNetworkArcs(networkData.arcs)
        setConnectedNodeIds(allConnectedNodes)
        setNetworkMetadata(geopackageData.metadata)

        console.log(`🌊 CLEAN GEOPACKAGE WATER JOURNEY from ${node.name}:`)
        console.log(`  💧 Water sources (upstream): ${upstreamNodes.size}`)
        console.log(`  🚰 Water delivery (downstream): ${downstreamNodes.size}`)
        console.log(`  🔗 Total network: ${allConnectedNodes.size} facilities`)
        console.log(`  🛤️ Pathways: ${networkData.arcs.length} connections`)
        console.log(`  🎯 Foundation: Clean geopackage with ${geopackageData.metadata.connectivity_rate || '99.7%'} connectivity`)
        
        if (allConnectedNodes.size > 20) {
          console.log(`🎉 Excellent geopackage connectivity! Found ${allConnectedNodes.size} connected facilities`)
        }
        
    } catch (error) {
        console.error("Failed to load geopackage network:", error)
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

  // Don't render if CalSim is not visible and reservoir markers shouldn't show
  if (!isCalSimVisible && !showReservoirMarkers) {
    return null
  }

  // Filter visible nodes based on CalSim visibility and reservoir marker state
  const nodesToRender = isCalSimVisible 
    ? visibleNodes // Show all infrastructure when CalSim is on
    : allNodes.filter(node => node.element_type === 'STR' && majorReservoirCodes.has(node.short_code)) // Only major reservoirs when CalSim is off

  // Regular CalSim markers
  console.log(`🎨 Rendering CalSim markers: ${nodesToRender.length} nodes (CalSim: ${isCalSimVisible}, ReservoirMarkers: ${showReservoirMarkers})`)

  return (
    <>

      {/* Clean geopackage network arcs */}
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
                strategy: arc.strategy || "geopackage_clean",
                depth: arc.depth || 1,
              },
              geometry: arc.geometry,
            })),
          } as GeoJSON.FeatureCollection}
        >
          <Layer
            id="calsim-network-arcs-outline"
            type="line"
            paint={{
              "line-color": "#ffffff",
              "line-width": 8,
              "line-opacity": 0.9,
            }}
          />
          <Layer
            id="calsim-network-arcs-layer"
            type="line"
            paint={{
              "line-color": "#00e676", // Clean green for geopackage
              "line-width": 5,
              "line-opacity": 0.8,
            }}
          />
        </Source>
      )}

      {/* CalSim node markers with reservoir emphasis */}
      {nodesToRender.map((node) => {
        const isReservoir = node.element_type === 'STR'
        // Only show special styling for top 9 reservoirs by capacity
        const isMajorReservoir = isReservoir && majorReservoirCodes.has(node.short_code)
        const isSelected = selectedNode?.id === node.id
        
        return (
        <Marker
            key={`${instanceId}-calsim-${node.id}-${node.short_code}`} // Unique key with instance ID
            longitude={node.coordinates[0]}
            latitude={node.coordinates[1]}
          >
            {isMajorReservoir ? (
              <Box
                onMouseEnter={() => setHoveredNode(node)}
            onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
            sx={{
              cursor: "pointer",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start', // Align to start to accommodate label
                  gap: 1, // Space between marker and label
                }}
              >
                {/* Location icon with TAF circle - wrapped in relative container */}
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(() => {
                    const reservoirInfo = majorReservoirData.get(node.short_code)
                    const capacity = reservoirInfo?.capacity_taf || 1000
                    const markerSize = reservoirScaling.getMarkerSize(capacity, isSelected)
                    const circleSize = reservoirScaling.getCircleSize(capacity, isSelected)
                    const fontSize = reservoirScaling.getFontSize(capacity)
                    
                    return (
                      <>
                        <LocationOnIcon
                          sx={{
                            fontSize: `${markerSize}rem`,
                            color: (theme) => isSelected ? '#ff6b35' : theme.palette.brand.sky,
                            filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.15))${isSelected 
                              ? ' drop-shadow(0 0 0 3px #ff6b35)'
                              : ''}`,
                            '&:hover': { transform: 'scale(1.05)' },
                            transition: 'all 0.2s ease',
                          }}
                        />
                        {/* Circle with TAF value inside the location icon */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '18%', // Position in the main body of the location icon
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: `${circleSize}rem`,
                            height: `${circleSize}rem`,
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            border: '1px solid rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: fontSize,
                            lineHeight: 1,
                            fontWeight: 'bold',
                            color: '#333',
                            pointerEvents: 'none', // Don't interfere with click events
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)', // Subtle inner shadow for depth
                          }}
                        >
                          {reservoirInfo?.capacity_taf 
                            ? `${(reservoirInfo.capacity_taf / 1000).toFixed(1)}K`
                            : '?'}
                        </Box>
                      </>
                    )
                  })()}
                </Box>
                
                {/* Reservoir name label */}
                <Box
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    boxShadow: (theme) => theme.shadows[1],
                    pointerEvents: 'none',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#333',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {node.display_name}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
                sx={{
                  width: getNodeSize(
                    getMapCategory(node.element_type),
                    connectedNodeIds.has(node.id),
                    isSelected
                  ),
                  height: getNodeSize(
                    getMapCategory(node.element_type),
                    connectedNodeIds.has(node.id),
                    isSelected
                  ),
                  borderRadius: "50%",
                  backgroundColor: getNodeColor(node, connectedNodeIds.has(node.id), isSelected),
                  border: isSelected ? "3px solid #ff6b35" : "2px solid white",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { transform: "scale(1.2)" },
                }}
              />
            )}
          </Marker>
        )
      })}

      {/* Enhanced tooltip */}
      {hoveredNode && (
        <Popup
          longitude={hoveredNode.coordinates[0]}
          latitude={hoveredNode.coordinates[1]}
          closeButton={false}
          closeOnClick={false}
          maxWidth="350px"
        >
          <Box sx={{ padding: 1, minWidth: 200, maxWidth: 350 }}>
            <Typography variant="h6" sx={{ mb: 0.5, fontSize: "0.9rem" }}>
              {hoveredNode.display_name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.75rem", color: "text.secondary" }}>
              {hoveredNode.short_code} • ID: {hoveredNode.id}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
              <strong>Type:</strong> {hoveredNode.element_type}
              {hoveredNode.subtype ? `-${hoveredNode.subtype}` : ""}
            </Typography>
            {hoveredNode.capacity_taf && (
              <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
                <strong>Capacity:</strong> {hoveredNode.capacity_taf.toLocaleString()} TAF
                {hoveredNode.rank && ` (Rank #${hoveredNode.rank})`}
                  </Typography>
                )}
            {hoveredNode.river_name && (
              <Typography variant="body2" sx={{ mb: 0.25, fontSize: "0.8rem" }}>
                <strong>River:</strong> {hoveredNode.river_name}
                {hoveredNode.river_mile && ` (Mile ${hoveredNode.river_mile})`}
                  </Typography>
                )}
            {connectedNodeIds.has(hoveredNode.id) && selectedNode?.id !== hoveredNode.id && (
                  <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "warning.main" }}>
                <strong>Part of clean geopackage network</strong>
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                    mt: 0.5,
                color: selectedNode?.id === hoveredNode.id ? "primary.main" : "text.secondary",
              }}
            >
              {isLoadingNetwork && selectedNode?.id === hoveredNode.id
                ? "Loading clean geopackage network (99.7% connectivity)..."
                : selectedNode?.id === hoveredNode.id
                  ? `Showing ${connectedNodeIds.size} connected nodes, ${networkArcs.length} arcs (clean geopackage foundation)`
                  : "Click to trace water journey (clean geopackage network)"}
            </Typography>
            {selectedNode?.id === hoveredNode.id && networkMetadata && (
              <Typography variant="body2" sx={{ fontSize: "0.7rem", mt: 0.5, color: "info.main" }}>
                <strong>Foundation:</strong> {networkMetadata.foundation || 'clean_geopackage'} • 
                <strong>Connectivity:</strong> {networkMetadata.connectivity_rate || '99.7%'}
                </Typography>
            )}
              </Box>
            </Popup>
          )}
    </>
  )
}
