type Coordinate = [number, number]

type LineGeometry = {
  type: "LineString" | "MultiLineString"
  coordinates: Coordinate[] | Coordinate[][]
}

type LineFeature = {
  type: "Feature"
  properties?: Record<string, unknown> | null
  geometry?: LineGeometry | null
}

export type LineFeatureCollection = {
  type: "FeatureCollection"
  features: LineFeature[]
}

function getLineCoordinates(geometry?: LineGeometry | null): Coordinate[][] {
  if (!geometry) return []
  if (geometry.type === "LineString")
    return [geometry.coordinates as Coordinate[]]
  if (geometry.type === "MultiLineString")
    return geometry.coordinates as Coordinate[][]
  return []
}

function getAllCoordinates(data: LineFeatureCollection): Coordinate[] {
  return data.features.flatMap((feature) =>
    getLineCoordinates(feature.geometry).flat(),
  )
}

function getProjectionCenter(coordinates: Coordinate[]) {
  const [sumLng, sumLat] = coordinates.reduce(
    ([lngTotal, latTotal], [lng, lat]) => [lngTotal + lng, latTotal + lat],
    [0, 0],
  )

  return {
    lng: sumLng / coordinates.length,
    lat: sumLat / coordinates.length,
  }
}

export function createLocalProjector(coordinates: Coordinate[]) {
  const center = getProjectionCenter(coordinates)
  const latScale = 111_320
  const lngScale = latScale * Math.cos((center.lat * Math.PI) / 180)

  return {
    project([lng, lat]: Coordinate): Coordinate {
      return [(lng - center.lng) * lngScale, (lat - center.lat) * latScale]
    },
    unproject([x, y]: Coordinate): Coordinate {
      return [center.lng + x / lngScale, center.lat + y / latScale]
    },
  }
}

function snapAngleToOctilinear(angle: number) {
  const increment = Math.PI / 4
  return Math.round(angle / increment) * increment
}

export function octilinearizeProjectedLine(line: Coordinate[]): Coordinate[] {
  if (line.length < 2) return line

  const [first, ...rest] = line
  const result: Coordinate[] = [first!]

  rest.forEach((point, index) => {
    const previousOriginal = line[index]!
    const previousMetro = result[result.length - 1]!
    const dx = point[0] - previousOriginal[0]
    const dy = point[1] - previousOriginal[1]
    const length = Math.hypot(dx, dy)

    if (length === 0) return

    const angle = snapAngleToOctilinear(Math.atan2(dy, dx))
    result.push([
      previousMetro[0] + Math.cos(angle) * length,
      previousMetro[1] + Math.sin(angle) * length,
    ])
  })

  return result
}

export function octilinearizeGeojson(
  data: LineFeatureCollection,
): LineFeatureCollection {
  const coordinates = getAllCoordinates(data)
  const projector = createLocalProjector(coordinates)

  return {
    ...data,
    features: data.features.map((feature) => {
      const geometry = feature.geometry

      if (!geometry) return feature

      if (geometry.type === "LineString") {
        const projected = (geometry.coordinates as Coordinate[]).map(
          (coordinate) => projector.project(coordinate),
        )

        return {
          ...feature,
          geometry: {
            ...geometry,
            coordinates: octilinearizeProjectedLine(projected).map(
              (coordinate) => projector.unproject(coordinate),
            ),
          },
        }
      }

      return {
        ...feature,
        geometry: {
          ...geometry,
          coordinates: (geometry.coordinates as Coordinate[][]).map((line) => {
            const projected = line.map((coordinate) =>
              projector.project(coordinate),
            )
            return octilinearizeProjectedLine(projected).map((coordinate) =>
              projector.unproject(coordinate),
            )
          }),
        },
      }
    }),
  }
}

export function combineLineFeatureCollections(
  collections: Array<{
    id: string
    name: string
    data: LineFeatureCollection
  }>,
): LineFeatureCollection {
  return {
    type: "FeatureCollection",
    features: collections.flatMap(({ id, name, data }) =>
      data.features.map((feature, index) => ({
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          metro_river_id: id,
          metro_river_name: name,
          metro_feature_index: index,
        },
      })),
    ),
  }
}
